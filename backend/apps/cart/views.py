import uuid
from django.db import transaction
from django.db.models import Sum

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .models import Cart, CartItem
from .serializers import CartItemSerializer
from apps.catalog.models import Product, ProductVariant

CART_ITEM_LIMIT = 50


def _is_cart_accessible(cart, user):
    if not cart:
        return False
    if user and user.is_authenticated:
        return cart.user_id in (None, user.id)
    return cart.user_id is None

def get_or_create_cart(cart_code, user=None):
    ''' Lấy hoặc tạo Cart theo cart_code. 
    Guest: user=None.
    Cập nhật last_accessed_at.'''
    if not cart_code:
        cart_code = uuid.uuid4().hex
    cart = Cart.objects.filter(cart_code=cart_code, is_active=True).first()

    if cart:
        Cart.objects.filter(pk=cart.pk).update(last_accessed_at=timezone.now())
        cart.refresh_from_db()
        return cart, cart_code

    cart = Cart.objects.create(cart_code=cart_code, user=user)
    return cart, cart_code

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart_stat(request):
    """GET ?cart_code=xxx → { num_of_items, cart_code }."""
    user = request.user if request.user.is_authenticated else None
    cart_code = request.GET.get("cart_code")
    cart = Cart.objects.filter(cart_code=cart_code, is_active=True).first() if cart_code else None

    if user and not cart:
        cart = Cart.objects.filter(user=user, is_active=True).first()

    if cart and not _is_cart_accessible(cart, request.user):
        cart = Cart.objects.filter(user=user, is_active=True).first() if user else None

    if cart and user and cart.user_id is None:
        cart.user = user
        cart.save(update_fields=["user", "updated_at"])

    if not cart:
        return Response({
            "num_of_items": 0,
            "cart_code": None
        })

    num = cart.items.aggregate(total=Sum("quantity"))['total'] or 0
    return Response({
        "num_of_items": num,
        "cart_code": cart.cart_code
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart_items(request):
    """GET ?cart_code=xxx → { items: [...] }."""
    cart_code = request.GET.get('cart_code')
    if not cart_code:
        return Response({"items": []})
    
    user = request.user if request.user.is_authenticated else None
    cart, _ = get_or_create_cart(cart_code, user)
    if not _is_cart_accessible(cart, request.user):
        return Response({"items": []})

    if user and cart.user_id is None:
        cart.user = user
        cart.save(update_fields=["user", "updated_at"])

    items = cart.items.select_related("product", "variant", "variant__size").order_by("id")
    return Response({
        "items": CartItemSerializer(items, many=True).data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def add_item(request):
    '''
    POST { cart_code, product_id, variant_id?, quantity }
    - Cộng dồn quantity nếu đã có cùng product+variant trong giỏ.
    - Validate stock và giới hạn 50 dòng/giỏ.
    '''
    cart_code = request.data.get("cart_code")
    product_id = request.data.get("product_id")
    variant_id = request.data.get("variant_id")
    quantity = int(request.data.get("quantity") or 1)

    if not cart_code:
        cart_code = uuid.uuid4().hex
    if not product_id:
        return Response(
            {"detail": "product_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    product = Product.objects.filter(id=product_id, is_active=True).first()
    if not product:
        return Response(
            {"detail": "Sản phẩm không tồn tại hoặc đã ngừng bán."},
            status = status.HTTP_404_NOT_FOUND
        )

    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id, product=product, is_active=True).first()
        if not variant:
            return Response(
                {"detail": "Biến thể không tồn tại hoặc đã ngừng bán."},
                status = status.HTTP_404_NOT_FOUND
            )
    elif product.has_variants():
        return Response(
            {"detail": "Vui lòng chọn biến thể (size/màu)."},
            status = status.HTTP_400_BAD_REQUEST
        )

    user = request.user if request.user.is_authenticated else None
    with transaction.atomic():
        cart, _ = get_or_create_cart(cart_code, user)
        if cart.items.count() >= CART_ITEM_LIMIT and not cart.items.filter(product=product, variant=variant).exists():
            return Response(
                {"detail": f"Giỏ hàng tối đa {CART_ITEM_LIMIT} sản phẩm."},
                status = status.HTTP_400_BAD_REQUEST
            )
        
        existing = cart.items.select_for_update().filter(product=product, variant=variant).first()
        if existing:
            new_qty = existing.quantity + quantity
            available = variant.stock if variant else product.get_stock()
            if new_qty > available:
                return Response(
                    {"detail": f"Không đủ sản phẩm (còn {available})."},
                    status = status.HTTP_400_BAD_REQUEST
                )
            snapshot = variant.get_effective_price() if variant else product.get_effective_price()
            existing.quantity = new_qty
            existing.price = snapshot
            existing.total = snapshot * new_qty
            existing.save(update_fields=["quantity", "price", "total", "updated_at"])

            ser = CartItemSerializer(existing)
            return Response(
                {**ser.data, "cart_code": cart.cart_code}, 
                status=status.HTTP_200_OK
            )
        
        available = variant.stock if variant else product.get_stock()
        if quantity > available:
            return Response(
                {"detail": f"Không đủ sản phẩm (còn {available})"},
                status = status.HTTP_400_BAD_REQUEST
            )
        snapshot = variant.get_effective_price() if variant else product.get_effective_price()
        item = CartItem.objects.create(
            cart = cart,
            product = product,
            variant = variant,
            quantity = quantity,
            price = snapshot,
            total = snapshot * quantity,
        )
        ser = CartItemSerializer(item)
        return Response(
            {**ser.data, "cart_code": cart.cart_code}, 
            status=status.HTTP_201_CREATED
        )

@api_view(["GET"])
@permission_classes([AllowAny])
def product_in_cart(request):
    """GET ?cart_code=xxx&product_id=yyy&variant_id=zzz → { product_in_cart: true/false }."""
    cart_code = request.GET.get("cart_code")
    product_id = request.GET.get("product_id")
    variant_id = request.GET.get("variant_id")
    if not cart_code or not product_id:
        return Response({"product_in_cart": False})
    cart = Cart.objects.filter(cart_code=cart_code, is_active=True).first()
    if not cart:
        return Response({"product_in_cart": False})
    if not _is_cart_accessible(cart, request.user):
        return Response({"product_in_cart": False})

    if request.user.is_authenticated and cart.user_id is None:
        cart.user = request.user
        cart.save(update_fields=["user", "updated_at"])

    q = cart.items.filter(product_id=product_id)
    if variant_id:
        q = q.filter(variant_id=variant_id)
    return Response({"product_in_cart": q.exists()})

@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def update_item_quantity(request, product_id=None):
    """
    PUT/PATCH body: { cart_code, variant_id?, quantity } hoặc product_id trong URL.
    Logic:
    - quantity > 0: cập nhật số lượng & giá.
    - quantity <= 0: xóa item khỏi giỏ hàng.
    """
    cart_code = request.data.get("cart_code")
    variant_id = request.data.get("variant_id")
    pid = product_id or request.data.get("product_id")

    new_quantity = request.data.get("quantity")
    change = request.data.get("change")

    if not cart_code or not pid:
        return Response(
            {"detail": "cart_code và product_id bắt buộc."},
            status = status.HTTP_400_BAD_REQUEST
        )

    cart = Cart.objects.filter(cart_code=cart_code, is_active=True).first()
    if not cart:
        return Response(
            {"detail": "Không tìm thấy giỏ hàng."},
            status = status.HTTP_404_NOT_FOUND
        )
    if not _is_cart_accessible(cart, request.user):
        return Response(
            {"detail": "Bạn không có quyền truy cập giỏ hàng này."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user.is_authenticated and cart.user_id is None:
        cart.user = request.user
        cart.save(update_fields=["user", "updated_at"])

    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id, product_id=pid).first()

    with transaction.atomic():
        item = cart.items.select_for_update().filter(product_id=pid, variant=variant).first()
        if not item:
            return Response(
                {"detail": f"Không tìm thấy sản phẩm trong giỏ."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
        if new_quantity is not None:
            try:
                new_quantity = int(new_quantity)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Giá trị số lượng sản phẩm không hợp lệ!"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            target_quantity = new_quantity
        elif change is not None:
            try:
                target_quantity = item.quantity + int(change)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "Giá trị thay đổi không hợp lệ!"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            return Response(
                {"detail": "Cần cung cấp số lượng sản phẩm hoặc lượng thay đổi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if target_quantity <= 0:
            item.delete()
            return Response({"detail": "Đã xóa sản phẩm khỏi giỏ hàng.", "deleted": True}, status=status.HTTP_200_OK)

        available = item.variant.stock if item.variant else item.product.get_stock()
        if target_quantity > available:
            return Response(
                {"detail": f"Không đủ sản phẩm (còn {available})."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        snapshot = item.get_catalog_price_now()
        CartItem.objects.filter(pk=item.pk).update(
            quantity=target_quantity,
            price=snapshot,
            total=snapshot * target_quantity,
            updated_at=timezone.now(),
        )
        item.refresh_from_db()
        
        return Response(CartItemSerializer(item).data)

@api_view(['DELETE', 'POST'])
@permission_classes([AllowAny])
def remove_item(request, product_id=None):
    """DELETE ?cart_code=xxx&variant_id=yyy hoặc product_id trong URL, body có thể chứa cart_code, variant_id."""
    cart_code = request.GET.get("cart_code") or request.data.get("cart_code")
    variant_id = request.GET.get("variant_id") or request.data.get("product_id")
    pid = product_id or request.GET.get("product_id") or request.data.get("product_id")
    if not cart_code or not pid:
        return Response(
            {"detail": "cart_code and product_id required"},
            status = status.HTTP_400_BAD_REQUEST
        )
    
    cart = Cart.objects.filter(cart_code=cart_code, is_active=True).first()
    if not cart: 
        return Response(
            {"detail": "Cart not found"},
            status = status.HTTP_404_NOT_FOUND
        )
    if not _is_cart_accessible(cart, request.user):
        return Response(
            {"detail": "Bạn không có quyền truy cập giỏ hàng này."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.user.is_authenticated and cart.user_id is None:
        cart.user = request.user
        cart.save(update_fields=["user", "updated_at"])
    
    variant = None
    if variant_id:
        variant = ProductVariant.objects.filter(id=variant_id, product_id=pid).first()
    item = cart.items.filter(product_id=pid, variant=variant).first()
    if not item:
        return Response(
            {"detail": "Item not in cart"},
            status = status.HTTP_404_NOT_FOUND
        )
    item.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

