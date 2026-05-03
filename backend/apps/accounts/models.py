from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.
class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    email = models.EmailField(unique=True)  

    def __str__(self):
        return self.username
    
class UserAddress(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='addresses')
    
    receiver_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=10)
    
    province = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    street_detail = models.CharField(max_length=255)
    
    latitude = models.FloatField(null=True, blank=True)
    longtitude = models.FloatField(null=True, blank=True)
    
    is_default = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-is_default', '-created_at'] 
    def __str__(self):
        return f"{self.receiver_name} - {self.street_detail}, {self.ward}, {self.province}"