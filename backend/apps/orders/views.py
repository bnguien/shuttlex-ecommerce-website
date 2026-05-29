from rest_framework import status as http_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderAddress, ShippingMethod, OrderStatus
from .serializers import CheckoutSerializer, OrderAddressSerializer, OrderSerializer, AdminOrderSerializer
from .utils import calculate_distance, calculate_shipping_fee

# Define status transition rules: map each status to allowed next statuses
STATUS_TRANSITIONS = {
	OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.PACKING, OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
	OrderStatus.CONFIRMED: [OrderStatus.PACKING, OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
	OrderStatus.PACKING: [OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.CANCELLED],
	OrderStatus.SHIPPING: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
	OrderStatus.DELIVERED: [],
	OrderStatus.CANCELLED: [],
}


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
	return Response(OrderAddressSerializer(address).data, status=http_status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def checkout(request):
	serializer = CheckoutSerializer(data=request.data, context={"request": request})
	serializer.is_valid(raise_exception=True)
	try:
		order = serializer.save()
	except ValueError as exc:
		return Response({"detail": str(exc)}, status=http_status.HTTP_400_BAD_REQUEST)

	return Response(OrderSerializer(order).data, status=http_status.HTTP_201_CREATED)


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


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def order_detail(request, code):
	order = (
		Order.objects.filter(user=request.user, code=code)
		.select_related("shipping_address")
		.prefetch_related("items")
		.first()
	)
	if not order:
		return Response({"detail": "Không tìm thấy đơn hàng."}, status=http_status.HTTP_404_NOT_FOUND)

	if request.method == "PATCH":
		new_status = request.data.get("status")
		if new_status != OrderStatus.CANCELLED:
			return Response(
				{"detail": "Bạn chỉ có thể hủy đơn hàng."},
				status=http_status.HTTP_400_BAD_REQUEST,
			)

		if order.status != OrderStatus.CONFIRMED:
			return Response(
				{"detail": "Chỉ đơn hàng ở trạng thái 'Đã xác nhận' mới có thể hủy."},
				status=http_status.HTTP_400_BAD_REQUEST,
			)

		order.status = OrderStatus.CANCELLED
		order.save(update_fields=["status", "updated_at"])
		return Response(OrderSerializer(order).data)

	return Response(OrderSerializer(order).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_orders(request):
	if not (request.user.is_staff or request.user.is_superuser):
		return Response({"detail": "Bạn không có quyền truy cập."}, status=http_status.HTTP_403_FORBIDDEN)

	orders = (
		Order.objects.select_related("user")
		.prefetch_related("items")
		.order_by("-created_at")
	)
	return Response(AdminOrderSerializer(orders, many=True).data)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def admin_order_detail(request, order_id):
	if not (request.user.is_staff or request.user.is_superuser):
		return Response({"detail": "Bạn không có quyền truy cập."}, status=http_status.HTTP_403_FORBIDDEN)

	order = (
		Order.objects.filter(id=order_id)
		.select_related("shipping_address", "user")
		.prefetch_related("items")
		.first()
	)
	if not order:
		return Response({"detail": "Không tìm thấy đơn hàng."}, status=http_status.HTTP_404_NOT_FOUND)

	if request.method == "GET":
		return Response(OrderSerializer(order).data)

	if request.method == "PATCH":
		new_status = request.data.get("status")
		valid_statuses = set(OrderStatus.values)
		if new_status not in valid_statuses:
			return Response(
				{"detail": "Trạng thái đơn hàng không hợp lệ."},
				status=http_status.HTTP_400_BAD_REQUEST,
			)

		# Check if transition is allowed
		if new_status != order.status:
			allowed_transitions = STATUS_TRANSITIONS.get(order.status, [])
			if new_status not in allowed_transitions:
				return Response(
					{"detail": f"Không thể chuyển từ trạng thái '{order.status}' sang '{new_status}'. Trạng thái không được quay về trạng thái trước đó."},
					status=http_status.HTTP_400_BAD_REQUEST,
				)
			order.status = new_status
			order.save()

		return Response(OrderSerializer(order).data)

	order.delete()
	return Response(status=http_status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calculate_shipping_fee_view(request):
     lat = request.data.get('latitude')
     lng = request.data.get('longitude')
     cart_total = request.data.get('cart_total', 0)
     
     SHOP_LAT, SHOP_LNG = 16.069411, 108.149258
     
     distance = calculate_distance(SHOP_LAT, SHOP_LNG, float(lat), float(lng))
     result = calculate_shipping_fee(distance, float(cart_total))
     return Response(result)