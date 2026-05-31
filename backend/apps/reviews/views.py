from django.shortcuts import render
from rest_framework import status
from .models import ProductReview, ReviewLike, ReviewTag, ReviewReply
from .serializers import ReviewReadSerializer, ReviewWriteSerializer, ReviewTagSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from django.db import models

@api_view(["GET"])
@permission_classes([AllowAny])
def review_list(request):
    product_id = request.GET.get("product_id")
    
    if not product_id:
        return Response(
            {"detail": "product_id is required."},
            status=400
        )
    qs = ProductReview.objects.filter(
        product_id=product_id,
        is_approved=True
    ).order_by('-created_at')
    
    serializer = ReviewReadSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_review(request):
    serializer = ReviewWriteSerializer(  
        data=request.data,            
        context={'request': request},
    )
    
    if serializer.is_valid():
        review = serializer.save()
        return Response(
            ReviewReadSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_like(request, review_id):
    review = get_object_or_404(ProductReview, id=review_id)
    like, created = ReviewLike.objects.get_or_create(
        review=review,
        user=request.user
    )
    
    if not created:
        like.delete()   
    
    return Response({
        "liked": created,
        "likes_count": review.likes.count()
    })

@api_view(["GET"])
@permission_classes([AllowAny])
def tag_list(request):
    category_id = request.GET.get("category_id")
    qs = ReviewTag.objects.filter(is_active=True)
    if category_id:
        qs = qs.filter(models.Q(category_id=category_id) | models.Q(category__isnull=True))
    serializer = ReviewTagSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def check_eligibility(request):
    product_id = request.GET.get("product_id")
    if not product_id:
        return Response({"detail": "product_id is required."}, status=400)
    
    from apps.orders.models import Order, OrderStatus
    
    has_purchased = Order.objects.filter(
        user=request.user,
        status=OrderStatus.DELIVERED,
        items__product_id=product_id
    ).exists()
    
    purchased_variant = None
    if has_purchased:
        order_item = Order.objects.filter(
            user=request.user,
            status=OrderStatus.DELIVERED,
            items__product_id=product_id
        ).values("items__variant_id").first()
        if order_item:
            purchased_variant = order_item.get("items__variant_id")

    has_reviewed = ProductReview.objects.filter(
        user=request.user,
        product_id=product_id
    ).exists()
    
    return Response({
        "eligible": has_purchased,
        "already_reviewed": has_reviewed,
        "purchased_variant_id": purchased_variant
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_reply(request, review_id):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"detail": "Bạn không có quyền thực hiện hành động này."}, status=status.HTTP_403_FORBIDDEN)
        
    review = get_object_or_404(ProductReview, id=review_id)
    content = request.data.get("content", "").strip()
    
    if not content:
        return Response({"detail": "Nội dung phản hồi không được để trống."}, status=status.HTTP_400_BAD_REQUEST)
        
    if hasattr(review, 'reply'):
        reply = review.reply
        reply.content = content
        reply.user = request.user
        reply.save()
    else:
        reply = ReviewReply.objects.create(
            review=review,
            user=request.user,
            content=content
        )
        
    return Response({
        "content": reply.content,
        "created_at": reply.created_at
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_review_list(request):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"detail": "Bạn không có quyền thực hiện hành động này."}, status=status.HTTP_403_FORBIDDEN)
        
    approved_param = request.GET.get("is_approved")
    qs = ProductReview.objects.all().order_by('-created_at')
    
    if approved_param == "true":
        qs = qs.filter(is_approved=True)
    elif approved_param == "false":
        qs = qs.filter(is_approved=False)
        
    serializer = ReviewReadSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_review(request, review_id):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"detail": "Bạn không có quyền thực hiện hành động này."}, status=status.HTTP_403_FORBIDDEN)
        
    review = get_object_or_404(ProductReview, id=review_id)
    review.is_approved = True
    review.save()
    return Response({"detail": "Đánh giá đã được duyệt.", "is_approved": True})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_review(request, review_id):
    if not (request.user.is_staff or request.user.is_superuser):
        return Response({"detail": "Bạn không có quyền thực hiện hành động này."}, status=status.HTTP_403_FORBIDDEN)
        
    review = get_object_or_404(ProductReview, id=review_id)
    review.delete()
    return Response({"detail": "Đánh giá đã được xóa thành công."})