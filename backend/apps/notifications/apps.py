from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    
    def ready(self):
        import apps.notifications.signals
