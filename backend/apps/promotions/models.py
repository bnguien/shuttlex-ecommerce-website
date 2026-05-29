from decimal import Decimal
import random
import string

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import F
from django.utils import timezone


class VoucherTypeOption(models.Model):
    code = models.CharField(max_length=20, unique=True, db_index=True)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    
    class Meta:
        ordering = ["id"]
        verbose_name = "Loại mã giảm giá"
        verbose_name_plural = "Loại mã giảm giá"
    
    def __str__(self):
        return self.label


class DiscountTypeOption(models.Model):
    code = models.CharField(max_length=20, unique=True, db_index=True)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    
    class Meta:
        ordering = ["id"]
        verbose_name = "Loại giảm giá"
        verbose_name_plural = "Loại giảm giá"
    
    def __str__(self):
        return self.label


class Voucher(models.Model):
    code = models.CharField(max_length=25, unique=True, db_index=True, blank=True)
    description = models.CharField(max_length=255, blank=True, default="")
    voucher_type = models.ForeignKey(
        VoucherTypeOption,
        on_delete=models.PROTECT,
        related_name="vouchers"
    )
    discount_type = models.ForeignKey(
        DiscountTypeOption,
        on_delete=models.PROTECT,
        related_name="vouchers"
    )
    value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
    )
    max_discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0"))],
    )
    min_order_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0"))],
    )
    limit_usage = models.PositiveIntegerField(null=True, blank=True, default=None)
    used_count = models.PositiveIntegerField(default=0)

    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    new_customer_only = models.BooleanField(
        default=False,
        help_text="Chỉ áp dụng cho khách hàng chưa có đơn trước đó.",
    )

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.code}: {self.discount_type.label}"

    def is_valid(self, order_subtotal):
        now = timezone.now()
        has_usage_cap = self.limit_usage is not None and self.limit_usage > 0
        return (
            self.is_active
            and self.start_date <= now <= self.end_date
            and (not has_usage_cap or self.used_count < self.limit_usage)
            and order_subtotal >= self.min_order_value
        )

    def calculate_discount(
        self,
        order_subtotal: Decimal,
        shipping_fee: Decimal | None = None,
    ) -> Decimal:
        if not self.is_valid(order_subtotal):
            return Decimal("0")

        if self.voucher_type.code == "SHIPPING":
            if shipping_fee is None:
                return Decimal("0")
            amount_to_calculate = shipping_fee
        else:
            amount_to_calculate = order_subtotal

        if self.discount_type.code == "FIXED":
            return min(self.value, amount_to_calculate)

        discount = (self.value / 100) * amount_to_calculate
        if self.max_discount_amount:
            discount = min(discount, self.max_discount_amount)

        return discount

    def save(self, *args, **kwargs):
        if not self.code:
            prefix = "SHX"
            type_tag = "SHI" if self.voucher_type.code == "SHIPPING" else "POD"
            prefix_code = f"{prefix}-{type_tag}"
            while True:
                random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
                new_code = f"{prefix_code}-{random_str}"

                if not Voucher.objects.filter(code=new_code).exists():
                    self.code = new_code
                    break
        super().save(*args, **kwargs)

    def increase_usage(self) -> bool:
        queryset = type(self).objects.filter(pk=self.pk)
        if self.limit_usage is not None and self.limit_usage > 0:
            queryset = queryset.filter(used_count__lt=self.limit_usage)
        updated = queryset.update(used_count=F("used_count") + 1)
        return updated == 1

    def is_available(self) -> bool:
        return self.limit_usage is None or self.limit_usage <= 0 or self.used_count < self.limit_usage


class VoucherUsage(models.Model):
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name="usages")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.ForeignKey("orders.Order", on_delete=models.SET_NULL, null=True)
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("voucher", "user")

    def __str__(self):
        return f"{self.user} dùng {self.voucher.code}"


class FlashSale(models.Model):
    name = models.CharField(max_length=200)
    discount_percent = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(90)]
    )
    products = models.ManyToManyField("catalog.Product", through="FlashSaleItem")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_active = models.BooleanField(default=False)
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.start_time.strftime('%d/%m %H:%M')})"

    def is_ongoing(self):
        now = timezone.now()
        return self.is_active and self.start_time <= now <= self.end_time


class FlashSaleItem(models.Model):
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="flash_sale_items")
    variant = models.ForeignKey(
        "catalog.ProductVariant",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="flash_sale_items",
        help_text="Nếu chọn variant, Flash Sale chỉ áp dụng cho biến thể này. Nếu để trống, áp dụng cho toàn bộ sản phẩm."
    )
    original_price = models.DecimalField(max_digits=12, decimal_places=2)
    sale_price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_limit = models.PositiveIntegerField()
    sold_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("flash_sale", "product", "variant")

    def save(self, *args, **kwargs):
        if (self.sale_price is None or self.sale_price == 0) and self.original_price and self.flash_sale_id:
            fs = self.flash_sale
            if fs.discount_percent:
                self.sale_price = (
                    self.original_price
                    * (Decimal("100") - Decimal(fs.discount_percent))
                    / Decimal("100")
                ).quantize(Decimal("0.01"))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.flash_sale.name} - {self.product.name}"
