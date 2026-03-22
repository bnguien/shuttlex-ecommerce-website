from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderAddress, ShippingMethod, OrderStatus
from .serializers import CheckoutSerializer, OrderAddressSerializer, OrderSerializer, AdminOrderSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def shipping_methods(request):
	default_codes = [
		ShippingMethod.ShippingName.GHN,
		ShippingMethod.ShippingName.GHHT,
		ShippingMethod.ShippingName.GHTK,
	]
	for code in default_codes:
		ShippingMethod.get_method_by_code(code)

	methods = ShippingMethod.objects.filter(is_active=True).order_by("base_cost", "name")
	data = [
		{
			"id": method.id,
			"name": method.name,
			"code": method.code,
			"base_cost": str(method.base_cost),
			"estimate_delivery_days": method.estimate_delivery_days,
			"description": method.description,
		}
		for method in methods
	]
	return Response(data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def order_addresses(request):
	if request.method == "GET":
		qs = OrderAddress.objects.filter(user=request.user).order_by("-id")
		return Response(OrderAddressSerializer(qs, many=True).data)

	serializer = OrderAddressSerializer(data=request.data)
	serializer.is_valid(raise_exception=True)
	address = serializer.save(user=request.user)
	return Response(OrderAddressSerializer(address).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
	serializer = CheckoutSerializer(data=request.data, context={"request": request})
	serializer.is_valid(raise_exception=True)
	try:
		order = serializer.save()
	except ValueError as exc:
		return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

	return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_orders(request):
	orders = (
		Order.objects.filter(user=request.user)
		.select_related("shipping_address")
		.prefetch_related("items")
		.order_by("-created_at")
	)
	return Response(OrderSerializer(orders, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_detail(request, code):
	order = (
		Order.objects.filter(user=request.user, code=code)
		.select_related("shipping_address")
		.prefetch_related("items")
		.first()
	)
	if not order:
		return Response({"detail": "Không tìm thấy đơn hàng."}, status=status.HTTP_404_NOT_FOUND)
	return Response(OrderSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_orders(request):
	if not (request.user.is_staff or request.user.is_superuser):
		return Response({"detail": "Bạn không có quyền truy cập."}, status=status.HTTP_403_FORBIDDEN)

	orders = (
		Order.objects.select_related("user")
		.prefetch_related("items")
		.order_by("-created_at")
	)
	return Response(AdminOrderSerializer(orders, many=True).data)


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_order_detail(request, order_id):
	if not (request.user.is_staff or request.user.is_superuser):
		return Response({"detail": "Bạn không có quyền truy cập."}, status=status.HTTP_403_FORBIDDEN)

	order = Order.objects.filter(id=order_id).first()
	if not order:
		return Response({"detail": "Không tìm thấy đơn hàng."}, status=status.HTTP_404_NOT_FOUND)

	if request.method == "PATCH":
		new_status = request.data.get("status")
		valid_statuses = set(OrderStatus.values)
		if new_status not in valid_statuses:
			return Response(
				{"detail": "Trạng thái đơn hàng không hợp lệ."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if order.status != new_status:
			order.status = new_status
			order.save()

		return Response(AdminOrderSerializer(order).data)

	order.delete()
	return Response(status=status.HTTP_204_NO_CONTENT)
