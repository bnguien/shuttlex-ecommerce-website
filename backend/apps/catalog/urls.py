from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.products, name="products"),
    path("product_detail/<slug:slug>/", views.product_detail, name="product_detail"),
    path("categories/", views.categories, name="categories"),
    path("brands/", views.brands, name="brands"),
    path("sizes/", views.sizes, name="sizes"),
    path("search_suggestions/", views.search_suggestions, name="search_suggestions"),
    path("create_brand/", views.create_brand, name="create_brand"),
    path("update_brand/<int:brand_id>/", views.update_brand, name="update_brand"),
    path("delete_brand/<int:brand_id>/", views.delete_brand, name="delete_brand"),
    path("create_product/", views.create_product, name="create_product"),
    path("update_product/<int:product_id>/", views.update_product, name="update_product"),
    path("delete_product/<int:product_id>/", views.delete_product, name="delete_product"),
    path("create_category/", views.create_category, name="create_category"),
    path("update_category/<int:category_id>/", views.update_category, name="update_category"),
    path("delete_category/<int:category_id>/", views.delete_category, name="delete_category"),
    path("create_size/", views.create_size, name="create_size"),
    path("update_size/<int:size_id>/", views.update_size, name="update_size"),
    path("delete_size/<int:size_id>/", views.delete_size, name="delete_size"),
    path("create_variant/<int:product_id>/", views.create_variant_product, name="create_variant_product"),
    path("update_variant/<int:variant_id>/", views.update_variant_product, name="update_variant_product"),
    path("delete_variant/<int:variant_id>/", views.delete_variant_product, name="delete_variant_product"),
]
