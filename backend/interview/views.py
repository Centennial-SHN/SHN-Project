import openai
from django.http import HttpResponse
from dotenv import load_dotenv
from .services import process_audio_file, generate_text_from_prompt, convert_text_to_speech
from rest_framework.response import Response
from .serializers import ModuleSerializer
from datetime import timedelta, datetime
from azure.storage.blob import BlobServiceClient
from rest_framework.decorators import api_view
from django.utils import timezone
from .models import Interview, Module, Users
import os
from .models import Users, Admin
from rest_framework import status
from .serializers import UserSerializer
from django.contrib.auth import authenticate, login
from django.http import JsonResponse
import logging
from django.core.exceptions import ObjectDoesNotExist
import json


logging.basicConfig(level=logging.DEBUG)

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_BLOB_CONTAINER_NAME = os.getenv('AZURE_BLOB_CONTAINER_NAME')
MODULE_ATTACHMENTS_BLOB_CONTAINER= os.getenv('MODULE_ATTACHMENTS_BLOB_CONTAINER')

@api_view(['POST'])
def process_audio(request):
    audio_file = request.FILES.get('audio')
    module_id = request.POST.get('module_id')
    interview_id = request.POST.get('interview_id')
    date_active = request.POST.get('date_active')

    if not audio_file:
        logging.error("No audio file provided")
        return JsonResponse({"error": "No audio file provided"}, status=400)

    try:
        interview = Interview.objects.get(pk=interview_id)
        module = Module.objects.get(moduleid=module_id)
        module_model = module.model
        module_system_prompt = module.system_prompt
        module_prompt = module.prompt

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

        generated_text = generate_text_from_prompt(conversation_history, module_system_prompt, module_prompt, module_model)

        conversation_history.append({'role': 'assistant', 'content': generated_text})

        interview.transcript = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        interview.dateactive = date_active
        interview.save()

        if USE_AZURE_BLOB_STORAGE:
            speech_file_url = convert_text_to_speech(generated_text, module_id)
            return JsonResponse({"speech_file_url": speech_file_url}, status=200)

    except Exception as e:
        logging.error(f'Exception occurred: {str(e)}')
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
def get_modules(request):
    modules = Module.objects.all()
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
            interviewlength=timedelta(),
            transcript="",
            timestamps=[],
        )

        return JsonResponse({"interviewid": interview.interviewid}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@api_view(['POST'])
def add_timestamp(request):
    try:
        interview_id = request.data.get('interview_id')
        event = request.data.get('event')
        timestamp = request.data.get('timestamp')

        if not interview_id or not event or not timestamp:
            logging.error("Missing required parameters: interview_id, event, or timestamp")
            return JsonResponse({"error": "Missing required parameters"}, status=400)

        interview = Interview.objects.get(interviewid=interview_id)

        interview.timestamps.append({
            "event": event,
            "timestamp": timestamp
        })

        interview.save()

        return JsonResponse({"message": "Timestamp added successfully"}, status=200)

    except Interview.DoesNotExist:
        logging.error(f"Interview not found for interview_id={interview_id}")
        return JsonResponse({"error": "Interview not found"}, status=404)

    except Exception as e:
        logging.error(f"Exception occurred while adding timestamp: {str(e)}", exc_info=True)
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def delete_tts_file(request):
    audio_url = request.data.get('audio_url')

    if not audio_url:
        return JsonResponse({"error": "audio_url is required"}, status=400)

    try:
        blob_name = audio_url.split("/")[-1]

        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=blob_name)

        blob_client.delete_blob()

        return JsonResponse({"message": "TTS file deleted successfully"}, status=200)

    except Exception as e:
        logging.error(f"Error deleting TTS file: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['POST'])
def store_interview_length(request):
    try:
        interview_id = request.data.get('interview_id')

        if not interview_id:
            return JsonResponse({"error": "interview_id is required"}, status=400)

        interview = Interview.objects.get(pk=interview_id)
        timestamps = interview.timestamps

        if not timestamps:
            return JsonResponse({"error": "Timestamps are empty or missing"}, status=200)

        first_user_timestamp = None
        last_assistant_timestamp = None

        for event in timestamps:
            if event["event"] == "audio_upload_start" and not first_user_timestamp:
                first_user_timestamp = event["timestamp"]
            if event["event"] == "audio_playback_end":
                last_assistant_timestamp = event["timestamp"]

        if not first_user_timestamp or not last_assistant_timestamp:
            return JsonResponse({"error": "Missing required timestamps"}, status=400)

        fmt = "%Y-%m-%d %H:%M:%S"
        first_user_dt = datetime.strptime(first_user_timestamp, fmt)
        last_assistant_dt = datetime.strptime(last_assistant_timestamp, fmt)

        interview_duration = last_assistant_dt - first_user_dt

        interview.interviewlength = interview_duration
        interview.save()

        return JsonResponse({"message": "Interview length stored successfully"}, status=200)

    except Interview.DoesNotExist:
        return JsonResponse({"error": "Interview not found"}, status=404)
    except Exception as e:
        logging.error(f"Error storing interview length: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)

@api_view(['GET'])
def download_transcript(request, interview_id):
    try:
        interview = Interview.objects.get(pk=interview_id)
        transcript = interview.transcript
        module = interview.moduleid
        modulename_part = module.modulename.split(':', 1)[1].strip() if ':' in module.modulename else module.modulename

        timestamps = interview.timestamps

        transcript_lines = transcript.split("\n")
        updated_lines = []

        user_timestamp_index = 0
        assistant_timestamp_index = 0

        for i, line in enumerate(transcript_lines):
            if line.startswith('user:'):
                while user_timestamp_index < len(timestamps) and timestamps[user_timestamp_index]["event"] != "audio_upload_start":
                    user_timestamp_index += 1

                if user_timestamp_index < len(timestamps):
                    user_timestamp = timestamps[user_timestamp_index]["timestamp"]
                    updated_line = line.replace('user:', f'[{user_timestamp}] {interview.userid.userid}:')
                    user_timestamp_index += 1
                else:
                    updated_line = line

                updated_lines.append(updated_line)

            elif line.startswith('assistant:'):
                while assistant_timestamp_index < len(timestamps) and timestamps[assistant_timestamp_index]["event"] != "audio_playback_end":
                    assistant_timestamp_index += 1

                if assistant_timestamp_index < len(timestamps):
                    assistant_timestamp = timestamps[assistant_timestamp_index]["timestamp"]
                    updated_line = line.replace('assistant:', f'[{assistant_timestamp}] {modulename_part}:')
                    assistant_timestamp_index += 1
                else:
                    updated_line = line

                updated_lines.append(updated_line)

            else:
                updated_lines.append(line)

        updated_transcript = "\n".join(updated_lines)

        response = HttpResponse(updated_transcript, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="transcript_{interview_id}.txt"'
        return response

    except Interview.DoesNotExist:
        return JsonResponse({"error": "Interview not found"}, status=404)
    except Exception as e:
        logging.error(f"Error while processing transcript: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET'])
def interview_history(request, user_id):
    try:
        interviews = Interview.objects.filter(userid__userid=user_id).values(
            'interviewid',
            'moduleid__modulename',
            'interviewlength',
            'dateactive'
        )

        interview_data = [
            {
                'interviewid': interview['interviewid'],
                'modulename': interview['moduleid__modulename'],
                'interviewlength': str(interview['interviewlength']),
                'dateactive': interview['dateactive'].strftime('%Y-%m-%d'),
            }
            for interview in interviews
        ]

        return JsonResponse(interview_data, safe=False)
    except Exception as e:
        logger.error(f"Error fetching interview history: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)




@api_view(['POST'])
def register(request):
    if request.method == 'POST':
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        

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
    
logger = logging.getLogger(__name__)
@api_view(['GET'])
def user_admin(request):
    try:
        # Fetch all users
        users = Users.objects.all()
        logger.debug(f'fetched users: {users}')
        user_data = []

        for user in users:
            # Get interviews related to the user
            interviews = Interview.objects.filter(userid__userid=user.userid).values(
                'interviewid',
                'dateactive',
                'moduleid__modulename',
                'interviewlength',
            )

            total_interviews = interviews.count()
            total_interview_time = sum(interview['interviewlength'].total_seconds() for interview in interviews) / 3600  # Convert seconds to hours

            user_data.append({
                'userid':user.userid,
                'email': user.email,
                'total_interviews': total_interviews,
                'total_interview_time': total_interview_time,
                'interviews': [
                    {
                        'dateactive': interview['dateactive'].strftime('%Y-%m-%d'),
                        'module_name': interview['moduleid__modulename'],
                        'interviewlength': str(interview['interviewlength']),
                    }
                    for interview in interviews
                ],
            })

        return JsonResponse(user_data, safe=False)
    except Exception as e:
        logger.error(f"Error fetching user admin data: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
    
logger = logging.getLogger(__name__)

@api_view(['GET'])
def user_admin(request):
    logger.debug(f'Session: {request.session.items()}')
    logger.debug(f'User after login: {request.user}, is_authenticated: {request.user.is_authenticated}')
    try:
        # Fetch all users
        users = Users.objects.all()
        logger.debug(f'fetched users: {users}')
        user_data = []

        for user in users:
            # Get interviews related to the user
            interviews = Interview.objects.filter(userid__userid=user.userid).values(
                'interviewid',
                'dateactive',
                'moduleid__modulename',
                'interviewlength',
                # 'transcript'
            )

            total_interviews = interviews.count()
            total_interview_time = sum(interview['interviewlength'].total_seconds() for interview in interviews) / 3600  # Convert seconds to hours

            user_data.append({
                'userid':user.userid,
                'email': user.email,
                'total_interviews': total_interviews,
                'total_interview_time': total_interview_time,
                'interviews': [
                    {
                        'dateactive': interview['dateactive'].strftime('%Y-%m-%d'),
                        'module_name': interview['moduleid__modulename'],
                        'interviewlength': str(interview['interviewlength']),
                        # 'transcript': f'/api/download_transcript/{interview["interviewid"]}/',
                    }
                    for interview in interviews
                ],
            })

        return JsonResponse(user_data, safe=False)
    except Exception as e:
        logger.error(f"Error fetching user admin data: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)
    
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from .models import Users  # Make sure to import your User model
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
def user_manage(request, user_id):
    logger.debug(f'Session: {request.session.items()}')
    logger.debug(f'User after login: {request.user}, is_authenticated: {request.user.is_authenticated}')
    try:
        user = get_object_or_404(Users, userid=user_id)  # Assuming 'userid' is the primary key field for the User model

        response_data = {
            'email': user.email,  # Assuming 'email' is a field in your User model
        }

        return JsonResponse(response_data, status=200)
    except Exception as e:
        logger.error(f"Error fetching user email: {str(e)}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


# @csrf_exempt  # Disable CSRF protection for this view
@api_view(["PATCH"])
def change_user_email(request, user_id):
    
    logger.debug(f'user: {request.user},{request.user.is_authenticated},{request.user.is_superuser}')
    logger.debug(f'Session: {request.session.items()}')
    # if not request.user.is_authenticated or not request.user.is_superuser:
    #     return JsonResponse({"error": "Unauthorized"}, status=403)

    if not request.user.is_authenticated:
        logger.warning("User is not authenticated.")
        return JsonResponse({"error": "Unauthorized"}, status=403)
    
    # Check if the user is a superuser
    if not request.user.is_superuser:
        logger.warning("User is not a superuser.")
        return JsonResponse({"error": "Unauthorized"}, status=403)
        
    try:
        # Load data from the request body
        body = json.loads(request.body)
        new_email = body.get('email')

        if not new_email:
            return JsonResponse({"error": "Email is required"}, status=400)

        # Fetch the user by user_id
        user = Users.objects.get(userid=user_id)

        # Update the user's email
        user.email = new_email
        user.save()

        return JsonResponse({"message": "Email address updated successfully"}, status=200)

    except ObjectDoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

from django.db import connection

@api_view(['DELETE'])
def delete_user(request, user_id):
    logger.debug(f'Request to delete user: {user_id}')
    
    if not request.user.is_authenticated or not request.user.is_superuser:
        logger.warning("Unauthorized access attempt to delete user.")
        return JsonResponse({"error": "Unauthorized"}, status=403)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM interview_users WHERE userid = CAST(%s AS NVARCHAR(255))
            """, [user_id])
        logger.info(f'User {user_id} deleted successfully.')
        return JsonResponse({"message": "User deleted successfully"}, status=204)
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return JsonResponse({"error": "Internal server error"}, status=500)

@api_view(['POST'])
def make_superuser(request, user_id):
    try:
        # Get the user by user_id
        user = Users.objects.get(userid=user_id)
        
        # Grant superuser and staff permissions
        user.is_superuser = True
        user.is_admin = True
        user.save()

        return Response({"message": "User granted superuser permissions"}, status=status.HTTP_200_OK)

    except Users.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
import csv
from datetime import timedelta
@api_view(['GET'])
def download_user_data(request, user_id):
    try:
        user = Users.objects.get(userid=user_id)  # Fetch the user by ID
        logger.debug(f"length__lte:{type(Interview.interviewlength)}")
        interviews = Interview.objects.filter(userid=user_id).exclude(interviewlength__lte=timedelta(seconds=0))

        # Prepare response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="user_data_{user_id}.csv"'

        writer = csv.writer(response)
        # writer.writerow(['User ID', 'Email', 'Total Interviews', 'Total Interview Time', 'Interview Date', 'Interview Module'])
        writer.writerow(['User ID', 'Email', 'Total Interviews', 'Total Interview Time'])
        

        total_time = 0
        for interview in interviews:
            total_time += interview.interviewlength.total_seconds()

        hours, remainder = divmod(int(total_time), 3600)
        minutes, seconds = divmod(remainder, 60)
        total_time_formatted = f"\t{hours:02}:{minutes:02}:{seconds:02}"

        if interviews.exists():
            writer.writerow([user.userid, user.email, len(interviews), total_time_formatted])
        writer.writerow('')
        writer.writerow(['Interview Date','Interview Module','Interview Length'])
        for interview in interviews:
            interview_date_formatted = interview.dateactive.strftime("\t%Y-%m-%d")
            writer.writerow([interview_date_formatted, interview.moduleid,interview.interviewlength])
        

        return response

    except Users.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return Response({'error': str(e)}, status=500)