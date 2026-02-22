from django.urls import path
from . import views

urlpatterns = [
    path("get_cart_stat", views.get_cart_stat),
    path("product_in_cart", views.product_in_cart),
    path("get_cart_items", views.get_cart_items),
    path("add_item/", views.add_item),
    path("update_item_quantity/<int:product_id>/", views.update_item_quantity),
    path("remove_item/<int:product_id>/", views.remove_item),
]
