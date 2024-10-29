This is a SHN Project repository.
=======
SHN Project Setup
To get started, follow these steps

backend (Python 3.12)
1. Install the necessary packages
```
- pip install django
- pip install openai
- pip install django-cors-headers
- pip install python-dotenv
- pip install azure-storage-blob
- pip install django-mssql-backend
- pip install pyodbc
- pip install djangorestframework
- pip install mssql-django
```

2. Add the .env file to the 'backend' directory (at the same level as the manage.py file). In the .env file, include the followings
```
- OPENAI_API_KEY=''
- USE_AZURE_BLOB_STORAGE=True 
- AZURE_STORAGE_CONNECTION_STRING=''
- AZURE_BLOB_CONTAINER_NAME=''
- DB_NAME=''
- DB_USER=''
- DB_PASSWORD=''
- DB_HOST=''
- DB_PORT=''
- MODULE_ATTACHMENTS_BLOB_CONTAINER=module-attachments
```

3. Navigate to the root folder of the project and run the following commands to set up and start the server
```
- python manage.py migrate
- python manage.py runserver
```

4. Open your browser and go to localhost:8000 to view the running application

frontend
1. Install the necessary packages (make sure your under frontend/virtual-patient-interview directory)
```
- npm install
- npm install react-router-dom
- npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
- npm install antd --save
- npm install js-cookie
```

2. Add the .env file in the root directory under the 'frontend' directory
```
- VITE_API_BASE_URL_LOCAL = 'http://localhost:8000'
- VITE_API_BASE_URL_PROD = 'standarizedpatientai-bygdfaf7epfwbafn.canadacentral-01.azurewebsites.net'.
```
3. Navigate to the root folder of the project and run the following commands to set up and start the server
```
- npm run dev
```
4. Open your browser and go to localhost:5173 to view the running application
<<<<< HEAD
5.For Testing
