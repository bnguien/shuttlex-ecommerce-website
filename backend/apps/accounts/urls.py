from django.urls import path
from .views import UserRegisterView, get_username, get_first_name, get_last_name , get_email, get_user_role

urlpatterns = [
    path('register/', UserRegisterView, name='register'),
    path('get_username/', get_username, name='get-username'),
    path('get_first_name/', get_first_name, name='get-first-name'),
    path('get_last_name/', get_last_name, name='get-last-name'),
    path('get_email/', get_email, name='get-email'),
    path('get_user_role/', get_user_role, name='get-user-role'),
]
