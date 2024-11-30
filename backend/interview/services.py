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



def upload_file_to_blob(file, moduleid):
    try:
        file_extension = os.path.splitext(file.name)[1]
        base_file_name = os.path.splitext(file.name)[0]

        sanitized_base_name = re.sub(r'[^\w\-.]', '_', base_file_name)
        blob_name = f"{moduleid}_{sanitized_base_name}{file_extension}"

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

def delete_file_from_blob(file_name, moduleid):
    try:
        file_name = f"{moduleid}_{file_name}"

        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)

        container_client = blob_service_client.get_container_client(MODULE_ATTACHMENTS_BLOB_CONTAINER)

        blob_client = container_client.get_blob_client(file_name)

        blob_client.delete_blob()
        
        logger.info(f"File deleted successfully: {file_name}")
        return True

    except AzureError as e:
        logger.error(f"Azure Storage error during deletion: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting file: {str(e)}")
        return False


from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_pinecone import Pinecone
from pinecone import Pinecone as PineconeClient, ServerlessSpec
import logging
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_openai.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from dotenv import load_dotenv
import os

load_dotenv()
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("INDEX_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

logging.basicConfig(
    level=logging.INFO,
)


def process_and_store_file(file, patient_id: str):
    """
    Processes a file, generates embeddings, and stores them in a Pinecone index.

    Args:
        file: A file-like object (e.g., an uploaded file).
        patient_id (str): Unique identifier for the patient.
    """
    try:
        logging.info("Starting the file processing pipeline.")

        # Save the uploaded file temporarily
        temp_file_path = f"/tmp/{file.name}"
        with open(temp_file_path, 'wb') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)

        # Use PyPDFLoader to load the content
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        logging.info(f"Loaded {len(documents)} pages from the file.")

        # Split the document into smaller chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        docs = text_splitter.split_documents(documents)
        logging.info(f"Split the document into {len(docs)} chunks.")

        # Initialize Pinecone client
        logging.info("Initializing Pinecone client.")
        pc = PineconeClient(api_key=PINECONE_API_KEY)
        index_name = PINECONE_INDEX_NAME

        # Check and create index if necessary
        if index_name not in pc.list_indexes().names():
            logging.info(f"Creating Pinecone index: {index_name}")
            pc.create_index(
                name=index_name,
                dimension=1536,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )
            while not pc.describe_index(index_name).status['ready']:
                logging.info("Waiting for Pinecone index to become ready...")
                time.sleep(1)
        else:
            logging.info(f"Pinecone index '{index_name}' already exists.")

        # Generate embeddings using OpenAI
        logging.info("Initializing OpenAI embeddings.")
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=OPENAI_API_KEY)

        # Store the data in Pinecone
        logging.info(f"Storing {len(docs)} chunks in Pinecone index '{index_name}'.")
        namespace = f"patient_{patient_id}"
        vectorstore = Pinecone.from_documents(
            docs,
            embeddings,
            index_name=PINECONE_INDEX_NAME,
            namespace=namespace
        )
        logging.info(f"Data successfully stored in Pinecone index '{PINECONE_INDEX_NAME}'.")

        # Cleanup the temporary file
        os.remove(temp_file_path)
    except Exception as e:
        logging.error(f"An error occurred: {e}")


def simulate_patient_interview(query: str, patient_id: str, chat_history: list = None, system_prompt: str = None,
                               top_k: int = 3):
    """
    Simulates a patient interview by retrieving relevant information from Pinecone
    and generating a response using OpenAI's chat model, incorporating chat history.

    Args:
        query (str): The query or question from the medical student.
        chat_history (list): List of previous messages in the conversation.
        top_k (int): Number of top results to retrieve from Pinecone.

    Returns:
        str: The response generated by OpenAI.
    """
    try:
        if chat_history is None:
            chat_history = []

        embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=OPENAI_API_KEY)
        vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)

        results = vectorstore.similarity_search(query, k=top_k, namespace=patient_id)

        retrieved_info = "\n".join([result.page_content for result in results])

        formatted_chat_history = "\n".join(
            f"User: {msg.content}" if isinstance(msg, HumanMessage) else f"Assistant: {msg.content}"
            for msg in chat_history
        )

        results = vectorstore.similarity_search(query, k=top_k, namespace=patient_id)
        retrieved_info = "\n".join([result.page_content for result in results])

        contextual_query = f"""
        {system_prompt if system_prompt else ""}
        You are {patient_id}, a patient undergoing a medical interview. Your purpose is to simulate a real-life patient by providing accurate, concise, and realistic responses to the medical student's questions.

        Guidelines for your responses:
           - Treat the provided information as your own medical history and use it to answer all questions.
           - If the information is unavailable, respond with "I don't have enough information to answer that."
           - Always remain polite, professional, and in character as a patient.
           - Keep responses to 2-3 sentences unless explicitly asked for more details or clarification.
           - Do not invent or assume information that is not explicitly provided.     

        Your Medical History:
        {retrieved_info}
         Chat History:
        {formatted_chat_history}
        Current Question:
        {query}

        The medical student may ask follow-up questions based on your previous answers. Use the context from the chat history to maintain continuity in your responses.

        If the student asks about the last question or a summary of the conversation, reference the chat history to provide accurate and relevant information.

        """

        logging.info(f"Contextual query: {contextual_query}")

        chat_model = ChatOpenAI(model="o1-mini-2024-09-12", openai_api_key=OPENAI_API_KEY, store=True)

        response = chat_model.invoke([HumanMessage(content=contextual_query)])
        logging.info(f"Generated response: {response.content.strip()}")

        chat_history.append(HumanMessage(content=query))
        chat_history.append(response)

        return response.content.strip(), chat_history
    except Exception as e:
        return f"An error occurred: {e}", chat_history


