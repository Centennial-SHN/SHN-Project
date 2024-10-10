from django.urls import path
from . import views

urlpatterns = [
    path('process_audio/', views.process_audio, name='process_audio'),
]