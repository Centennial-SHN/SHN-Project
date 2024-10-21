import os
import openai
import logging
import uuid
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv
import io
from .models import Module

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_BLOB_CONTAINER_NAME = os.getenv('AZURE_BLOB_CONTAINER_NAME')
MODULE_ATTACHMENTS_BLOB_CONTAINER= os.getenv('MODULE_ATTACHMENTS_BLOB_CONTAINER')



def process_audio_file(audio_file):
    extension = os.path.splitext(audio_file.name)[1] or '.mp3'
    audio_file_name = 'stt' + str(uuid.uuid4()) + extension

    if USE_AZURE_BLOB_STORAGE:
        audio_file_path = _upload_stt_to_blob_storage(audio_file, audio_file_name)
    else:
        # Save audio file locally if not using Azure Blob Storage
        local_file_path = os.path.join('/tmp', audio_file_name)
        with open(local_file_path, 'wb+') as destination:
            for chunk in audio_file.chunks():
                destination.write(chunk)
        audio_file_path = local_file_path

    return _process_stt_audio(audio_file_path)

def generate_text_from_prompt(conversation_history, system_prompt, prompt, model):
    logging.info(f"Generating text with conversation history: {conversation_history}")

    conversation = [
        {'role': 'system', 'content': 'You are a patient in a simulated interview with a doctor. '
                                      'Please engage in a conversation and provide brief responses. '
                                      'Keep your answers short and interactive. '
                                      'Do not provide overly long responses. '
                                      'Speak naturally, using fillers like "um," "uh," and "like." '
                                      'Make sure your tone is friendly and human-like, '
                                      'with pauses where appropriate, and avoid sounding too formal or robotic. '
                                      + system_prompt},
        {'role': 'user', 'content': prompt},
    ]

    conversation.extend(conversation_history)

    logging.debug(f"Messages for OpenAI API: {conversation}")

    try:
        response = openai.chat.completions.create(
            model=model,
            messages=conversation,
            max_tokens=50,
            temperature=0.7
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logging.error(f"Exception occurred in generate_text_from_prompt: {str(e)}")
        raise e



def convert_text_to_speech(text, module_id):
    module = Module.objects.get(moduleid=module_id)
    voice = module.voice

    audio_file_name = 'tts' + str(uuid.uuid4()) + '.mp3'

    if USE_AZURE_BLOB_STORAGE:
        audio_file_url = _upload_tts_to_blob_storage(text, audio_file_name, voice)

    return audio_file_url

def _upload_stt_to_blob_storage(audio_file, audio_file_name):
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=audio_file_name)

        blob_client.upload_blob(audio_file, overwrite= True)

        blob_url = blob_client.url

        return blob_url
    except Exception as e:
        logging.error(f'Exception occurred while uploading to Blob Storage: {str(e)}')
        raise e


def _process_stt_audio(file_path_or_url):
    try:
        if USE_AZURE_BLOB_STORAGE:
            blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
            blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=file_path_or_url.split('/')[-1])

            buffer = io.BytesIO()

            blob_client.download_blob().readinto(buffer)

            blob_name = file_path_or_url.split("/")[-1]
            logging.info(f"Blob name: {blob_name}")

            buffer.name = blob_name

            response = openai.audio.transcriptions.create(
                model='whisper-1',
                file=buffer,
                response_format='text',
                prompt='ZyntriQix, Digique Plus, CynapseFive, VortiQore V8, EchoNix Array, OrbitalLink Seven, DigiFractal Matrix, PULSE, RAPT, B.R.I.C.K., Q.U.A.R.T.Z., F.L.I.N.T.'
            )

            blob_client.delete_blob()

        else:
            with open(file_path_or_url, 'rb') as file_to_transcribe:
                response = openai.audio.transcriptions.create(
                    model='whisper-1',
                    file=file_to_transcribe,
                    response_format='text',
                    prompt='ZyntriQix, Digique Plus, CynapseFive, VortiQore V8, EchoNix Array, OrbitalLink Seven, DigiFractal Matrix, PULSE, RAPT, B.R.I.C.K., Q.U.A.R.T.Z., F.L.I.N.T.'
                )

            os.remove(file_path_or_url)

        return response.get('text', '') if isinstance(response, dict) else response

    except Exception as e:
        logging.error(f'Exception occurred in process_audio_logic: {str(e)}')
        raise e

def _upload_tts_to_blob_storage(text, audio_file_name, voice):
    try:
        response = openai.audio.speech.create(
            model='tts-1',
            voice=voice,
            input=text
        )

        audio_content = response.content

        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=AZURE_BLOB_CONTAINER_NAME, blob=audio_file_name)

        blob_client.upload_blob(audio_content, overwrite=True)

        logging.info(f"Uploaded TTS audio to Azure Blob Storage: {audio_file_name}")

        blob_url = blob_client.url
        return blob_url

    except Exception as e:
        logging.error(f"Exception occurred while uploading TTS to Blob Storage: {str(e)}")
        raise e


# TODO
# Clear Logic for audio files