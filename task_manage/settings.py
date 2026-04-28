"""
Django settings for task_manage project.
"""

from pathlib import Path

# =========================
# BASE DIRECTORY
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent

# =========================
# SECURITY SETTINGS
# =========================
SECRET_KEY = 'django-insecure-2%mb2b$+d!6i70!d2iefwy_3n1ulrfv6q__blfzf+^3(z3=2j('

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'testserver']

# =========================
# APPLICATIONS
# =========================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',  # تأكد من وجوده!

    'add_task',
]

# =========================
# MIDDLEWARE
# =========================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# =========================
# URL CONFIG
# =========================
ROOT_URLCONF = 'task_manage.urls'

# =========================
# TEMPLATES
# =========================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # هذا صحيح
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.static',  # مهم جداً!
            ],
        },
    },
]

# =========================
# WSGI
# =========================
WSGI_APPLICATION = 'task_manage.wsgi.application'

# =========================
# DATABASE
# =========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# =========================
# PASSWORD VALIDATION
# =========================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# =========================
# INTERNATIONALIZATION
# =========================
LANGUAGE_CODE = 'ar'  # غيّر إلى العربية
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# =========================
# STATIC FILES (الحل الأساسي!)
# =========================
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # مجلد static الرئيسي
]
STATIC_ROOT = BASE_DIR / 'staticfiles'  # مهم للإنتاج

# =========================
# MEDIA FILES
# =========================
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'