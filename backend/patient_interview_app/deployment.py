import os
from .settings import *
from .settings import BASE_DIR

ALLOWED_HOSTS = [os.environ['WEBSITE_HOSTNAME']]
CSRF_TRUSTED_ORIGINS = ['https://'+os.environ['WEBSITE_HOSTNAME']]
DEBUG = False
SECRET_KEY=os.environ['MY_SECRET_KEY']

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "https://ashy-stone-000b7c90f.5.azurestaticapps.net",
]

CORS_ALLOW_METHODS = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
]

CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'X-CSRFToken',
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "https://ashy-stone-000b7c90f.5.azurestaticapps.net"
]

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

SESSION_COOKIE_SAMESITE = 'None'
SESSION_COOKIE_SECURE = True  # Set to True for HTTPS, False for local testing
CSRF_COOKIE_SAMESITE = 'None'  # Same as above for CSRF
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_AGE = 1209600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

CONNECTION = os.environ['AZURE_SQL_CONN_STR']
CONNECTION_STR = {pair.split('=')[0]: pair.split('=')[1] for pair in CONNECTION.split(';') if '=' in pair}
#CONNECTION_STR = {pair.split('=')[0]:pair.split('=')[1] for pair in CONNECTION.split(' ')}

#
# DATABASES = {
#     "default": {
#         "ENGINE": "mssql",
#         "NAME": CONNECTION_STR['dbname'],
#         "USER": CONNECTION_STR['user'],
#         "PASSWORD": CONNECTION_STR['password'],
#         "HOST": CONNECTION_STR['host'],
#         'OPTIONS': {
#             'driver': 'ODBC Driver 18 for SQL Server',
#             'extra_params': 'TrustServerCertificate=yes;',
#         },
#     }
# }

DATABASES = {
    "default": {
        "ENGINE": "mssql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT",1433),
        'OPTIONS': {
            'driver': 'ODBC Driver 18 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes;',
        },
    }
}

EMAIL_HOST = os.getenv("SMTP_EMAIL_HOST")
EMAIL_PORT = os.getenv("SMTP_EMAIL_PORT")
EMAIL_HOST_USER = os.getenv("SMTP_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("SMTP_HOST_PASSWORD")
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

STATIC_ROOT = BASE_DIR/'staticfiles'
