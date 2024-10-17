from django.urls import path
from . import views


urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/',views.user_login,name='login'),
    path('modules/add/', views.add_module, name='add-module'),
    path('modules/edit/<str:moduleid>/', views.edit_module, name='edit_module'),
    path('process_audio/', views.process_audio, name='process_audio'),
    path('modules/', views.get_modules, name='get_modules'),
    path('modules/<str:module_id>/', views.get_module_by_id, name='get_module_by_id'),
    path('create_interview/', views.create_interview, name='create_interview'),
    path('download_transcript/<int:interview_id>/', views.download_transcript, name='download_transcript'),
    # path('clear_audio_files/', views.clear_audio_files, name='clear_audio_files'),
]
# interview/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('process_audio/', views.process_audio_view, name='process_audio'),
    # Add this if you expect a root view for /api/
    path('', views.api_root, name='api-root'),
]

# interview/views.py
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "API Root"})
