from rest_framework import serializers
from .models import ReviewLike, ReviewReply, ReviewTag, ProductReview

class ReviewTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewTag
        fields = ['id', 'name']
        
class ReviewReadSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()    
    tags = ReviewTagSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    reply = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    variant_info = serializers.SerializerMethodField()
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 
            'product', 
            'product_name', 
            'product_image', 
            'user', 
            'rating', 
            'content', 
            'tags', 
            'is_approved', 
            'created_at', 
            'likes_count', 
            'reply', 
            'liked_by_user', 
            'variant_info'
        ]
        
    def get_user(self, obj):
        return obj.user.username
    
    def get_likes_count(self, obj):
        return obj.likes.count()
    
    def get_reply(self, obj):
        try:
            return {
                "content": obj.reply.content,
                "created_at": obj.reply.created_at
            }
        except:
            return None 

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            return obj.product.image.url
        return None 

    def get_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    def get_variant_info(self, obj):
        if obj.variant:
            size_name = ""
            if obj.variant.size:
                size_name = getattr(obj.variant.size, 'name', str(obj.variant.size))
            color_name = obj.variant.color or ""
            if size_name and color_name:
                return f"{size_name} - {color_name}"
            return size_name or color_name or None
        return None

class ReviewWriteSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ReviewTag.objects.filter(is_active=True),
        required=False
    )
    
    class Meta:
        model = ProductReview
        fields = ['product', 'variant', 'rating', 'content', 'tags']
        
    def validate_content(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Vui lòng chia sẻ cảm nhận của bạn về sản phẩm.")
        if len(cleaned) < 10:
            raise serializers.ValidationError("Đánh giá phải có ít nhất 10 ký tự.")
        return cleaned

    def validate(self, attrs):
        user = self.context['request'].user
        product = attrs.get('product')
        
        from apps.orders.models import Order, OrderStatus
        has_purchased = Order.objects.filter(
            user=user,
            status=OrderStatus.DELIVERED,
            items__product=product
        ).exists()
        
        if not has_purchased:
            raise serializers.ValidationError(
                "Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua hàng thành công."
            )
            
        return attrs
    
    def create(self, validated_data):
        tags = validated_data.pop('tags', [])
        review = ProductReview.objects.create(
            user=self.context['request'].user,
            **validated_data
        )
        if tags:
            review.tags.set(tags)
        return review
        