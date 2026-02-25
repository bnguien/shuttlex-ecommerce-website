from django.db import models
from django.conf import settings

class Notification(models.Model):
     class NotificationType(models.TextChoices):
          ORDER_STATUS = "ORDER", "Trạng thái đơn hàng"
          PROMOTION = "PROMOTION", "Khuyến mãi"
          REMINDER = "REMINDER", "Nhắc nhở"
          SYSTEM = "SYSTEM", "Hệ thống"
     
     user = models.ForeignKey(
          settings.AUTH_USER_MODEL,
          on_delete=models.CASCADE,
          related_name="notifications"
     )
     title = models.CharField(max_length=255)
     message = models.TextField()
     notification_type = models.CharField(
          max_length=20, 
          choices=NotificationType.choices, 
          default=NotificationType.SYSTEM
     )
     
     link = models.CharField(max_length=255, blank=True, null=True)
     
     is_read = models.BooleanField(default=False)
     created_at = models.DateTimeField(auto_now_add=True)

     class Meta:
          ordering = ['-created_at']

     def __str__(self):
          return f"{self.user.username} - {self.title}"