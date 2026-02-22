from rest_framework import serializers
from .models import Product, Category, Brand, Size, ProductVariant


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


class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
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
            'price', 
            'price_min',
            'price_max',
            'stock', 
            'is_active',
            'category',
            'brand',
            'created_at', 
            'updated_at'
        ]

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
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    variants = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()
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
        ]

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

