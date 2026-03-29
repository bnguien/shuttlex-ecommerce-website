from django.contrib import admin
from django.utils import timezone
from .models import Voucher, VoucherUsage, FlashSale, FlashSaleItem, VoucherTypeOption, DiscountTypeOption


@admin.register(VoucherTypeOption)
class VoucherTypeOptionAdmin(admin.ModelAdmin):
    list_display = ["code", "label", "description"]
    search_fields = ["code", "label"]
    readonly_fields = ["code"]


@admin.register(DiscountTypeOption)
class DiscountTypeOptionAdmin(admin.ModelAdmin):

    list_display = ["code", "label", "description"]
    search_fields = ["code", "label"]
    readonly_fields = ["code"]


@admin.register(Voucher)
class VoucherAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "voucher_type",
        "discount_type",
        "value",
        "description",
        "new_customer_only",
        "used_count",
        "limit_usage",
        "is_active",
        "status_badge",
    ]
    list_filter = [
        "is_active",
        "voucher_type",
        "discount_type",
        "start_date",
    ]
    search_fields = ["code"]
    readonly_fields = ["code", "used_count", "created_at", "updated_at"]
    
    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("code", "voucher_type", "discount_type", "description", "is_active", "new_customer_only")
        }),
        ("Giá trị giảm giá", {
            "fields": ("value", "max_discount_amount", "min_order_value")
        }),
        ("Lịch sử sử dụng", {
            "fields": ("used_count", "limit_usage")
        }),
        ("Thời gian áp dụng", {
            "fields": ("start_date", "end_date")
        }),
        ("Metadata", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def status_badge(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return "Vô hiệu"
        elif obj.start_date > now:
            return "Chưa bắt đầu"
        elif obj.end_date < now:
            return "Đã kết thúc"
        elif obj.limit_usage is not None and obj.limit_usage > 0 and obj.used_count >= obj.limit_usage:
            return "Hết lượt dùng"
        else:
            return "Hoạt động"
    status_badge.short_description = "Trạng thái"


@admin.register(VoucherUsage)
class VoucherUsageAdmin(admin.ModelAdmin):
    list_display = ["voucher", "user", "order", "used_at"]
    list_filter = ["used_at", "voucher"]
    search_fields = ["voucher__code", "user__email"]
    readonly_fields = ["used_at"]
    
    fieldsets = (
        ("Chi tiết sử dụng", {
            "fields": ("voucher", "user", "order", "used_at")
        }),
    )


class FlashSaleItemInline(admin.TabularInline):
    model = FlashSaleItem
    extra = 1
    fields = ["product", "original_price", "sale_price", "stock_limit", "sold_count"]
    readonly_fields = ["sold_count"]


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "discount_percent",
        "start_time",
        "end_time",
        "is_active",
        "status_badge",
        "product_count",
    ]
    list_filter = ["is_active", "start_time", "created_at"]
    search_fields = ["name"]
    readonly_fields = ["created_at", "product_count"]
    inlines = [FlashSaleItemInline]
    
    fieldsets = (
        ("Thông tin cơ bản", {
            "fields": ("name", "discount_percent", "is_active")
        }),
        ("Thời gian", {
            "fields": ("start_time", "end_time")
        }),
        ("Thêm sản phẩm", {
            "fields": ("product_count",)
        }),
        ("Metadata", {
            "fields": ("created_at", "notified"),
            "classes": ("collapse",)
        }),
    )
    
    def status_badge(self, obj):
        now = timezone.now()
        if not obj.is_active:
            return "Vô hiệu"
        elif obj.start_time > now:
            return "Chưa bắt đầu"
        elif obj.end_time < now:
            return "Đã kết thúc"
        else:
            return "Đang diễn ra"
    status_badge.short_description = "Trạng thái"
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Số sản phẩm"


@admin.register(FlashSaleItem)
class FlashSaleItemAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "flash_sale",
        "original_price",
        "sale_price",
        "stock_limit",
        "sold_count",
        "discount_rate",
    ]
    list_filter = ["flash_sale", "flash_sale__start_time"]
    search_fields = ["product__name", "flash_sale__name"]
    readonly_fields = ["sold_count", "discount_rate"]
    
    fieldsets = (
        ("Thông tin sản phẩm", {
            "fields": ("flash_sale", "product", "sold_count")
        }),
        ("Giá bán", {
            "fields": ("original_price", "sale_price", "discount_rate")
        }),
        ("Hạn mức", {
            "fields": ("stock_limit",)
        }),
    )
    
    def discount_rate(self, obj):
        if obj.original_price and obj.sale_price:
            rate = ((obj.original_price - obj.sale_price) / obj.original_price) * 100
            return f"{rate:.0f}%"
        return "-"
    discount_rate.short_description = "Chiết khấu"
