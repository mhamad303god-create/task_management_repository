from django.urls import path
from . import views

urlpatterns = [
    # الصفحة الرئيسية
    path('', views.home, name='home'),

    # API للمستخدمين
    path('api/register/', views.api_register, name='api_register'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/user/', views.api_user_info, name='api_user_info'),
    path('api/user/update/', views.api_user_update, name='api_user_update'),

    # API للمهام
    path('api/tasks/', views.api_tasks_list, name='api_tasks_list'),
    path('api/tasks/create/', views.api_task_create, name='api_task_create'),
    path('api/tasks/<int:task_id>/', views.api_task_update, name='api_task_update'),
    path('api/tasks/<int:task_id>/delete/', views.api_task_delete, name='api_task_delete'),
    path('api/tasks/clear/', views.api_tasks_clear, name='api_tasks_clear'),

    # API للفئات
    path('api/categories/', views.api_categories_list, name='api_categories_list'),
    path('api/categories/create/', views.api_category_create, name='api_category_create'),

    # API للإحصائيات
    path('api/stats/', views.api_dashboard_stats, name='api_dashboard_stats'),
]
