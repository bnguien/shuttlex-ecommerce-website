from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import FlashSale, Voucher, VoucherUsage, VoucherTypeOption, DiscountTypeOption
from .serializers import (
    ApplyVoucherSerializer,
    FlashSaleSerializer,
    FlashSaleWriteSerializer,
    VoucherDetailSerializer,
    VoucherResponseSerializer,
    VoucherSerializer,
    VoucherUsageSerializer,
    VoucherWriteSerializer,
    VoucherTypeOptionSerializer,
    DiscountTypeOptionSerializer,
)

# Create your views here.
@api_view(["GET"])
@permission_classes([AllowAny])
def voucher_type_options(request):
    options = VoucherTypeOption.objects.all()
    serializer = VoucherTypeOptionSerializer(options, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def discount_type_options(request):
    options = DiscountTypeOption.objects.all()
    serializer = DiscountTypeOptionSerializer(options, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def voucher_list(request):
    vouchers = Voucher.objects.filter(is_active=True, end_date__gt=timezone.now())
    serializer = VoucherResponseSerializer(vouchers, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def voucher_detail(request, code):
    try:
        voucher = Voucher.objects.get(code=code, is_active=True, end_date__gt=timezone.now())
    except Voucher.DoesNotExist:
        return Response({"detail": "Không tìm thấy voucher."}, status=404)

    serializer = VoucherResponseSerializer(voucher)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def voucher_create(request):
    serializer = VoucherWriteSerializer(data=request.data)
    if serializer.is_valid():
        voucher = serializer.save()
        return Response(VoucherDetailSerializer(voucher).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def voucher_update(request, code):
    try:
        voucher = Voucher.objects.get(code=code)
    except Voucher.DoesNotExist:
        return Response({"detail": "Không tìm thấy voucher."}, status=404)

    partial = request.method == "PATCH"
    serializer = VoucherWriteSerializer(voucher, data=request.data, partial=partial)
    if serializer.is_valid():
        voucher = serializer.save()
        return Response(VoucherDetailSerializer(voucher).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def voucher_delete(request, code):
    try:
        voucher = Voucher.objects.get(code=code)
    except Voucher.DoesNotExist:
        return Response({"detail": "Không tìm thấy voucher."}, status=404)

    voucher.delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_voucher_usages(request):
    usages = VoucherUsage.objects.filter(user=request.user).select_related("voucher", "order")
    serializer = VoucherUsageSerializer(usages, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def apply_voucher(request):
    payload = ApplyVoucherSerializer(data=request.data)
    if not payload.is_valid():
        return Response(payload.errors, status=400)

    code = payload.validated_data["code"]
    order_subtotal = payload.validated_data["order_subtotal"]
    shipping_fee = payload.validated_data.get("shipping_fee")

    now = timezone.now()

    try:
        voucher = Voucher.objects.get(
            code=code,
            is_active=True,
            start_date__lte=now,
            end_date__gt=now,
        )
    except Voucher.DoesNotExist:
        return Response({"error": "Không tìm thấy voucher hoặc voucher đã hết hạn."}, status=404)

    if not voucher.is_available():
        return Response({"error": "Voucher đã hết lượt sử dụng."}, status=400)

    if VoucherUsage.objects.filter(voucher=voucher, user=request.user).exists():
        return Response({"error": "Bạn đã sử dụng voucher này rồi."}, status=400)

    if voucher.new_customer_only:
        has_previous_orders = request.user.orders.exclude(status="CANCELLED").exists()
        if has_previous_orders:
            return Response({"error": "Voucher chỉ áp dụng cho khách hàng đặt đơn lần đầu."}, status=400)

    discount_amount = voucher.calculate_discount(order_subtotal, shipping_fee)
    if discount_amount == 0:
        return Response({"error": "Voucher không hợp lệ cho đơn hàng này."}, status=400)

    return Response({
        "code": voucher.code,
        "description": voucher.description,
        "voucher_type": {
            "id": voucher.voucher_type.id,
            "code": voucher.voucher_type.code,
            "label": voucher.voucher_type.label,
        },
        "discount_type": {
            "id": voucher.discount_type.id,
            "code": voucher.discount_type.code,
            "label": voucher.discount_type.label,
        },
        "value": str(voucher.value),
        "min_order_value": str(voucher.min_order_value),
        "max_discount_amount": str(voucher.max_discount_amount) if voucher.max_discount_amount else None,
        "discount_amount": str(discount_amount),  
    })

@api_view(["GET"])
@permission_classes([AllowAny])
def active_flash_sale_voucher(request):
    now = timezone.now()
    flash_sales = FlashSale.objects.filter(
        is_active=True,
        start_time__lte=now,
        end_time__gte=now,
    ).order_by("start_time")
    serializer = FlashSaleSerializer(flash_sales, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAdminUser])
def flash_sale_admin_list(request):
    flash_sales = FlashSale.objects.all().order_by("-created_at")
    serializer = FlashSaleSerializer(flash_sales, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def upcoming_flash_sale_voucher(request):
    now = timezone.now()
    upcoming_sales = FlashSale.objects.filter(
        is_active=True,
        start_time__gt=now,
    ).order_by("start_time")
    serializer = FlashSaleSerializer(upcoming_sales, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def flash_sale_create(request):
    serializer = FlashSaleWriteSerializer(data=request.data)
    if serializer.is_valid():
        flash_sale = serializer.save()
        return Response(FlashSaleSerializer(flash_sale).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def flash_sale_update(request, sale_id):
    try:
        flash_sale = FlashSale.objects.get(pk=sale_id)
    except FlashSale.DoesNotExist:
        return Response({"detail": "Không tìm thấy flash sale."}, status=404)

    serializer = FlashSaleWriteSerializer(
        flash_sale,
        data=request.data,
        partial=request.method == "PATCH",
    )
    if serializer.is_valid():
        flash_sale = serializer.save()
        return Response(FlashSaleSerializer(flash_sale).data)
    return Response(serializer.errors, status=400)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def flash_sale_delete(request, sale_id):
    try:
        flash_sale = FlashSale.objects.get(pk=sale_id)
    except FlashSale.DoesNotExist:
        return Response({"detail": "Không tìm thấy flash sale."}, status=404)

    flash_sale.delete()
    return Response(status=204)