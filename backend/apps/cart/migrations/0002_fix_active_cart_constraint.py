from django.db import migrations, models
from django.db.models import Window, F
from django.db.models.functions import RowNumber

def cleanup_active_carts(apps, schema_editor):
    """
    For each user with multiple active carts, deactivate all but the most recent one.
    """
    Cart = apps.get_model('cart', 'Cart')
    
    # Get distinct user IDs with multiple active carts
    from django.db.models import Count
    users_with_multiple = (
        Cart.objects
        .filter(is_active=True)
        .values('user')
        .annotate(count=Count('id'))
        .filter(count__gt=1)
    )
    
    for user_data in users_with_multiple:
        user_id = user_data['user']
        # Get all active carts for this user, ordered by updated_at DESC
        carts = Cart.objects.filter(user_id=user_id, is_active=True).order_by('-updated_at')
        
        # Keep the first (most recent), deactivate the rest
        if carts.exists():
            carts_to_deactivate = list(carts[1:])
            for cart in carts_to_deactivate:
                cart.is_active = False
                cart.save()

def reverse_cleanup(apps, schema_editor):
    """
    This operation is not easily reversible, so we do nothing.
    """
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('cart', '0001_initial'),
    ]

    operations = [
        # First, clean up data
        migrations.RunPython(cleanup_active_carts, reverse_cleanup),
        
        # Remove old constraint
        migrations.RemoveConstraint(
            model_name='cart',
            name='unique_active_cart_per_user',
        ),
        
        # Add new constraint: only 1 active cart per user
        migrations.AddConstraint(
            model_name='cart',
            constraint=models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(is_active=True),
                name='unique_active_cart_per_user',
            ),
        ),
    ]
