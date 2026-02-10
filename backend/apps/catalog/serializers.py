from rest_framework import serializers
from .models import Product, Category, Brand, Size, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'is_active', 'created_at', 'updated_at']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'is_active', 'created_at', 'updated_at']


class SizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Size
        fields = ['id', 'name', 'type']


class ProductVariantSerializer(serializers.ModelSerializer):
    size = SizeSerializer(read_only=True)
    display_price = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 
            'size', 
            'color', 
            'sku', 
            'stock', 
            'price', 
            'display_price',
            'is_active',
            'created_at',
            'updated_at'
        ]
    
    def get_display_price(self, obj):
        return str(obj.get_price())


class ProductSerializer(serializers.ModelSerializer):
    brand = BrandSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'slug', 
            'image', 
            'description', 
            'price', 
            'stock', 
            'is_active',
            'category',
            'brand',
            'created_at', 
            'updated_at'
        ]

    def get_price(self, obj):
        return str(obj.get_price())

    def get_stock(self, obj):
        return obj.get_stock()


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    variants = serializers.SerializerMethodField()
    similar_products = serializers.SerializerMethodField()
    has_variants = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'image',
            'description',
            'price',
            'stock',
            'is_active',
            'category',
            'brand',
            'variants',
            'has_variants',
            'similar_products',
            'created_at',
            'updated_at'
        ]

    def get_has_variants(self, obj):
        return obj.has_variants()

    def get_variants(self, obj):
        qs = obj.variants.filter(is_active=True).select_related('size')
        return ProductVariantSerializer(qs, many=True).data

    def get_price(self, obj):
        return str(obj.get_price())

    def get_stock(self, obj):
        return obj.get_stock()

    def get_similar_products(self, obj):
        qs = Product.objects.filter(category=obj.category, is_active=True).exclude(id=obj.id)[:4]
        return ProductSerializer(qs, many=True).data