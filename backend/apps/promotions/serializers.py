from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from apps.catalog.models import Product

from .models import FlashSale, FlashSaleItem, Voucher, VoucherUsage, VoucherTypeOption, DiscountTypeOption


class VoucherTypeOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoucherTypeOption
        fields = ["id", "code", "label", "description"]


class DiscountTypeOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountTypeOption
        fields = ["id", "code", "label", "description"]


class VoucherSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)
    voucher_type = VoucherTypeOptionSerializer(read_only=True)   
    discount_type = DiscountTypeOptionSerializer(read_only=True)

    class Meta:
        model = Voucher
        fields = "__all__"
        read_only_fields = ["code", "used_count", "created_at", "updated_at"]

class VoucherDetailSerializer(serializers.ModelSerializer):
    is_available = serializers.BooleanField(read_only=True)
    discount_amount = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Voucher
        fields = "__all__"
        read_only_fields = ["code", "used_count", "created_at", "updated_at"]

    def get_is_expired(self, obj):
        return timezone.now() > obj.end_date

    def get_usage_percentage(self, obj):
        if obj.limit_usage in (None, 0):
            return None 
        return round((obj.used_count / obj.limit_usage) * 100, 1)

    def get_discount_amount(self, obj):
        subtotal = self.context.get("order_subtotal")
        shipping = self.context.get("shipping_fee")
        if subtotal is None:
            return None
        return str(obj.calculate_discount(subtotal, shipping))

class VoucherWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    limit_usage = serializers.IntegerField(required=False, allow_null=True, min_value=1)

    class Meta:
        model = Voucher
        fields = "__all__"
        read_only_fields = ["code", "used_count", "created_at", "updated_at"]

    def validate(self, data):
        start_date = data.get("start_date", getattr(self.instance, "start_date", None))
        end_date = data.get("end_date", getattr(self.instance, "end_date", None))
        discount_type = data.get("discount_type", getattr(self.instance, "discount_type", None))
        value = data.get("value", getattr(self.instance, "value", None))
        max_discount_amount = data.get(
            "max_discount_amount", getattr(self.instance, "max_discount_amount", None)
        )

        if start_date and end_date:
            if end_date <= start_date:
                raise serializers.ValidationError({
                    'end_date': 'Ngày kết thúc phải sau ngày bắt đầu.'
                })

        if discount_type and hasattr(discount_type, 'code'):
            if discount_type.code == "PERCENTAGE" and value is not None:
                if value > 100:
                    raise serializers.ValidationError({
                        'value': 'Phần trăm giảm giá không được vượt quá 100%.'
                    })

            if discount_type.code == "FIXED":
                if max_discount_amount is not None:
                    raise serializers.ValidationError({
                        'max_discount_amount': 'Không cần max_discount_amount khi giảm giá cố định.'
                    })

        return data

class ApplyVoucherSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=25)
    order_subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping_fee = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )

class VoucherUsageSerializer(serializers.ModelSerializer):
    voucher_code = serializers.CharField(source="voucher.code", read_only=True)

    class Meta:
        model = VoucherUsage
        fields = ["id", "voucher", "voucher_code", "user", "order", "used_at"]
        read_only_fields = ["id", "voucher_code", "used_at"]

class VoucherResponseSerializer(serializers.ModelSerializer):
    voucher_type = VoucherTypeOptionSerializer(read_only=True)
    discount_type = DiscountTypeOptionSerializer(read_only=True)

    class Meta:
        model = Voucher
        fields = [
            "id",
            "code",
            "description",
            "voucher_type",
            "discount_type",
            "value",
            "max_discount_amount",
            "min_order_value",
            "limit_usage",
            "used_count",
            "start_date",
            "end_date",
            "is_active",
            "new_customer_only",
        ]

class FlashSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.ImageField(source="product.image", read_only=True)

    class Meta:
        model = FlashSaleItem
        fields = [
            "id",
            "product",
            "variant",
            "product_name",
            "product_slug",
            "product_image",
            "original_price",
            "sale_price",
            "stock_limit",
            "sold_count",
        ]

class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(
        many=True, read_only=True
    )
    is_ongoing = serializers.SerializerMethodField()

    def get_is_ongoing(self, obj):
        return obj.is_ongoing()

    time_remaining = serializers.SerializerMethodField()

    class Meta:
        model = FlashSale
        fields = [
            "id",
            "name",
            "discount_percent",
            "start_time",
            "end_time",
            "is_active",
            "is_ongoing",
            "time_remaining",
            "items",
        ]

    def get_time_remaining(self, obj):
        if not obj.is_ongoing():
            return None
        delta = obj.end_time - timezone.now()
        total = int(delta.total_seconds())
        return {
            "hours": total // 3600,
            "minutes": (total % 3600) // 60,
            "seconds": total % 60,
        }

class FlashSaleWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    product_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True)

    class Meta:
        model = FlashSale
        fields = [
            "id",
            "name",
            "discount_percent",
            "start_time",
            "end_time",
            "is_active",
            "product_ids",
        ]
        read_only_fields = ["id"]

    def validate(self, attrs):
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))

        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError(
                {"end_time": "Thời gian kết thúc phải sau thời gian bắt đầu."}
            )

        if "product_ids" in attrs:
            raw_ids = attrs.get("product_ids") or []
            normalized_ids = list(dict.fromkeys(raw_ids))

            if not normalized_ids:
                raise serializers.ValidationError(
                    {"product_ids": "Danh sách sản phẩm không được để trống."}
                )

            existing_ids = set(
                Product.objects.filter(id__in=normalized_ids).values_list("id", flat=True)
            )
            missing_ids = [pid for pid in normalized_ids if pid not in existing_ids]
            if missing_ids:
                raise serializers.ValidationError(
                    {"product_ids": f"Sản phẩm không tồn tại: {missing_ids}"}
                )

            attrs["product_ids"] = normalized_ids

        return attrs

    def _sync_items(self, flash_sale, product_ids):
        products = Product.objects.filter(id__in=product_ids)
        discount_multiplier = (Decimal("100") - Decimal(str(flash_sale.discount_percent))) / Decimal("100")

        keep_ids = []
        for product in products:
            sale_price = (product.base_price * discount_multiplier).quantize(Decimal("0.01"))
            item, _ = FlashSaleItem.objects.update_or_create(
                flash_sale=flash_sale,
                product=product,
                variant=None,
                defaults={
                    "original_price": product.base_price,
                    "sale_price": sale_price,
                    "stock_limit": product.get_stock(),
                },
            )
            keep_ids.append(item.id)

        flash_sale.flashsaleitem_set.exclude(id__in=keep_ids).delete()

    def create(self, validated_data):
        product_ids = validated_data.pop("product_ids", [])
        flash_sale = FlashSale.objects.create(**validated_data)
        self._sync_items(flash_sale, product_ids)
        return flash_sale

    def update(self, instance, validated_data):
        product_ids = validated_data.pop("product_ids", None)
        discount_changed = "discount_percent" in validated_data

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if product_ids is not None:
            self._sync_items(instance, product_ids)
        elif discount_changed:
            discount_multiplier = (Decimal("100") - Decimal(str(instance.discount_percent))) / Decimal("100")
            for item in instance.flashsaleitem_set.select_related("product").all():
                item.original_price = item.product.base_price
                item.sale_price = (item.product.base_price * discount_multiplier).quantize(Decimal("0.01"))
                item.stock_limit = item.product.get_stock()
                item.save(update_fields=["original_price", "sale_price", "stock_limit"])

        return instance