SHN Project Setup
To get started, follow these steps

backend (Python 3.12)
1. Install the necessary packages
- pip install django
- pip install openai
- pip install django-cors-headers
- pip install python-dotenv
- pip install azure-storage-blob
- pip install psycopg2-binary
- pip install djangorestframework

2. Add the .env file to the backend directory (at the same level as the manage.py file). In the .env file, include the followings
- OPENAI_API_KEY=your_openai_api_key
- USE_AZURE_BLOB_STORAGE=False  # Set this to True when using Azure Blob Storage, False when working in a local environment 
- AZURE_STORAGE_CONNECTION_STRING=azure_storage_connection_string
- AZURE_BLOB_CONTAINER_NAME=container_name

3. Navigate to the root folder of the project and run the following commands to set up and start the server
- python manage.py makemigrations
- python manage.py migrate
- python manage.py runserver

4. Open your browser and go to localhost:8000 to view the running application

frontend
1. Install the necessary packages
- npm install

2. Navigate to the root folder of the project and run the following commands to set up and start the server
- npm run dev

3. Open your browser and go to localhost:5173 to view the running application

database
1. Check connection via Django shell
- python manage.py dbshell
2. See table lists
- \dt
3. Check data via sql query
