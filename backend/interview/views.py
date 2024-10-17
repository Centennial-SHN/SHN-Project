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
from .serializers import UserSerializer

@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import logging

@api_view(['POST'])
def user_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = authenticate(request, email=email, password=password)
    
    if user is not None:
        login(request, user)
        return Response({'message': 'Login successful', 'userid': user.userid,'email': user.email,
            'is_superuser': user.is_superuser}, status=status.HTTP_200_OK)
    return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)


logger = logging.getLogger(__name__)
@api_view(['POST'])
def add_module(request):
    if request.method == 'POST':
        serializer = ModuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors)
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
@api_view(['GET','PUT'])
def edit_module(request, moduleid):
    try:
        module = Module.objects.get(moduleid=moduleid)
        if request.method == 'GET':
            serializer = ModuleSerializer(module)
            return Response(serializer.data)
        elif request.method == 'PUT':
            serializer = ModuleSerializer(module, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            logger.error(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=400)
    except Module.DoesNotExist:
        return Response({'error': 'Module not found.'}, status=status.HTTP_404_NOT_FOUND)