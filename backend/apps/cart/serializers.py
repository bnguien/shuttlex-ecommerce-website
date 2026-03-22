from django.contrib.auth import PermissionDenied
from rest_framework import serializers
from .models import Cart, CartItem
from apps.catalog.models import Product, ProductVariant

class CartItemSerializer(serializers.ModelSerializer):
    """Write: product, variant (optional), quantity. Read: id, product_id, variant_id, name, size, color, image, price_at_add, quantity, subtotal, total, is_available."""
    subtotal = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    variant_id = serializers.IntegerField(source="variant.id", read_only=True, allow_null=True)
    name = serializers.CharField(source="product.name", read_only=True)
    size = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    price_at_add = serializers.DecimalField(source="price", max_digits=10, decimal_places=2, read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True)
    variant = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.filter(is_active=True),
        allow_null=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = CartItem
        fields = [
            "id", "product", "variant", "product_id", "variant_id",
            "name", "size", "color", "image", "price_at_add",
            "quantity", "price", "total", "subtotal", "is_available",
        ]
        extra_kwargs = {
            "price": {"read_only": True},
            "total": {"read_only": True},
        }

    def get_size(self, obj):
        if obj.variant and obj.variant.size:
            return obj.variant.size.name
        return None

    def get_color(self, obj):
        if not obj.variant:
            return None
        return (obj.variant.color or "").strip() or None

    def get_image(self, obj):
        if obj.product and obj.product.image:
            return obj.product.image.url
        return None

    def get_subtotal(self, obj):
        """Giá hiện tại * quantity (real-time)."""
        current_price = obj.get_catalog_price_now()
        return str(current_price * obj.quantity)

    def get_is_available(self, obj):
        """False nếu variant/product bị tắt hoặc hết hàng."""
        if obj.variant and not obj.variant.is_active:
            return False
        if not obj.product.is_active:
            return False
        if obj.variant:
            return obj.variant.stock >= obj.quantity
        return obj.product.get_stock() >= obj.quantity

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Số lượng phải lớn hơn 0.")
        return value

    def _validate_ownership(self, cart, user):
        if cart.user and user.is_authenticated and cart.user != user:
            raise PermissionDenied("Bạn không có quyền sửa đổi giỏ hàng này.")

    def _validate_stock(self, product, variant, quantity):
        """Kiểm tra tồn kho: variant → variant.stock; không variant → product.get_stock()."""
        if variant:
            available = variant.stock
            if available < quantity:
                raise serializers.ValidationError(
                    f"Biến thể sản phẩm {product.name} không đủ số lượng trong kho (còn {available})."
                )
        else:
            if product.has_variants():
                raise serializers.ValidationError(
                    "Vui lòng chọn biến thể (size/màu) cho sản phẩm này."
                )
            available = product.get_stock()
            if available < quantity:
                raise serializers.ValidationError(
                    f"Sản phẩm {product.name} không đủ số lượng trong kho (còn {available})."
                )

    def validate(self, attrs):
        request = self.context.get("request")
        user = request.user if request else None

        cart = attrs.get("cart") or (self.instance.cart if self.instance else None)
        product = attrs.get("product") or (self.instance.product if self.instance else None)
        variant = attrs.get("variant") or (self.instance.variant if self.instance else None)
        quantity = attrs.get("quantity") or (self.instance.quantity if self.instance else 0)

        if cart and user:
            self._validate_ownership(cart, user)

        if product and quantity:
            self._validate_stock(product, variant, quantity)

        return attrs

    def _get_snapshot_price(self, product, variant):
        """Ưu tiên variant.sale_price (nếu còn hạn) → variant.price → product.base_price."""
        if variant:
            return variant.get_effective_price()
        return product.get_effective_price()

    def create(self, validated_data):
        product = validated_data["product"]
        variant = validated_data.get("variant")
        quantity = validated_data["quantity"]

        snapshot_price = self._get_snapshot_price(product, variant)
        validated_data["price"] = snapshot_price
        validated_data["total"] = snapshot_price * quantity
        return super().create(validated_data)

    def update(self, instance, validated_data):
        quantity = validated_data.get("quantity", instance.quantity)
        snapshot_price = self._get_snapshot_price(instance.product, instance.variant)
        instance.quantity = quantity
        instance.price = snapshot_price
        instance.total = snapshot_price * quantity
        instance.save()
        return instance

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "user", "cart_code", "is_active", "items", "total_price", "last_accessed_at"]
        read_only_fields = ["user", "cart_code", "last_accessed_at"]

    def get_total_price(self, obj):
        total = sum(
            float(item.get_catalog_price_now() * item.quantity)
            for item in obj.items.all()
        )
        return str(round(total, 2))


class CartStatSerializer(serializers.Serializer):
    num_of_items = serializers.IntegerField()
    cart_code = serializers.CharField(allow_null=True)
