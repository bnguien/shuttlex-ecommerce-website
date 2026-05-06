from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import Sum
from django.utils import timezone
from apps.promotions.models import FlashSale, FlashSaleItem

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Size(models.Model):
    name = models.CharField(max_length=20)
    type = models.CharField(
        max_length=20,
        choices=[
            ("racket", "Racket"),
            ("clothes", "Clothes"),
            ("shoes", "Shoes"),
        ],
    )

    class Meta:
        unique_together = ("name", "type")
        ordering = ["type", "name"]

    def __str__(self):
        return f"{self.name} ({self.type})"


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    sku = models.CharField(max_length=64, unique=True, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    base_stock = models.PositiveIntegerField(
        default=0,
        help_text="Stock quantity used when product has no variants. Ignored if variants exist."
    )
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(
        Category, related_name="products", on_delete=models.PROTECT
    )
    brand = models.ForeignKey(
        Brand, 
        related_name="products", 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["category"]),
            models.Index(fields=["brand"]),
        ]

    def __str__(self):
        return self.name

    def has_variants(self):
        return self.variants.filter(is_active=True).exists()

    def get_effective_price(self):

        now = timezone.now()
        flash_sale_items = FlashSaleItem.objects.select_related('flash_sale').filter(
            product=self,
            variant__isnull=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gte=now
        ).order_by('flash_sale__start_time')
        if flash_sale_items.exists():
            return flash_sale_items.first().sale_price
        active_variants = self.variants.filter(is_active=True)
        if active_variants.exists():
            prices = [v.get_effective_price() for v in active_variants]
            return min(prices) if prices else self.base_price
        return self.base_price

    def get_price_range(self):
        active_variants = self.variants.filter(is_active=True)
        if not active_variants.exists():
            effective = self.get_effective_price()
            return (effective, effective)

        prices = [v.get_effective_price() for v in active_variants]
        return (min(prices), max(prices))

    def get_stock(self):
        if self.has_variants():
            total = self.variants.filter(is_active=True).aggregate(total=Sum("stock"))["total"]
            return int(total or 0)
        return int(self.base_stock)

    def is_on_sale(self):
        now = timezone.now()
        if FlashSaleItem.objects.filter(
            product=self,
            variant__isnull=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gte=now
        ).exists():
            return True
        active_variants = self.variants.filter(is_active=True)
        for v in active_variants:
            if v.is_on_sale():
                return True
        return False

    def save(self, *args, **kwargs):
        if not self.sku:
            brand = (self.brand.slug if self.brand else "na").upper()
            slug = (self.slug or str(self.id)).replace(" ", "-").upper()
            self.sku = f"{brand}-{slug}"[:64]
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product, 
        related_name="variants", on_delete=models.CASCADE
    )
    size = models.ForeignKey(
        Size, 
        related_name="variants", 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True
    )
    color = models.CharField(max_length=50, blank=True, default="")
    sku = models.CharField(max_length=64, unique=True, blank=True, null=True)

    stock = models.PositiveIntegerField(default=0)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Giá gốc của loại sản phẩm. Nếu để trống sẽ fallback về base_price của Product.",
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Giá khuyến mãi; nếu null hoặc hết hạn sẽ không dùng.",
    )
    sale_ends_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Thời hạn sale; nếu null thì sale không giới hạn theo thời gian.",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["product", "size", "color"],
                name="uniq_variant_per_product_size_color",
            )
        ]
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["is_active"]),
        ]
        ordering = ["product_id", "size_id", "color"]

    def __str__(self):
        parts = [self.product.name]
        if self.size:
            parts.append(f"Size {self.size.name}")
        if self.color:
            parts.append(self.color)
        return " - ".join(parts)

    def is_on_sale(self):
        now = timezone.now()
        if FlashSaleItem.objects.filter(
            models.Q(variant=self) | models.Q(variant__isnull=True),
            product=self.product,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gte=now
        ).exists():
            return True

        if self.sale_price is None:
            return False
        if self.sale_ends_at is None:
            return True
        return timezone.now() <= self.sale_ends_at
    
    def get_effective_price(self):
        now = timezone.now()
        flash_sale_items = FlashSaleItem.objects.select_related('flash_sale').filter(
            models.Q(variant=self) | models.Q(variant__isnull=True),
            product=self.product,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gte=now
        ).order_by('variant', 'flash_sale__start_time')
        if flash_sale_items.exists():
            return flash_sale_items.first().sale_price
        if self.is_on_sale():
            return self.sale_price
        if self.price is not None:
            return self.price
        return self.product.base_price

    def get_price(self):
        return self.get_effective_price()

    def save(self, *args, **kwargs):
        if not self.sku:
            brand = (self.product.brand.slug if self.product.brand else "na").upper()
            size = (self.size.name if self.size else "STD").upper()
            color = (self.color or "NC").upper().replace(" ", "-")
            slug = (self.product.slug or str(self.product_id)).replace(" ", "-")
            self.sku = f"{brand}-{slug}-{size}-{color}"[:64]
        super().save(*args, **kwargs)
