from celery import shared_task
from django.core.management import call_command

@shared_task(name="apps.orders.tasks.run_cancel_expired_orders")
def run_cancel_expired_orders():
     """
     Celery task wrapper cho management command cancel_expired_orders.
     Chạy định kỳ mỗi 10 phút để hủy đơn BANK_TRANSFER quá hạn và hoàn kho.
     """
     call_command("cancel_expired_orders")