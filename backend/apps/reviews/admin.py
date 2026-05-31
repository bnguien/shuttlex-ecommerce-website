from django.contrib import admin
from .models import ReviewLike, ReviewReply, ReviewTag, ProductReview

# @admin.register(ReviewTag)
# class ReviewTagAdmin(admin.ModelAdmin):
#     pass 
admin.site.register(ReviewTag)

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_approved']
    list_editable = ['is_approved'] #cho phép tick duyệt
    search_fields = ['user__username', 'product__name']
    readonly_fields = ['created_at']
    
@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ['review', 'user', 'created_at']
    readonly_fields = ['created_at']

@admin.register(ReviewLike)
class ReviewLikeAdmin(admin.ModelAdmin):
    list_display = ['review', 'user']
    

