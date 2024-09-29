import os
import tempfile
import openai
import logging
from pathlib import Path

def process_audio_file(audio_file):
    extension = os.path.splitext(audio_file.name)[1]
    if not extension:
        extension = ".mp4"

    try:
        # Save the uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        # Open the temporary file and send it to OpenAI API
        with open(temp_file_path, "rb") as file_to_transcribe:
            response = openai.audio.transcriptions.create(
                model="whisper-1",
                file=file_to_transcribe,
                response_format="text",
                prompt="ZyntriQix, Digique Plus, CynapseFive, VortiQore V8, EchoNix Array, OrbitalLink Seven, DigiFractal Matrix, PULSE, RAPT, B.R.I.C.K., Q.U.A.R.T.Z., F.L.I.N.T."
            )

        # Clean up the temporary file
        os.remove(temp_file_path)

        if isinstance(response, dict):
            return response.get("text", "")
        else:
            return response

    except Exception as e:
        logging.error(f"Exception occurred in process_audio_file: {str(e)}")
        raise e

def generate_text_from_prompt(prompt_text):
    logging.info(f"Transcribed text: {prompt_text}")
    try:
        response = openai.chat.completions.create(
            model = "gpt-4o-mini",
            messages=[
                {'role': 'system', 'content': 'I am a doctor, and you are a patient. Please speak like a patient'},
                {'role': 'user', 'content': prompt_text},
            ],
            max_completion_tokens=20,
            temperature=0.7
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        logging.eror(f'Exception occurred in generate_text_from_prompt: {str(e)}')
        raise e

def convert_text_to_speech(text):
    logging.info(f"text: {text}")

    # Create a temporary file to store the speech
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
            speech_file_path = Path(temp_file.name)

        response = openai.audio.speech.create(
            model='tts-1',
            voice='alloy',
            input=text
        )

        response.stream_to_file(speech_file_path)

        return speech_file_path

    except Exception as e:
        logging.error(f'Exception occurred in convert_text_to_speech: {str(e)}')
        raise e


# TODO
'''
conversation_history = [
    {"role": "system", "content": "I am a doctor, and you are a patient. Please speak like a patient"},
]

def add_user_message(message):
    conversation_history.append({"role": "user", "content": message})

def add_assistant_message(message):
    conversation_history.append({"role": "assistant", "content": message})
'''