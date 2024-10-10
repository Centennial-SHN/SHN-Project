import os
import openai
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv
import logging
from .services import process_audio_file, generate_text_from_prompt, convert_text_to_speech
from django.http import FileResponse

logging.basicConfig(level=logging.DEBUG)

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'

@csrf_exempt
def process_audio(request):
    if request.method == 'POST':
        audio_file = request.FILES.get('audio')

        if not audio_file:
            logging.error("No audio file provided")
            return JsonResponse({"error": "No audio file provided"}, status=400)

        try:
            transcribed_text = process_audio_file(audio_file)

            if not transcribed_text:
                return JsonResponse({"error": "Failed to transcribe audio"}, status=500)

            generated_text = generate_text_from_prompt(transcribed_text)

            if USE_AZURE_BLOB_STORAGE:
                speech_file_url = convert_text_to_speech(generated_text)
                logging.info(f"Generated speech file URL: {speech_file_url}")

                return JsonResponse({"speech_file_url": speech_file_url}, status=200)

            else:

                speech_file_path = convert_text_to_speech(generated_text)
                logging.info(f"Generated speech file path: {speech_file_path}")

                if os.path.exists(speech_file_path):
                    return FileResponse(open(speech_file_path, 'rb'), content_type='audio/mp3', as_attachment=False, filename='response.mp3')
                else:
                    logging.error(f"File not found: {speech_file_path}")
                    return JsonResponse({"error": "Audio file not found"}, status=500)

        except Exception as e:
            logging.error(f'Exception occurred: {str(e)}')
            return JsonResponse({"error": str(e)}, status=500)

    else:
        logging.error("Invalid request method")
        return JsonResponse({"error": "Invalid request method"}, status=400)
