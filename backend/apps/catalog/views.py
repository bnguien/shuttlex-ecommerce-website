from django.core.paginator import EmptyPage, Paginator
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Product, Category, Brand, Size
from .serializers import ProductSerializer, ProductDetailSerializer, CategorySerializer, BrandSerializer, SizeSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def products(request):
    qs = Product.objects.filter(is_active=True).select_related("category", "brand")

    category_slug = request.GET.get("category")
    if category_slug:
        qs = qs.filter(category__slug=category_slug)

    qs = qs.order_by("-created_at")

    page = request.GET.get("page")
    page_size = request.GET.get("page_size")
    if page:
        try:
            page_number = int(page)
        except (TypeError, ValueError):
            page_number = 1

        try:
            per_page = int(page_size) if page_size else 12
        except (TypeError, ValueError):
            per_page = 12

        paginator = Paginator(qs, per_page)
        if paginator.count == 0:
            return Response({
                "results": [],
                "count": 0,
                "page": 1,
                "page_size": per_page,
                "total_pages": 0,
            })

        try:
            page_obj = paginator.page(page_number)
        except EmptyPage:
            page_obj = paginator.page(paginator.num_pages)

        return Response({
            "results": ProductSerializer(page_obj.object_list, many=True).data,
            "count": paginator.count,
            "page": page_obj.number,
            "page_size": per_page,
            "total_pages": paginator.num_pages,
        })

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

@api_view(["GET"])
@permission_classes([AllowAny])
def brands(request):
    qs = Brand.objects.filter(is_active=True).order_by("name")
    serializer = BrandSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([AllowAny])
def sizes(request):
    size_type = request.GET.get("type")
    qs = Size.objects.all().order_by("name")
    
    if size_type:
        qs = qs.filter(type=size_type)
    
    serializer = SizeSerializer(qs, many=True)
    return Response(serializer.data)

