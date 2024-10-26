# utils.py

import os
import uuid
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)
# Load environment variables from .env file
load_dotenv()
# Get environment variables
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
MODULE_ATTACHMENTS_BLOB_CONTAINER = os.getenv('MODULE_ATTACHMENTS_BLOB_CONTAINER', 'module-attachments')


def upload_file_to_blob(file):
    try:
        # Generate a unique name for the blob
        file_extension = os.path.splitext(file.name)[1]
        blob_name = f"{uuid.uuid4()}{file_extension}"
        
        # Initialize the blob service client
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
        
        # Get the container client
        container_client = blob_service_client.get_container_client(MODULE_ATTACHMENTS_BLOB_CONTAINER)
        
        # Get blob client
        blob_client = container_client.get_blob_client(blob_name)
        
        # Read the content from the file
        content = file.read()

        # For text files, ensure proper encoding
        if file.content_type == 'text/plain' and isinstance(content, str):
            content = content.encode('utf-8')
        
        # Upload the blob
        blob_client.upload_blob(content, overwrite=True)
        
        # Get the URL
        blob_url = blob_client.url
        logger.info(f"File uploaded successfully. URL: {blob_url}")  # Enable logging
        
        return blob_url
        
    except AzureError as e:
        logger.error(f"Azure Storage error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error uploading file: {str(e)}")
        return None
