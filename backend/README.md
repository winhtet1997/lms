# Math Mentor(Backend)

### Requirements
- Python 3.12 or higher
- Django 5 or higher
- Virtualenv

## 1. Go to backend directory
```
cd backend
```

## 2. Activate Python  Virtual Environment
If you don't have Python 3.12 installed, download and install it from the [official Python website](https://www.python.org/downloads/).
Don't download the latest version of the Python. Try to download the LTS version.

### Install virtualenv if you haven't already
```
pip install virtualenv
```

### Create a new virtual environment
```
python3 -m venv .venv
```

### Activate the virtual environment
### On Windows
```
.venv\Scripts\activate
```
### On macOS/Linux
```
source .venv/bin/activate
```

## 3. Install Dependencies
```
pip install -r requirements.txt
```

## 4. Create a .env file and place it on the backend folder
```
SECRET_KEY=very-secret-key
DEBUG=True
ALLOWED_HOSTS='127.0.0.1, localhost'
STATIC_ROOT='../static'
MEDIA_ROOT='../media'
DEBUG=True
CORS_ALLOWED_ORIGINS='http://localhost:3000, http://127.0.0.1:3000'
CSRF_TRUSTED_ORIGINS='http://127.0.0.1'
ACCESS_TOKEN_LIFETIME_DAYS=100
ACCESS_TOKEN_LIFETIME_HOURS=0
ACCESS_TOKEN_LIFETIME_MINUTES=0
ACCESS_TOKEN_LIFETIME_SECONDS=20
REFRESH_TOKEN_LIFETIME_DAYS=200
REFRESH_TOKEN_LIFETIME_HOURS=0
REFRESH_TOKEN_LIFETIME_MINUTES=0
REFRESH_TOKEN_LIFETIME_SECONDS=40
EMAIL_HOST=''
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_TIMEOUT=45
EMAIL_HOST_USER=''
EMAIL_HOST_PASSWORD=''
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DJANGO_ENV=development
POSTGRES_DB=mathmentor
POSTGRES_USER=root
POSTGRES_PASSWORD=root
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432
AWS_ACCESS_KEY_ID=access-key
AWS_SECRET_ACCESS_KEY=secret-key
AWS_S3_BUCKET_NAME= bucket_name
AWS_S3_REGION=region_name
```

## 5. Database Setup(SQLITE)
```
python manage.py migrate
```
### To use postgresql as the database please follow this [instruction](DatabaseSetup.md).
## 7. Run the Development Server
```
python manage.py runserver
```

## 8. Run the Celery Worker
```
celery -A lms worker -l info
```
### This is needed to calculate the video duration and for chunk by chunk upload.
### To add this worker as a service you can use create a file on /etc/systemd/system/zabai-celery-worker.service and copy the below
```
[Unit]
Description=Celery Worker
After=network.target

[Service]
Type=simple
User=username
Group=username
WorkingDirectory=/home/username/<project_directory>/backend

Environment="PATH=/usr/local/bin:/usr/bin:/bin:/home/<project_directory>/backend/.venv/bin"

ExecStart=/home/username/<project_directory>/backend/.venv/bin/celery -A lms worker -l info

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target

```

## 9. Linting
```
flake8
```