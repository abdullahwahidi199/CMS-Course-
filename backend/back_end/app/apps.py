from django.apps import AppConfig


class AppConfigCustom(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app'

    def ready(self):
        import app.signals

    
# class ExpensesConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name='expenses'

#     def ready(self):
#         import expenses.signals