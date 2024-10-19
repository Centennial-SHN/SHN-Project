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
    path('add_timestamp/', views.add_timestamp, name='add_timestamp'),
    path('delete_tts_file/', views.delete_tts_file, name='delete_tts_file'),
    path('store_interview_length/', views.store_interview_length, name='store_interview_length'),
    path('interview_history/<str:user_id>/', views.interview_history, name='interview_history'),
]


# interview/views.py
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "API Root"})
