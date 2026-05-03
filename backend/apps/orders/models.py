from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db import models
from django.conf import settings

class OrderAddress(models.Model):
     user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="order_addresses",
     )
     province = models.CharField(max_length=100)
     district = models.CharField(max_length=100)
     ward = models.CharField(max_length=100)
     street = models.CharField(max_length=255)
     full_address = models.TextField(blank=True)
     latitude = models.FloatField(null=True, blank=True) #vĩ độ
     longitude = models.FloatField(null=True, blank=True) #kinh độ
     recipient_name = models.CharField(max_length=255)
     recipient_phone = models.CharField(max_length=10)

     class Meta:
          indexes = [
               models.Index(fields=["province", "district"]),
          ]

class OrderStatus(models.TextChoices):
     PENDING = "PENDING", "Chờ xử lý"
     CONFIRMED = "CONFIRMED", "Đã xác nhận" #bởi admin
     PACKING = "PACKING", "Đang đóng gói"
     SHIPPING = "SHIPPING", "Đang giao"
     DELIVERED = "DELIVERED", "Đã giao"
     CANCELLED = "CANCELLED", "Đã hủy"

class PaymentStatus(models.TextChoices):
     PENDING = "PENDING", "Chờ thanh toán"
     PAID = "PAID", "Đã thanh toán"
     FAILED = "FAILED", "Thất bại"
     REFUNDED = "REFUNDED", "Đã hoàn trả"

class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = "BANK_TRANSFER", "Chuyển khoản ngân hàng"
    CASH_ON_DELIVERY = "CASH", "Tiền mặt khi nhận hàng"

class ShippingMethod(models.Model):
     class ShippingName(models.TextChoices):
          GHN = "GHN", "Giao hàng nhanh"
          GHHT = "GHHT", "Giao hàng hỏa tốc"
          GHTK = "GHTK", "Giao hàng tiết kiệm"
     
     name = models.CharField(
          max_length=100,
          choices=ShippingName.choices,
          default=ShippingName.GHN,
     )
     
     code = models.CharField(
          max_length=20, 
          unique=True,
          help_text="Dùng mã GHN, GHHT, GHTK"
     )
     base_cost = models.DecimalField(
          max_digits=12, 
          decimal_places=2,
          help_text="Giá ship mặc định cho khu vực nội thành"
     )

     estimate_delivery_days = models.PositiveIntegerField(default=0)
     description = models.TextField(blank=True)
     is_active = models.BooleanField(default=True)

     def __str__(self):
          return f"{self.name} ({self.base_cost})"
     
     @classmethod
     def get_method_by_code(cls, method_code):
          default_prices = {
               cls.ShippingName.GHN: Decimal("30000"),
               cls.ShippingName.GHHT: Decimal("50000"),
               cls.ShippingName.GHTK: Decimal("15000"),
          }
          default_estimate_delivery_days = {
               cls.ShippingName.GHN: 2,
               cls.ShippingName.GHHT: 1,
               cls.ShippingName.GHTK: 4,
          }

          method = cls.objects.filter(code=method_code, is_active=True).first()

          if not method and method_code in default_prices:
               method = cls.objects.create(
                    name=method_code,
                    code=method_code,
                    base_cost=default_prices[method_code],
                    estimate_delivery_days=default_estimate_delivery_days.get(method_code, 0),
                    description=f'''Dịch vụ giao hàng {method_code} nội thành.
                    Ngày dự kiến giao đến nơi: {default_estimate_delivery_days}
                    '''
               )

          return method

