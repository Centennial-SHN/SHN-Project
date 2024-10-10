from django.urls import path
from . import views


urlpatterns = [
    path('process_audio/', views.process_audio, name='process_audio'),
    path('modules/', views.get_modules, name='get_modules'),
    path('modules/<str:module_id>/', views.get_module_by_id, name='get_module_by_id'),

]