def multi_agent_conversation(doctor_question: str, patient_id: str, chat_history: list = None,
                             system_prompt: str = None, prompt: str = None, top_k: int = 3):
    """
    Simulates a multi-agent conversation using few-shot prompts in a single model,
    incorporating relevant information retrieved from a Pinecone vector store.

    Args:
        doctor_question (str): The doctor's question.
        chat_history (list): Previous conversation history.
        top_k (int): Number of relevant vector chunks to retrieve.

    Returns:
        dict: Responses from child and parent in sequence.
    """

    chat_model = ChatOpenAI(model="o1-mini-2024-09-12", openai_api_key=os.environ["OPENAI_API_KEY"], store=True)

    embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=os.environ["OPENAI_API_KEY"])
    vectorstore = PineconeVectorStore(index_name=os.environ["INDEX_NAME"], embedding=embeddings)
    if chat_history is None:
        chat_history = []

    for i, message in enumerate(chat_history):
        if not isinstance(message, dict) or "role" not in message or "content" not in message:
            raise ValueError(f"Invalid message format in chat_history at index {i}: {message}")

    formatted_history = "\n".join(
        f"{message['role'].capitalize()}: {message['content']}" for message in chat_history
    )

    retrieved_info = ""
    try:
        results = vectorstore.similarity_search(doctor_question, k=top_k, namespace=patient_id)
        retrieved_info = "\n".join([result.page_content for result in results])
        logging.info("retrieved info:", retrieved_info)

    except Exception as e:
        logging.error(f"Error during vector retrieval: {e}")

    # Construct the conversation prompt
    prompt = f"""
    {system_prompt if system_prompt else ""}
    You are simulating a conversation between a doctor, a child, and the child's parent.
    Each role has specific responsibilities:
    - The doctor asks questions to diagnose the issue.
    - The child responds about their symptoms.
    - The parent provides additional context or asks follow-up questions.

    Ensure the parent always responds after the child.

    Use the following patient information if relevant:
    {retrieved_info}

    Example Conversation:
    Doctor: Hi kid, can you tell me which area you feel the pain?
    Child: I feel the lower right tummy is very painful.
    Parent: I told you not to jump after eating food. Doctor, do you think he got Appendicitis?

    Continue the conversation below, but respond with only the next single turn:
    {formatted_history}

    Doctor: {doctor_question}
    """
    response = chat_model.invoke([HumanMessage(content=prompt)])

    # Parse the AI's response to extract roles and content
    new_messages = []
    for line in response.content.strip().split("\n"):
        if ": " in line:
            role, content = line.split(": ", 1)
            new_messages.append({"role": role.lower(), "content": content.strip()})

    # Ensure child and parent responses are included
    roles_in_response = {message["role"] for message in new_messages}
    if "child" in roles_in_response and "parent" not in roles_in_response:
        # Generate a parent response if missing
        parent_prompt = f"As the parent, respond to Child's statement: '{new_messages[-1]['content']}'"
        parent_response = chat_model.invoke([HumanMessage(content=parent_prompt)])
        new_messages.append({"role": "parent", "content": parent_response.content.strip()})

    # Extract child and parent responses
    child_response = next((msg for msg in new_messages if msg["role"] == "child"), None)
    parent_response = next((msg for msg in new_messages if msg["role"] == "parent"), None)

    # Append doctor's question to chat history
    chat_history.append({"role": "doctor", "content": doctor_question})
    chat_history.extend(new_messages)

    # Return only the child and parent responses
    return {
        "child_response": child_response["content"] if child_response else "",
        "parent_response": parent_response["content"] if parent_response else ""
    }




def generate_text_from_prompt_with_context(
    conversation_history,
    system_prompt,
    prompt,
    model,
    query=None,
    patient_id=None,
    top_k=3
):
    """
    Generates a response using LangChain with OpenAI's chat model, incorporating conversation history,
    a system prompt, relevant context from Pinecone, and a user query.

    Args:
        conversation_history (list): List of previous conversation messages.
        system_prompt (str): System-level instructions for the AI.
        prompt (str): User's current prompt/question.
        model (str): OpenAI model to use.
        query (str): Query for Pinecone context retrieval (optional).
        patient_id (str): Identifier for the patient namespace in Pinecone (optional).
        top_k (int): Number of top results to retrieve from Pinecone.

    Returns:
        str: The generated response.
    """
    try:
        chat_history = [
            HumanMessage(content=msg['content']) if msg['role'] == 'user' else AIMessage(content=msg['content'])
            for msg in conversation_history
        ]

        retrieved_info = ""
        if query and patient_id:
            logging.info("Retrieving relevant information from Pinecone.")
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=OPENAI_API_KEY)
            vectorstore = PineconeVectorStore(index_name=PINECONE_INDEX_NAME, embedding=embeddings)

            results = vectorstore.similarity_search(query, k=top_k, namespace=patient_id)
            retrieved_info = "\n".join([result.page_content for result in results])
            logging.info(f"Retrieved context: {retrieved_info}")

        contextual_query = f"""
        {system_prompt}

        Relevant Context:
        {retrieved_info}

        Current Question:
        {query}

        Guidelines for your response:
        - Use the Relevant Context to answer the question accurately.
        - Limit responses to 2-3 sentences unless additional details are explicitly requested.
        """

        logging.info(f"Contextual query: {contextual_query}")

        chat_history.append(HumanMessage(content=contextual_query))

        chat_model = ChatOpenAI(model=model, openai_api_key=OPENAI_API_KEY, store=True)
        response = chat_model(chat_history)

        return response.content.strip()

    except Exception as e:
        logging.error(f"Exception occurred in generate_text_from_prompt_with_context: {str(e)}")
        raise e

