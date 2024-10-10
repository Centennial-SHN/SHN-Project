import os
import openai
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
import logging
from .services import process_audio_file, generate_text_from_prompt, convert_text_to_speech
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Module
from .serializers import ModuleSerializer



logging.basicConfig(level=logging.DEBUG)

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'

@api_view(['POST'])
def process_audio(request):

    audio_file = request.FILES.get('audio')
    module_id = request.POST.get('module_id')
    system_prompt = request.POST.get('system_prompt')
    prompt = request.POST.get('prompt')

    if not audio_file:
        logging.error("No audio file provided")
        return JsonResponse({"error": "No audio file provided"}, status=400)

    try:
        transcribed_text = process_audio_file(audio_file)

        if not transcribed_text:
            return JsonResponse({"error": "Failed to transcribe audio"}, status=500)

        generated_text = generate_text_from_prompt(transcribed_text, system_prompt, prompt)

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
