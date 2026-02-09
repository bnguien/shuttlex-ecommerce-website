from rest_framework import serializers
from .models import Product, Category
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image', 'description', 'price', 'stock', 'created_at', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'created_at', 'updated_at']

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    similar_products = serializers.SerializerMethodField()

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
            'similar_products',
            'created_at',
            'updated_at'
        ]

    def get_similar_products(self, obj):
        qs = Product.objects.filter(category=obj.category, is_active=True).exclude(id=obj.id)[:4]
        return ProductSerializer(qs, many=True).data