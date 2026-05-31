from django.urls import path 
from . import views

urlpatterns = [
    path('', views.review_list, name='review-list'),
    path('admin-list/', views.admin_review_list, name='admin-review-list'),
    path('create/', views.create_review, name='review-create'),
    path('<int:review_id>/like/', views.toggle_like, name='review-like'),
    path('<int:review_id>/reply/', views.create_reply, name='review-reply'),
    path('<int:review_id>/approve/', views.approve_review, name='review-approve'),
    path('<int:review_id>/delete/', views.delete_review, name='review-delete'),
    path('tags/', views.tag_list, name='tag-list'),
    path('eligibility/', views.check_eligibility, name='review-eligibility'),
]
