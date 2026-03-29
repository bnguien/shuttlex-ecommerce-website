from django.urls import path

from . import views

urlpatterns = [
    path("voucher-types/", views.voucher_type_options),
    path("discount-types/", views.discount_type_options),
    path("vouchers/create/", views.voucher_create),
    path("vouchers/usages/me/", views.my_voucher_usages),
    path("vouchers/apply/", views.apply_voucher),
    path("vouchers/<str:code>/update/", views.voucher_update),
    path("vouchers/<str:code>/delete/", views.voucher_delete),
    path("vouchers/<str:code>/", views.voucher_detail),
    path("vouchers/", views.voucher_list),
    path("flash-sales/create/", views.flash_sale_create),
    path("flash-sales/active/", views.active_flash_sale_voucher),
    path("flash-sales/upcoming/", views.upcoming_flash_sale_voucher),
    path("flash-sales/<int:sale_id>/update/", views.flash_sale_update),
    path("flash-sales/<int:sale_id>/delete/", views.flash_sale_delete),
    path("flash-sales/", views.flash_sale_admin_list),
]
