from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Product, Category
from .serializers import ProductSerializer, ProductDetailSerializer, CategorySerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def products(request):
    qs = Product.objects.filter(is_active=True).select_related("category", "brand")

    category_slug = request.GET.get("category")
    if category_slug:
        qs = qs.filter(category__slug=category_slug)

    qs = qs.order_by("-created_at")
    return Response(ProductSerializer(qs, many=True).data)

@api_view(["GET"])
@permission_classes([AllowAny])
def product_detail(request, slug):
    product = get_object_or_404(
        Product.objects.select_related("category", "brand")
                       .prefetch_related("variants__size")
                       .filter(is_active=True),
        slug=slug
    )
    serializer = ProductDetailSerializer(product)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def categories(request):
    qs = Category.objects.filter(is_active=True).order_by("name")
    serializer = CategorySerializer(qs, many=True)
    return Response(serializer.data)