class Order(models.Model):
     user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.PROTECT,
          related_name="orders",
     )

     code = models.CharField(max_length=64, unique=True, db_index=True)
     status = models.CharField(
          max_length=20,
          choices=OrderStatus.choices,
          default=OrderStatus.PENDING,
          db_index=True,
     )
     payment_status = models.CharField(
          max_length=20,
          choices=PaymentStatus.choices,
          default=PaymentStatus.PENDING,
          db_index=True,
     )
     shipping_address = models.ForeignKey(
          OrderAddress, 
          on_delete=models.PROTECT,
          related_name="orders_shipped",
          null=True,
          blank=True,
     )
     subtotal = models.DecimalField(
          max_digits=14,
          decimal_places=2,
          validators=[MinValueValidator(Decimal("0"))]
     )

     product_voucher = models.ForeignKey(
          'promotions.Voucher',
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="product_discounted_orders",
          limit_choices_to={'voucher_type': 'PRODUCT'}
     )
     shipping_voucher = models.ForeignKey(
          'promotions.Voucher',
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="shipping_discounted_orders",
          limit_choices_to={'voucher_type': 'SHIPPING'}
     )

     shipping_method = models.ForeignKey(
          ShippingMethod,
          on_delete=models.PROTECT,
          related_name="orders",
          null=True,
          blank=True,
     )

     is_freeship = models.BooleanField(default=False)
     shipping_fee = models.DecimalField(
          max_digits=10,
          decimal_places=2,
          default=Decimal("0"),
          validators=[MinValueValidator(Decimal("0"))]
     )

     product_discount_amount = models.DecimalField(
          max_digits=10, 
          decimal_places=2,
          default=Decimal("0"),
          validators=[MinValueValidator(Decimal("0"))],
          blank=True,
     )
     shipping_discount_amount = models.DecimalField(
          max_digits=10, 
          decimal_places=2,
          default=Decimal("0"),
          validators=[MinValueValidator(Decimal("0"))],
          blank=True,
     )
     discount_amount = models.DecimalField(
          max_digits=10, 
          decimal_places=2, 
          default=Decimal("0"),
          validators=[MinValueValidator(Decimal("0"))],
          blank=True,
     )

     total = models.DecimalField(
          max_digits=14, 
          decimal_places=2,
          validators=[MinValueValidator(Decimal("0"))]
     )

     payment_method = models.CharField(
          max_length=20, 
          choices=PaymentMethod.choices,
          default=PaymentMethod.BANK_TRANSFER,
          db_index=True
     )
     paid_at = models.DateTimeField(null=True, blank=True)
     payment_transaction_id = models.CharField(
          max_length=255, 
          blank=True, 
          db_index=True
     )
     #Trường JSON để log webhook
     payment_provider = models.CharField(max_length=50, blank=True)
     payment_provider_response = models.JSONField(default= dict, blank=True)
     note = models.TextField(blank=True)
     
     is_gift = models.BooleanField(default=False)
     gift_note = models.TextField(blank=True, default="", help_text="Lời nhắn tặng quà")

     order_email_sent = models.BooleanField(default=False)
     payment_email_sent = models.BooleanField(default=False)
     reservation_expires_at = models.DateTimeField(null=True, blank=True)
     created_at = models.DateTimeField(auto_now_add=True)
     updated_at = models.DateTimeField(auto_now=True)

     @property
     def total_savings(self):
          return self.product_discount_amount + self.shipping_discount_amount

     class Meta:
          ordering = ['-created_at']
          indexes = [
               models.Index(fields=["user", "status"]),
               models.Index(fields=["payment_status"]),
               models.Index(fields=["created_at"]),
          ]

class OrderItem(models.Model):
     order = models.ForeignKey(
          Order,
          on_delete=models.CASCADE,
          related_name="items"
     )
     product = models.ForeignKey(
          "catalog.Product",
          on_delete=models.PROTECT,
          related_name="order_items",
     )
     variant = models.ForeignKey(
          "catalog.ProductVariant",
          on_delete=models.PROTECT,
          null=True,
          blank=True,
     )
     quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
     price_at_purchase = models.DecimalField(
          max_digits=10,
          decimal_places=2,
          validators=[MinValueValidator(Decimal("0"))],
          help_text="Giá một đơn vị tại thời điểm đặt hàng.",
     )
     product_name_snapshot = models.CharField(
          max_length=255,
          null=True,
          blank=True,
     )
     variant_display_snapshot = models.CharField(
          max_length=255,
          null=True,
          blank=True,
     )
     line_total = models.DecimalField(
          max_digits=12, 
          decimal_places=2,
          validators=[MinValueValidator(Decimal("0"))]
     )

     class Meta:
          indexes = [
               models.Index(fields=["order"]),
          ]
     
     def save(self, *args, **kwargs):
          self.line_total = self.quantity * self.price_at_purchase
          super().save(*args, **kwargs)

class OrderHistory(models.Model):
     order = models.ForeignKey(
          Order,
          on_delete=models.CASCADE,
          related_name="history",
     )
     from_status = models.CharField(max_length=20, blank=True)
     to_status = models.CharField(max_length=20)
     from_payment_status = models.CharField(max_length=20, blank=True)
     to_payment_status = models.CharField(max_length=20, blank=True)
     actor = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
     )
     note = models.TextField(blank=True)
     created_at = models.DateTimeField(auto_now_add=True)

     class Meta:
          ordering = ["-created_at"]
          indexes = [models.Index(fields=["order"])]

# ----- 6. UserActivityLog (AI / behavioral) -----
class UserActivityLog(models.Model):
     user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="activity_logs",
     )
     session_key = models.CharField(max_length=64, blank=True, db_index=True)
     action_type = models.CharField(max_length=64, db_index=True)
     payload = models.JSONField(default=dict, blank=True)
     order = models.ForeignKey(
          Order,
          on_delete=models.SET_NULL,
          null=True,
          blank=True,
          related_name="activity_logs",
     )
     created_at = models.DateTimeField(auto_now_add=True)

     class Meta:
          ordering = ["-created_at"]
          indexes = [
               models.Index(fields=["user", "action_type"]),
               models.Index(fields=["session_key", "created_at"]),
          ]