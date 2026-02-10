from django.db import models
from django.core.validators import MinValueValidator
from django.db.models import Sum


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
    description = models.TextField(blank=True, null=True)
    base_price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0)]
    )
    base_stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT)
    brand = models.ForeignKey(Brand, related_name="products", on_delete=models.SET_NULL, null=True, blank=True)
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

    def get_price(self):
        if self.has_variants():
            v = (
                self.variants.filter(is_active=True)
                .annotate(
                    effective_price=models.Case(
                        models.When(price__isnull=False, then="price"),
                        default="product__base_price",
                        output_field=models.DecimalField(max_digits=10, decimal_places=2),
                    )
                )
                .order_by("effective_price")
                .first()
            )
            return v.get_price() if v else self.base_price
        return self.base_price

    def get_stock(self):
        if self.has_variants():
            total = self.variants.filter(is_active=True).aggregate(total=Sum("stock"))["total"]
            return int(total or 0)
        return int(self.base_stock)


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    size = models.ForeignKey(Size, related_name="variants", on_delete=models.PROTECT, null=True, blank=True)
    color = models.CharField(max_length=50, blank=True, default="")
    sku = models.CharField(max_length=64, unique=True, blank=True, null=True)
    stock = models.PositiveIntegerField(default=0)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
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

    def get_price(self):
        return self.price if self.price is not None else self.product.base_price

    def save(self, *args, **kwargs):
        if not self.sku:
            brand = (self.product.brand.slug if self.product.brand else "na").upper()
            size = (self.size.name if self.size else "STD").upper()
            color = (self.color or "NC").upper().replace(" ", "-")
            slug = (self.product.slug or str(self.product_id)).replace(" ", "-")
            self.sku = f"{brand}-{slug}-{size}-{color}"[:64]
        super().save(*args, **kwargs)
