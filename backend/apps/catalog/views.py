from django.core.paginator import EmptyPage, Paginator
from django.db.models import Case, DecimalField, F, Min, Q, When
from django.db.models.functions import Coalesce
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from django.db import models
from .models import Product, Category, Brand, ProductVariant, Size
from .serializers import ProductSerializer, ProductDetailSerializer, CategorySerializer, BrandSerializer, ProductVariantSerializer, ProductVariantWriteSerializer, SizeSerializer, ProductWriteSerializer, CategoryWriteSerializer, SizeWriteSerializer, BrandWriteSerializer

@api_view(["GET"])
@permission_classes([AllowAny])
def products(request):
    qs = Product.objects.select_related("category", "brand")
    #Lọc category theo slug
    category_query = request.GET.get("category")
    if category_query:
        qs = qs.filter(category__slug=category_query)

    #Lọc brand theo tên
    brands_query = request.GET.get("brands")
    if brands_query:
        qs = qs.filter(brand__name__istartswith=brands_query)

    #Lọc size
    size_param = request.GET.get("sizes")
    if size_param:
        size_items = [item.strip() for item in size_param.split(",") if item.strip()]
        size_ids = [int(item) for item in size_items if item.isdigit()]
        size_names = [item for item in size_items if not item.isdigit()]
        size_filter = Q()
        if size_ids:
            size_filter |= Q(variants__size__id__in=size_ids) #(Django ORM : __in là nằm trong list)
        if size_names:
            size_filter |= Q(variants__size__name__in=size_names)
        if size_filter:
            qs = qs.filter(size_filter)
        
    #Lọc price range
    qs = qs.annotate(
        min_variant_price=Min(
            Case(
                When(
                    variants__is_active=True,
                    then=Coalesce("variants__price", "base_price"),
                ),
                default=None,
                output_field=DecimalField(max_digits=10, decimal_places=2),
            )
        ),
        effective_price=Coalesce("min_variant_price", F("base_price")),
    )
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    if min_price:
        qs = qs.filter(effective_price__gte=min_price) #(__gte >= , __lte <=)
    if max_price:
        qs = qs.filter(effective_price__lte=max_price)

    # Lọc flash sale
    is_flash_sale = request.GET.get("is_flash_sale")
    if is_flash_sale == "true":
        now = timezone.now()
        qs = qs.filter(
            Q(flash_sale_items__flash_sale__is_active=True,
              flash_sale_items__flash_sale__start_time__lte=now,
              flash_sale_items__flash_sale__end_time__gte=now) |
            Q(variants__flash_sale_items__flash_sale__is_active=True,
              variants__flash_sale_items__flash_sale__start_time__lte=now,
              variants__flash_sale_items__flash_sale__end_time__gte=now)
        ).distinct()

    #Search by name 
    search_query = request.GET.get("search")
    if search_query:
        terms = search_query.split()
        for term in terms:
            qs = qs.filter(name__icontains=term)

    #Search by status 
    status_filter = request.GET.get("status")
    if status_filter == "active":
        qs = qs.filter(is_active=True)
    elif status_filter == "inactive":
        qs = qs.filter(is_active=False)

    qs = qs.distinct()

    sort = request.GET.get("sort")
    if sort == "price_asc":
        qs = qs.order_by("effective_price", "-created_at")
    elif sort == "price_desc":
        qs = qs.order_by("-effective_price", "-created_at")
    else:
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
def search_suggestions(request):
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return Response([])
    
    qs = Product.objects.filter(is_active=True)
    terms = q.split()
    for term in terms:
        qs = qs.filter(name__icontains=term)
        
    products = qs[:8]
    results = []
    for p in products:
        results.append({
            "name": p.name,
            "slug": p.slug,
            "category": p.category.name if p.category else "",
            "price": p.price_min if hasattr(p, 'price_min') else getattr(p, 'base_price', 0),
            "image": f"/img/{p.image}" if p.image else None
        })
    return Response(results)

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

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_product(request):
    serializer = ProductWriteSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save()
        return Response(ProductDetailSerializer(product).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    serializer = ProductWriteSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        updated_product = serializer.save()
        return Response(ProductDetailSerializer(updated_product).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    try:
        product.delete()
        return Response({"detail": "Product deleted successfully.", "deleted": True}, status=200)
    except ProtectedError:
        if not product.is_active:
            return Response({"detail": "Product is already inactive.", "deleted": False}, status=200)

        product.is_active = False
        product.save(update_fields=["is_active", "updated_at"])
        product.variants.update(is_active=False)
        return Response(
            {
                "detail": "Product is referenced by other records, so it was archived instead of deleted.",
                "deleted": False,
                "archived": True,
            },
            status=200,
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def categories(request):
    qs = Category.objects.all().order_by("name")
    # Search Category by name
    search_query = request.GET.get("search")
    if search_query:
        qs = qs.filter(name__icontains=search_query)

    # Filter by status
    status_filter = request.GET.get("status")
    if status_filter == "active":
        qs = qs.filter(is_active=True)
    elif status_filter == "inactive":
        qs = qs.filter(is_active=False)
    else:
        # Default: show only active
        qs = qs.filter(is_active=True)

    qs = qs.order_by("name")
    serializer = CategorySerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_category(request):
    serializer = CategoryWriteSerializer(data=request.data)
    if serializer.is_valid():
        category = serializer.save()
        return Response(CategorySerializer(category).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    serializer = CategoryWriteSerializer(category, data=request.data, partial=True)
    if serializer.is_valid():
        updated_category = serializer.save()
        return Response(CategorySerializer(updated_category).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_category(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    try:
        category.delete()
        return Response({"detail": "Category deleted successfully.", "deleted": True}, status=200)
    except ProtectedError:
        if not category.is_active:
            return Response({"detail": "Category is already inactive.", "deleted": False}, status=200)

        category.is_active = False
        category.save(update_fields=["is_active", "updated_at"])
        return Response(
            {
                "detail": "Category is referenced by other records, so it was archived instead of deleted.",
                "deleted": False,
                "archived": True,
            },
            status=200,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def brands(request):
    qs = Brand.objects.all().order_by("name")
    
    # Search Brand by name
    search_query = request.GET.get("search")
    if search_query:
        qs = qs.filter(name__icontains=search_query)
    
    # Filter by status    
    status_filter = request.GET.get("status")
    if status_filter == "active":
        qs = qs.filter(is_active=True)
    elif status_filter == "inactive":
        qs = qs.filter(is_active=False)
    else:
        # Default: show only active
        qs = qs.filter(is_active=True)
    
    qs = qs.order_by("name")
    serializer = BrandSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_brand(request):
    serializer = BrandWriteSerializer(data=request.data)
    if serializer.is_valid():
        brand = serializer.save()
        return Response(BrandSerializer(brand).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_brand(request, brand_id):
    brand = get_object_or_404(Brand, id=brand_id)
    serializer = BrandWriteSerializer(brand, data=request.data, partial=True)
    if serializer.is_valid():
        updated_brand = serializer.save()
        return Response(BrandSerializer(updated_brand).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_brand(request, brand_id):
    brand = get_object_or_404(Brand, id=brand_id)
    try:
        brand.delete()
        return Response({"detail": "Brand deleted successfully.", "deleted": True}, status=200)
    except ProtectedError:
        if not brand.is_active:
            return Response({"detail": "Brand is already inactive.", "deleted": False}, status=200)

        brand.is_active = False
        brand.save(update_fields=["is_active", "updated_at"])
        return Response(
            {
                "detail": "Brand is referenced by other records, so it was archived instead of deleted.",
                "deleted": False,
                "archived": True,
            },
            status=200,
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def sizes(request):
    qs = Size.objects.all().order_by("name")

    # Search by name
    search_query = request.GET.get("search")
    if search_query:
        qs = qs.filter(name__icontains=search_query)

    # Filter by type
    size_type = request.GET.get("type")
    if size_type:
        qs = qs.filter(type=size_type)

    # Filter by category slug (sizes actually used by products in that category)
    category_slug = request.GET.get("category")
    if category_slug:
        qs = qs.filter(
            variants__product__category__slug=category_slug,
            variants__is_active=True,
            variants__product__is_active=True,
        ).distinct()

    serializer = SizeSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_size(request):
    serializer = SizeWriteSerializer(data=request.data)
    if serializer.is_valid():
        size = serializer.save()
        return Response(SizeSerializer(size).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_size(request, size_id):
    size = get_object_or_404(Size, id=size_id)
    serializer = SizeWriteSerializer(size, data=request.data, partial=True)
    if serializer.is_valid():
        updated_size = serializer.save()
        return Response(SizeSerializer(updated_size).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_size(request, size_id):
    size = get_object_or_404(Size, id=size_id)
    try:
        size.delete()
        return Response({"detail": "Size deleted successfully.", "deleted": True}, status=200)
    except ProtectedError:
        if not size.is_active:
            return Response({"detail": "Size is already inactive.", "deleted": False}, status=200)

        size.is_active = False
        size.save(update_fields=["is_active", "updated_at"])
        return Response(
            {
                "detail": "Size is referenced by other records, so it was archived instead of deleted.",
                "deleted": False,
                "archived": True,
            },
            status=200,
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def product_variants(request, product_id):
    product = get_object_or_404(Product, id=product_id, is_active=True)
    variants = product.variants.filter(is_active=True).select_related("size")
    serializer = ProductVariantSerializer(variants, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAdminUser])
def create_variant_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    serializer = ProductVariantWriteSerializer(data=request.data, context={"product": product})
    if serializer.is_valid():
        variant = serializer.save(product=product)
        return Response(ProductVariantSerializer(variant).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAdminUser])
def update_variant_product(request, variant_id):
    variant = get_object_or_404(ProductVariant, id=variant_id)
    serializer = ProductVariantWriteSerializer(variant, data=request.data, partial=True)
    if serializer.is_valid():
        updated_variant = serializer.save()
        return Response(ProductVariantSerializer(updated_variant).data)
    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_variant_product(request, variant_id):
    variant = get_object_or_404(ProductVariant, id=variant_id)
    try:
        variant.delete()
        return Response({"detail": "Product variant deleted successfully.", "deleted": True}, status=200)
    except ProtectedError:
        if not variant.is_active:
            return Response({"detail": "Product variant is already inactive.", "deleted": False}, status=200)

        variant.is_active = False
        variant.save(update_fields=["is_active", "updated_at"])
        return Response(
            {
                "detail": "Product variant is referenced by other records, so it was archived instead of deleted.",
                "deleted": False,
                "archived": True,
            },
            status=200,
        )