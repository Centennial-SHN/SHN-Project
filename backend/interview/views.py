import openai
from django.http import JsonResponse, HttpResponse
from dotenv import load_dotenv
import logging
from .services import process_audio_file, generate_text_from_prompt, convert_text_to_speech
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .serializers import ModuleSerializer
from datetime import timedelta
from azure.storage.blob import BlobServiceClient

import os


logging.basicConfig(level=logging.DEBUG)

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_BLOB_CONTAINER_NAME = os.getenv('AZURE_BLOB_CONTAINER_NAME')

@api_view(['POST'])
def process_audio(request):
    audio_file = request.FILES.get('audio')
    module_id = request.POST.get('module_id')
    interview_id = request.POST.get('interview_id')
    user_id = request.POST.get('user_id')
    system_prompt = request.POST.get('system_prompt')
    prompt = request.POST.get('prompt')

    if not audio_file:
        logging.error("No audio file provided")
        return JsonResponse({"error": "No audio file provided"}, status=400)

    try:
        interview = Interview.objects.get(pk=interview_id)
        user = Users.objects.get(userid=user_id)
        module = Module.objects.get(moduleid=module_id)

        modulename_part = module.modulename.split(':', 1)[1].strip() if ':' in module.modulename else module.modulename

        conversation_history = []

        if interview.transcript:
            transcript_lines = interview.transcript.split('\n')
            for line in transcript_lines:
                if ':' in line:
                    role, content = line.split(':', 1)
                    conversation_history.append({'role': role.strip(), 'content': content.strip()})

        transcribed_text = process_audio_file(audio_file)

        if not transcribed_text:
            return JsonResponse({"error": "Failed to transcribe audio"}, status=500)

        conversation_history.append({'role': 'user', 'content': transcribed_text})

        generated_text = generate_text_from_prompt(conversation_history, system_prompt, prompt)

        conversation_history.append({'role': 'assistant', 'content': generated_text})

        interview.transcript = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        interview.dateactive = timezone.now()
        interview.save()

        if USE_AZURE_BLOB_STORAGE:
            speech_file_url = convert_text_to_speech(generated_text, module_id)
            logging.info(f"Generated speech file URL: {speech_file_url}")
            return JsonResponse({"speech_file_url": speech_file_url}, status=200)

    except Exception as e:
        logging.error(f'Exception occurred: {str(e)}')
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
def get_modules(request):
    modules = Module.objects.all()
    logging.info(f"Modules: {modules}")
    serializer = ModuleSerializer(modules, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_module_by_id(request, module_id):
    try:
        module = Module.objects.get(moduleid=module_id)
        serializer = ModuleSerializer(module)
        return Response(serializer.data)
    except Module.DoesNotExist:
        return Response(status=404)


from rest_framework.decorators import api_view
from django.utils import timezone
from .models import Interview, Module, Users


@api_view(['POST'])
def create_interview(request):
    try:
        module_id = request.data.get('module_id')
        user_id = request.data.get('user_id')
        module = Module.objects.get(moduleid=module_id)
        user = Users.objects.get(userid=user_id)

        interview = Interview.objects.create(
            userid=user,
            moduleid=module,
            dateactive=timezone.now(),
            interviewlength=timedelta(),  # Initially 0
            transcript="",  # Empty transcript initially
        )

        return JsonResponse({"interviewid": interview.interviewid}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(['GET'])
def download_transcript(request, interview_id):
    try:
        interview = Interview.objects.get(pk=interview_id)
        transcript = interview.transcript

        module = interview.moduleid
        modulename_part = module.modulename.split(':', 1)[1].strip() if ':' in module.modulename else module.modulename

        transcript_lines = transcript.split("\n")
        updated_lines = []
        for line in transcript_lines:
            if line.startswith('user:'):
                updated_lines.append(line.replace('user:', f'{interview.userid.userid}:'))  # Replace 'user' with actual userid
            elif line.startswith('assistant:'):
                updated_lines.append(line.replace('assistant:', f'{modulename_part}:'))  # Replace 'assistant' with part of the module name
            else:
                updated_lines.append(line)

        updated_transcript = "\n".join(updated_lines)

        response = HttpResponse(updated_transcript, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="transcript_{interview_id}.txt"'
        return response
    except Interview.DoesNotExist:
        return JsonResponse({"error": "Interview not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# def clear_audio_files(request):
#     try:
#
#         blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
#         container_client = blob_service_client.get_container_client(AZURE_BLOB_CONTAINER_NAME)
#
#         blobs = container_client.list_blobs()
#
#         for blob in blobs:
#             if blob.name.endswith('.mp3'):
#                 container_client.delete_blob(blob.name)
#                 print(f"Deleted {blob.name}")
#
#         return JsonResponse({"status": "success", "message": "All .mp3 files cleared."}, status=200)
#
#     except Exception as e:
#         return JsonResponse({"status": "error", "message": str(e)}, status=500)

from .models import Users,Admin
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        is_admin = request.data.get('is_admin', False)
        module_id = request.data.get('module_id', None)

        if Users.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        user = Users(email=email, password=make_password(password))
        user.save()

        if is_admin:
            module_instance = None
            if module_id:
                try:
                    module_instance = Module.objects.get(moduleid=module_id)
                except Module.DoesNotExist:
                    return Response({'error': 'Module with this ID does not exist.'}, status=status.HTTP_404_NOT_FOUND)
            Admin.objects.create(userid=user, email=email,password=make_password(password),
                moduleid=module_instance)

        return Response({'message': 'User registered successfully.'}, status=status.HTTP_201_CREATED)
from .serializers import LoginSerializer
@api_view(['POST'])
def login(request):
    serializer=LoginSerializer(data=request.data)
    logging.debug(f"admin: {serializer}")
    if serializer.is_valid():
        user = serializer.validated_data['user']
        is_admin = serializer.validated_data.get('is_admin',False)
        
        
        logging.debug(f"admin: {is_admin}")
        logging.debug(f"user: {user}")

        if is_admin:
            print(Response({"message": "Admin login successful"}, status=status.HTTP_200_OK))
            return Response({"message": "Admin login successful"}, status=status.HTTP_200_OK)
        else:
            print(Response({"message": "User login successful"}, status=status.HTTP_200_OK))
            return Response({"message": "User login successful"}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)