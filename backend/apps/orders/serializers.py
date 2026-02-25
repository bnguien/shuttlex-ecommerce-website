import decimal
from rest_framework import serializers
from apps.orders.models import Order, OrderAddress, ShippingMethod, PaymentMethod
from apps.cart.models import Cart
from . import services

class OrderAddressSerializer(serializers.ModelSerializer):
     class Meta:
          model = OrderAddress
          fields = [
               "id",
               "province",
               "district",
               "ward",
               "street",
               "full_address",
               "latitude",
               "longitude",
               "recipient_name",
               "recipient_phone",
          ]
          read_only_fields = ["id"]

class OrderItemReadSerializer(serializers.Serializer):
     product_name = serializers.CharField(source="product_name_snapshot")
     variant_display = serializers.CharField(source="variant_display_snapshot")
     quantity = serializers.IntegerField()
     price_at_purchase = serializers.DecimalField(max_digits=10, decimal_places=2)
     line_total = serializers.DecimalField(max_digits=12, decimal_places=2)

class OrderSerializer(serializers.ModelSerializer):
     items = OrderItemReadSerializer(many=True, read_only=True)
     shipping_address = OrderAddressSerializer(read_only=True)

     class Meta:
          model = Order
          fields = [
               "id",
               "code",
               "status",
               "payment_status",
               "subtotal",
               "shipping_fee",
               "product_discount_amount",
               "shipping_discount_amount",
               "discount_amount",
               "total",
               "is_freeship",
               "payment_method",
               "created_at",
               "shipping_address",
               "items",
          ]
          read_only_fields = fields

class CheckoutSerializer(serializers.Serializer):
     address_id = serializers.IntegerField()
     shipping_method_code = serializers.CharField(
          max_length=25,
          required=False,
          allow_blank=True,
          allow_null=True
     )
     product_voucher_code = serializers.CharField(
          max_length=25,
          required=False,
          allow_blank=True,
          allow_null=True
     )
     payment_method = serializers.ChoiceField(
          choices=PaymentMethod.choices
     )
     note = serializers.CharField(required=False, allow_blank=True)

     def validate(self, attrs):
          user = self.context["request"].user

          try:
               address = OrderAddress.objects.get(id=attrs["address_id"])
          except OrderAddress.DoesNotExist:
               raise serializers.ValidationError({"address_id": "Địa chỉ không tồn tại."})
          attrs["address"] = address

          try:
               cart = Cart.objects.get(user=user, is_active=True)
          except Cart.DoesNotExist:
               raise serializers.ValidationError("Giỏ hàng trống hoặc không tồn tại.")
          attrs["cart"] = cart

          method_code = attrs["shipping_method_code"]
          if not ShippingMethod.get_method_by_code(method_code):
               raise serializers.ValidationError({"shipping_method_code": "Phương thức vận chuyển không hợp lệ."})

          return attrs

     def create(self, validated_data):
          user = self.context["request"].user
          cart = validated_data["cart"]
          address = validated_data["address"]
          shipping_method_code = validated_data["shipping_method_code"]
          product_voucher_code = validated_data.get("product_voucher_code") or None
          shipping_voucher_code = validated_data.get("shipping_voucher_code") or None
          payment_method = validated_data["payment_method"]
          note = validated_data.get("note", "")

          order = services.create_order(
               user=user,
               cart=cart,
               address=address,
               shipping_method_code=shipping_method_code,
               payment_method=payment_method,
               product_voucher_code=product_voucher_code,
               shipping_voucher_code=shipping_voucher_code,
               note=note,
          )
          return order
