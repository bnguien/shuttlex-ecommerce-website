from django.db import models
from django.conf import settings

from apps.catalog.models import Product, ProductVariant

class Cart(models.Model):
     user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          null=True, blank=True,
          on_delete=models.SET_NULL,
          related_name="carts",
     )
     cart_code = models.CharField(max_length=64, unique=True)
     is_active = models.BooleanField(default=True)
     created_at = models.DateTimeField(auto_now_add=True)
     updated_at = models.DateTimeField(auto_now=True)
     last_accessed_at = models.DateTimeField(auto_now=True)
     class Meta:
          verbose_name = "Giỏ hàng"
          verbose_name_plural = "Danh sách giỏ hàng"
          ordering = ["-created_at"]
          indexes = [
               models.Index(fields=["user"]),
               models.Index(fields=["cart_code"]),
               models.Index(fields=["is_active"]),
          ]
          constraints = [
               models.UniqueConstraint(
                    fields=["user", "cart_code"],
                    condition=models.Q(is_active=True), 
                    name='unique_active_cart_per_user')
          ]

class CartItem(models.Model):
     cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
     product = models.ForeignKey(Product, related_name="cart_items", on_delete=models.PROTECT)
     variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
     quantity = models.PositiveIntegerField(default=1)
     price = models.DecimalField(max_digits=10, decimal_places=2)
     total = models.DecimalField(max_digits=10, decimal_places=2)
     created_at = models.DateTimeField(auto_now_add=True)
     updated_at = models.DateTimeField(auto_now=True)

     class Meta:
          unique_together = ['cart', 'product', 'variant']
          constraints = [
               models.UniqueConstraint(
                    fields=['cart', 'product', 'variant'], 
                    name='unique_product_variant_per_cart'
               )
          ]

     def get_catalog_price_now(self):
          """
          Giá thực tế hiện tại từ catalog (để tính subtotal real-time).
          """
          if self.variant:
               return self.variant.get_effective_price()
          return self.product.get_effective_price()