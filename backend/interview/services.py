import os
import openai
import logging
import uuid
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError
from dotenv import load_dotenv
import io
from .models import Module
import time
import logging
import re

logger = logging.getLogger(__name__)

load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
USE_AZURE_BLOB_STORAGE = os.getenv('USE_AZURE_BLOB_STORAGE', 'False') == 'True'
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
AZURE_BLOB_CONTAINER_NAME = os.getenv('AZURE_BLOB_CONTAINER_NAME')
MODULE_ATTACHMENTS_BLOB_CONTAINER= os.getenv('MODULE_ATTACHMENTS_BLOB_CONTAINER')



def process_audio_file(audio_file):
    start_time = time.time()

    extension = os.path.splitext(audio_file.name)[1] or '.mp3'
    audio_file_name = 'stt' + str(uuid.uuid4()) + extension

    if USE_AZURE_BLOB_STORAGE:
        audio_file_path = _upload_stt_to_blob_storage(audio_file, audio_file_name)

    stt_duration = time.time() - start_time
    logging.info(f"STT processing took {stt_duration:.2f} seconds.")

    return _process_stt_audio(audio_file_path)

def generate_text_from_prompt(conversation_history, system_prompt, prompt, model):
    start_time = time.time()

    system_prompt = f"{system_prompt} {prompt}"
    conversation = [
        {'role': 'system', 'content': system_prompt},
    ]

    conversation.extend(conversation_history)

    logging.info(f"Conversation: {conversation}")

    try:
        response = openai.chat.completions.create(
            model=model,
            messages=conversation,
            max_tokens=1000,
            temperature=0.7
        )
        generation_duration = time.time() - start_time
        logging.info(f"Text generation took {generation_duration:.2f} seconds.")

        return response.choices[0].message.content.strip()

    except Exception as e:
        logging.error(f"Exception occurred in generate_text_from_prompt: {str(e)}")
        raise e



def convert_text_to_speech(text, module_id):
    start_time = time.time()
    module = Module.objects.get(moduleid=module_id)
    voice = module.voice

    audio_file_name = 'tts' + str(uuid.uuid4()) + '.mp3'

    if USE_AZURE_BLOB_STORAGE:
        audio_file_url = _upload_tts_to_blob_storage(text, audio_file_name, voice)

    tts_duration = time.time() - start_time
    logging.info(f"TTS generation and upload took {tts_duration:.2f} seconds.")

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

        blob_url = blob_client.url
        return blob_url

    except Exception as e:
        logging.error(f"Exception occurred while uploading TTS to Blob Storage: {str(e)}")
        raise e


def upload_file_to_blob(file):
    try:
        file_extension = os.path.splitext(file.name)[1]
        base_file_name = os.path.splitext(file.name)[0]

        sanitized_base_name = re.sub(r'[^\w\-.]', '_', base_file_name)
        blob_name = f"{sanitized_base_name}{file_extension}"

        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

        container_client = blob_service_client.get_container_client(MODULE_ATTACHMENTS_BLOB_CONTAINER)

        blob_client = container_client.get_blob_client(blob_name)

        content = file.read()

        if file.content_type == 'text/plain' and isinstance(content, str):
            content = content.encode('utf-8')

        blob_client.upload_blob(content, overwrite=True)

        blob_url = blob_client.url
        logger.info(f"File uploaded successfully. URL: {blob_url}")

        return blob_url

    except AzureError as e:
        logger.error(f"Azure Storage error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading file: {str(e)}")
        return None
def delete_file_from_blob(file_name):
    try:
        # Initialize the blob service client
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        
        # Get the container client
        container_client = blob_service_client.get_container_client(MODULE_ATTACHMENTS_BLOB_CONTAINER)
        
        # Get blob client for the specific file
        blob_client = container_client.get_blob_client(file_name)
        
        # Delete the blob
        blob_client.delete_blob()
        
        logger.info(f"File deleted successfully: {file_name}")
        return True

    except AzureError as e:
        logger.error(f"Azure Storage error during deletion: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting file: {str(e)}")
        return False


# TODO
# Clear Logic for audio files
