# from django.db.models.signals import post_save, post_delete,pre_save
# from django.dispatch import receiver
# from .models import Expenses,ExpenseHistory


# @receiver(pre_save,sender=Expenses)
# def store_old_expense_valuew(sender,instance,**kwargs):
#     if instance.id:
#         try:
#             instance._old_values=Expenses.objects.get(pk=instance.pk)
#         except Expenses.DoesNotExist:
#             instance._old_values=None


# @receiver(post_save,sender=Expenses)
# def log_expense_save(sender,instance,created,**kwargs):
#     if created:
#         ExpenseHistory.objects.create(
#             name=instance.name,
#             amount=instance.amount,
#             action='created',
#             description=instance.description
#         )
#     else:
#         old_expense=getattr(instance,'_old_values',None)
#         changes={}
#         if old_expense:
#             for field in ['name','amount','description']:
#                 old_value=getattr(old_expense,field)
#                 new_value=getattr(new_value,field)

#                 if old_value!=new_value:
#                     changes[field]={'old':old_value,'new':new_value}

#         if changes:
#             ExpenseHistory.objects.create(
#                 name=instance.name,
#                 amount=instance.amount,
#                 action='updated',
#                 description=instance.description,
#                 changed_fields=changes
#             )
            
# @receiver(post_delete,sender=Expenses)
# def log_expense_delete(sender,instance,**kwargs):
#     ExpenseHistory.objects.create(
#         name=instance.name,
#         amount=instance.amount,
#         action='deleted',
#         description=instance.description
#     )

from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import Expenses, ExpenseHistory
from django.utils.timezone import is_naive, make_naive
from decimal import Decimal

@receiver(pre_save, sender=Expenses)
def store_old_expense(sender, instance, **kwargs):
    
    if instance.pk:
        try:
            instance._old_values = Expenses.objects.get(pk=instance.pk)
        except Expenses.DoesNotExist:
            instance._old_values = None

@receiver(post_save, sender=Expenses)
def log_expense_save(sender, instance, created, **kwargs):
    if created:
        ExpenseHistory.objects.create(
            name=instance.name,
            amount=instance.amount,
            action='created',
            description=instance.description
        )
    else:
        old_expense = getattr(instance, '_old_values', None)
        if old_expense:
            changes = {}
            for field in ['name', 'amount','date', 'description']:
                old_value = getattr(old_expense, field)
                new_value = getattr(instance, field)

                if isinstance(old_value, Decimal):
                    old_value = float(old_value)
                if isinstance(new_value, Decimal):
                    new_value = float(new_value)

                    
                from datetime import datetime
                if isinstance(old_value, datetime):
                    old_value = make_naive(old_value) if not is_naive(old_value) else old_value
                if isinstance(new_value, datetime):
                    new_value = make_naive(new_value) if not is_naive(new_value) else new_value

                    
                if old_value != new_value:
                    changes[field] = {'old': old_value, 'new': new_value}

            if changes:
                ExpenseHistory.objects.create(
                    name=instance.name,
                    amount=instance.amount,
                    action='updated',
                    description=instance.description,
                    changed_fields=changes
                )

@receiver(post_delete, sender=Expenses)
def log_expense_delete(sender, instance, **kwargs):
    ExpenseHistory.objects.create(
        name=instance.name,
        amount=instance.amount,
        action='deleted',
        description=instance.description
    )
