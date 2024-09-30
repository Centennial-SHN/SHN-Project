SHN Project Setup
To get started, follow these steps:

1. Install the necessary packages:
- pip install django
- pip install openai
- pip install django-cors-headers
- pip install python-dotenv

2. In the .env file, add your OpenAI API key:
- OPENAI_API_KEY=your_openai_api_key

3. Navigate to the root folder of the project and run the following commands to set up and start the server:
- python manage.py migrate
- python manage.py runserver
- localhost:8000
