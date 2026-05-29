from rest_framework import serializers
from .models import Product, Category, Brand, Size, ProductVariant
from apps.promotions.models import FlashSale, FlashSaleItem
from django.utils import timezone


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'is_active', 'created_at', 'updated_at']


class CategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'is_active', 'created_at', 'updated_at']

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned

    def validate_slug(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Slug is required.")
        qs = Category.objects.filter(slug=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Slug already exists.")
        return cleaned

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_active', 'created_at', 'updated_at']

class BrandWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_active', 'created_at', 'updated_at']

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned
    
    def validate_slug(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Slug is required.")
        qs = Brand.objects.filter(slug=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Slug already exists.")
        return cleaned
    
    def validate_logo(self, value):
        if value and not value.url.lower().endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError("Logo must be an image file (jpg, jpeg, png).")
        return value

class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'type']

class SizeWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'type']

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned
    
    def validate_type(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Type is required.")
        return cleaned

class ProductVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    display_price = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 
            'size', 
            'color', 
            'sku', 
            'stock', 
            'price', 
            'sale_price', 
            'sale_ends_at',
            'display_price',
            'is_on_sale',
            'is_active',
            'created_at',
            'updated_at'
        ]
    
    def get_display_price(self, obj):
        return str(obj.get_effective_price())

    def get_is_on_sale(self, obj):
        return obj.is_on_sale()

class ProductVariantWriteSerializer(serializers.ModelSerializer):
    size_id = serializers.PrimaryKeyRelatedField(
        source='size',
        queryset=Size.objects.all(),
        allow_null=True,
        required=False,
    )
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 
            'size_id', 
            'color', 
            'sku', 
            'stock', 
            'price', 
            'sale_price', 
            'sale_ends_at',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_color(self, value):
        return (value or '').strip()

    def validate_sku(self, value):
        cleaned = (value or '').strip()
        if not cleaned:
            return None
        qs = ProductVariant.objects.filter(sku=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("SKU already exists.")
        return cleaned
    
    def validate_price(self, value):
        if value is None:
            return value
        if value < 0:
            raise serializers.ValidationError("Price must be >= 0.")
        return value
    
    def validate_sale_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Sale price must be >= 0.")
        return value
    
    def validate_stock(self, value):
        if value is None:
            raise serializers.ValidationError("Stock is required.")
        if value < 0:
            raise serializers.ValidationError("Stock must be >= 0.")
        return value

    def validate(self, attrs):
        size = attrs.get('size')
        color = attrs.get('color')
        price = attrs.get('price')
        sale_price = attrs.get('sale_price')

        if self.instance:
            size = size if 'size' in attrs else self.instance.size
            color = color if 'color' in attrs else self.instance.color
            price = price if 'price' in attrs else self.instance.price
            sale_price = sale_price if 'sale_price' in attrs else self.instance.sale_price

        normalized_color = (color or '').strip()
        if not size and not normalized_color:
            raise serializers.ValidationError({
                'non_field_errors': ['Variant must have at least size or color.']
            })

        product = attrs.get('product') or getattr(self.instance, 'product', None) or self.context.get('product')

        if self.instance:
            effective_base_price = price if 'price' in attrs else self.instance.price
        else:
            effective_base_price = price
        if effective_base_price is None and product:
            effective_base_price = product.base_price

        if sale_price is not None and effective_base_price is not None and sale_price >= effective_base_price:
            raise serializers.ValidationError({
                'sale_price': ['Sale price must be less than effective base price.']
            })

        if product is not None:
            combo_qs = ProductVariant.objects.filter(
                product=product,
                size=size,
                color__iexact=normalized_color,
            )

            if self.instance:
                combo_qs = combo_qs.exclude(pk=self.instance.pk)
            if combo_qs.exists():
                raise serializers.ValidationError({
                    'non_field_errors': ['Variant with this size and color already exists for this product.']
                })

        return attrs
    
class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()
    price_min = serializers.SerializerMethodField()
    price_max = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'slug', 
            'image', 
            'description', 
            'price', 
            'price_min',
            'price_max',
            'sku',
            'is_on_sale',
            'stock', 
            'is_active',
            'category',
            'brand',
            'created_at', 
            'updated_at'
        ]

    def get_is_on_sale(self, obj):
        return obj.is_on_sale()

    def get_price(self, obj):
        return str(obj.get_effective_price())

    def get_stock(self, obj):
        return obj.get_stock()

    def get_price_min(self, obj):
        min_price, _ = obj.get_price_range()
        return str(min_price)

    def get_price_max(self, obj):
        _, max_price = obj.get_price_range()
        return str(max_price)

class ProductDetailSerializer(serializers.ModelSerializer):
    flash_sale_info = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    variants = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()
    is_on_sale = serializers.SerializerMethodField()
    has_variants = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()
    price_min = serializers.SerializerMethodField()
    price_max = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'image',
            'description',
            'sku',
            'is_on_sale',
            'base_price',
            'price',
            'price_min',
            'price_max',
            'stock',
            'is_active',
            'category',
            'brand',
            'variants',
            'has_variants',
            'similar_products',
            'created_at',
            'updated_at',
            'flash_sale_info',
        ]
    def get_is_on_sale(self, obj):
        return obj.is_on_sale()
    def get_flash_sale_info(self, obj):
        now = timezone.now()
        flash_sale_items = FlashSaleItem.objects.select_related('flash_sale').filter(
            product=obj,
            variant__isnull=True,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=now,
            flash_sale__end_time__gte=now
        ).order_by('flash_sale__start_time')
        if not flash_sale_items.exists():
            return None
        item = flash_sale_items.first()
        return {
            'flash_sale_id': item.flash_sale.id,
            'name': item.flash_sale.name,
            'sale_price': float(item.sale_price),
            'original_price': float(item.original_price),
            'discount_percent': item.flash_sale.discount_percent,
            'start_time': item.flash_sale.start_time,
            'end_time': item.flash_sale.end_time,
        }

    def get_has_variants(self, obj):
        return obj.has_variants()

    def get_variants(self, obj):
        qs = obj.variants.filter(is_active=True).select_related('size')
        return ProductVariantSerializer(qs, many=True).data

    def get_price(self, obj):
        return str(obj.get_effective_price())

    def get_stock(self, obj):
        return obj.get_stock()

    def get_price_min(self, obj):
        min_price, _ = obj.get_price_range()
        return str(min_price)

    def get_price_max(self, obj):
        _, max_price = obj.get_price_range()
        return str(max_price)

    def get_similar_products(self, obj):
        qs = Product.objects.filter(category=obj.category, is_active=True).exclude(id=obj.id)[:4]
        return ProductSerializer(qs, many=True).data

class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'slug', 
            'image', 
            'description', 
            'base_price',
            'base_stock',
            'is_active',
            'category',
            'brand',
        ]

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Name is required.")
        return cleaned

    def validate_slug(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Slug is required.")
        qs = Product.objects.filter(slug=cleaned)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Slug already exists.")
        return cleaned

    def validate_base_price(self, value):
        if value is None:
            raise serializers.ValidationError("Base price is required.")
        if value < 0:
            raise serializers.ValidationError("Base price must be >= 0.")
        return value

    def validate_base_stock(self, value):
        if value is None:
            raise serializers.ValidationError("Base stock is required.")
        if value < 0:
            raise serializers.ValidationError("Base stock must be >= 0.")
        return value

    def validate_category(self, value):
        if value is None:
            raise serializers.ValidationError("Category is required.")
        if not value.is_active:
            raise serializers.ValidationError("Category is inactive.")
        return value

    def validate_brand(self, value):
        if value is None:
            return value
        if not value.is_active:
            raise serializers.ValidationError("Brand is inactive.")
        return value


