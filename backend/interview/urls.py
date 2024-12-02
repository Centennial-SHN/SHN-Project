from django.urls import path
from . import views


urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/',views.user_login,name='login'),
    path('modules/add/', views.add_module, name='add-module'),
    path('modules/edit/<str:moduleid>/', views.edit_module, name='edit_module'),
    path('modules/delete/<str:module_id>/', views.delete_module, name='delete_module'),
    path('change-password/', views.change_password, name='change_password'),
    path('admin/users/', views.user_admin, name='user-admin'),
    path('admin/users/<str:user_id>/', views.user_manage, name='user-admin'),
    path('admin/user/<str:user_id>/change-email/', views.change_user_email, name='change_email'),
    path('admin/user/<str:user_id>/delete-records/', views.delete_user_records, name='delete_user_records'),
    path('admin/user/<str:user_id>/make-admin/', views.make_superuser, name='make_superuser'),
    path('admin/user/<str:user_id>/reset-password/', views.reset_password, name='reset-password'),
    path('admin/user/<str:user_id>/delete/', views.delete_user, name='delete_user'),
    path('admin/user/<str:user_id>/download-data/', views.download_user_data, name='download_user_data'),
    path('process_audio/', views.process_audio, name='process_audio'),
    path('modules/', views.get_modules, name='get_modules'),
    path('modules/<str:module_id>/', views.get_module_by_id, name='get_module_by_id'),
    path('create_interview/', views.create_interview, name='create_interview'),
    path('admin/interview/<int:interview_id>/delete/', views.delete_interview, name='delete_interview'),
    path('download_transcript/<int:interview_id>/', views.download_transcript, name='download_transcript'),
    path('add_timestamp/', views.add_timestamp, name='add_timestamp'),
    path('delete_tts_file/', views.delete_tts_file, name='delete_tts_file'),
    path('store_interview_length/', views.store_interview_length, name='store_interview_length'),
    path('interview_history/<str:user_id>/', views.interview_history, name='interview_history'),
    path('clear-temp-audio/', views.clear_temp_audio_blob_storage, name='clear_temp_audio_blob_storage'),
    path('modules/<str:moduleid>/files/<str:filename>/', views.delete_module_file, name='delete_module_file')
]


# interview/views.py
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "API Root"})
