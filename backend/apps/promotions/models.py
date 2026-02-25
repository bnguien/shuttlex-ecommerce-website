from decimal import Decimal
import random
import string
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import F

class Voucher(models.Model):
     class VoucherType(models.TextChoices):
          PRODUCT = "PRODUCT", "Giảm giá sản phẩm"
          SHIPPING = "SHIPPING", "Giảm phí vận chuyển"
     
     class DiscountType(models.TextChoices):
          PERCENTAGE = "PERCENTAGE", "Phần trăm (%)"
          FIXED_AMOUNT = "FIXED", "Số tiền cố định (đ)"

     code = models.CharField(
          max_length=25, 
          unique=True, 
          db_index=True, 
          blank=True
     )
     voucher_type = models.CharField(
          max_length=20,
          choices=VoucherType.choices,
          default=VoucherType.PRODUCT,
     )
     discount_type = models.CharField(
          max_length=20,
          choices=DiscountType.choices,
          default=DiscountType.PERCENTAGE,
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
     limit_usage = models.PositiveIntegerField(default=100)
     used_count = models.PositiveIntegerField(default=0)

     start_date = models.DateTimeField(default=timezone.now)
     end_date = models.DateTimeField()

     created_at = models.DateTimeField(auto_now_add=True)
     updated_at = models.DateTimeField(auto_now=True)
     is_active = models.BooleanField(default=True)

     class Meta:
          ordering = ['-start_date']

     def __str__(self):
          return f"{self.code}: {self.get_discount_type_display()}"

     def is_valid(self, order_subtotal):
          now = timezone.now()
          return (
               self.is_active and
               self.start_date <= now <= self.end_date and
               self.used_count < self.limit_usage and
               order_subtotal >= self.min_order_value
          )
     
     def calculate_discount(
          self, 
          order_subtotal: Decimal, 
          shipping_fee: Decimal | None = None
     ) -> Decimal:
          if not self.is_valid(order_subtotal):
               return Decimal("0")

          if self.voucher_type == self.VoucherType.SHIPPING:
               if shipping_fee is None:
                    return Decimal("0")
               amount_to_calculate = shipping_fee
          else:
               amount_to_calculate = order_subtotal

          if self.discount_type == self.DiscountType.FIXED_AMOUNT:
               return min(self.value, amount_to_calculate)
          
          discount = (self.value / 100) * amount_to_calculate
          if self.max_discount_amount:
               discount = min(discount, self.max_discount_amount)
          
          return discount

     def save(self, *args, **kwargs):
          if not self.code:
               prefix = "SHX"
               type_tag = "SHI" if self.voucher_type == self.VoucherType.SHIPPING else "POD"
               prefix_code = f"{prefix}-{type_tag}"
               while True:
                    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                    new_code = f"{prefix_code}-{random_str}"

                    if not Voucher.objects.filter(code=new_code).exists():
                         self.code = new_code
                         break
          super().save(*args, **kwargs)
          
     def increase_usage(self) -> bool:
          updated = (
               type(self)
               .objects
               .filter(pk=self.pk, used_count__lt=self.limit_usage)
               .update(used_count=F("used_count") + 1)
          )
          return updated == 1
     
     def is_available(self) -> bool:
          return self.used_count < self.limit_usage