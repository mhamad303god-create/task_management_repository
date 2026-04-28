from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST
from django.utils import timezone
from django.db.models import Q
import json
import logging
from datetime import date

from .models import Task, Category

logger = logging.getLogger(__name__)

def home(request):
    if request.user.is_authenticated:
        context = {
            'user': request.user,
            'is_authenticated': True,
            'is_staff': request.user.is_staff,
            'is_superuser': request.user.is_superuser,
        }
    else:
        context = {
            'is_authenticated': False,
            'is_staff': False,
            'is_superuser': False,
        }
    return render(request, 'index.html', context)


# ============================
# API - المهام
# ============================

@login_required
@require_http_methods(["GET"])
def api_tasks_list(request):
    try:
        filter_type = request.GET.get('filter', 'all')
        category_id = request.GET.get('category', None)
        priority = request.GET.get('priority', None)
        search_query = request.GET.get('search', '')

        tasks = Task.objects.filter(user=request.user).select_related('category')

        if filter_type == 'completed':
            tasks = tasks.filter(is_completed=True)
        elif filter_type == 'pending':
            tasks = tasks.filter(is_completed=False)
        elif filter_type == 'overdue':
            tasks = tasks.filter(is_completed=False, due_date__lt=timezone.now().date())

        if category_id and category_id != 'all':
            tasks = tasks.filter(category_id=category_id)

        if priority and priority != 'all':
            tasks = tasks.filter(priority=priority)

        if search_query:
            tasks = tasks.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query)
            )

        tasks = tasks.order_by('-created_at')

        tasks_data = []
        for task in tasks:
            tasks_data.append({
                'id': task.id,
                'title': task.title,
                'description': task.description or '',
                'priority': task.priority,
                'is_completed': task.is_completed,
                'created_at': task.created_at.isoformat(),
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'category': {
                    'id': task.category.id,
                    'name': task.category.name
                } if task.category else None,
            })

        return JsonResponse({
            'success': True,
            'tasks': tasks_data,
            'count': len(tasks_data)
        })

    except Exception as e:
        logger.error(f"Error fetching tasks: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء جلب المهام'
        }, status=500)


@login_required
@require_POST
@csrf_exempt
def api_task_create(request):
    try:
        data = json.loads(request.body)

        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        category_id = data.get('category_id')
        priority = data.get('priority', 'medium')
        due_date_str = data.get('due_date') or None
        due_date = None
        if due_date_str:
            try:
                due_date = date.fromisoformat(due_date_str)
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'error': 'تاريخ الاستحقاق غير صالح'
                }, status=400)

        if not title:
            return JsonResponse({
                'success': False,
                'error': 'عنوان المهمة مطلوب'
            }, status=400)

        if priority not in ('high', 'medium', 'low'):
            priority = 'medium'

        category = None
        if category_id:
            try:
                category = Category.objects.get(id=category_id, user=request.user)
            except Category.DoesNotExist:
                pass

        task = Task.objects.create(
            user=request.user,
            title=title,
            description=description,
            category=category,
            priority=priority,
            due_date=due_date if due_date else None,
        )

        return JsonResponse({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'description': task.description or '',
                'priority': task.priority,
                'is_completed': task.is_completed,
                'created_at': task.created_at.isoformat(),
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'category': {
                    'id': task.category.id,
                    'name': task.category.name
                } if task.category else None,
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء إنشاء المهمة'
        }, status=500)


@login_required
@require_http_methods(["PUT", "POST"])
@csrf_exempt
def api_task_update(request, task_id):
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        data = json.loads(request.body)

        if 'title' in data:
            task.title = data['title'].strip()
        if 'description' in data:
            task.description = data['description'].strip()
        if 'is_completed' in data:
            task.is_completed = data['is_completed']
        if 'priority' in data:
            if data['priority'] in ('high', 'medium', 'low'):
                task.priority = data['priority']
        if 'category_id' in data:
            if data['category_id']:
                try:
                    task.category = Category.objects.get(id=data['category_id'], user=request.user)
                except Category.DoesNotExist:
                    task.category = None
            else:
                task.category = None
        if 'due_date' in data:
            due_date_val = data['due_date']
            if due_date_val:
                try:
                    task.due_date = date.fromisoformat(due_date_val)
                except ValueError:
                    return JsonResponse({
                        'success': False,
                        'error': 'تاريخ الاستحقاق غير صالح'
                    }, status=400)
            else:
                task.due_date = None

        task.save()

        return JsonResponse({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'description': task.description or '',
                'priority': task.priority,
                'is_completed': task.is_completed,
                'created_at': task.created_at.isoformat(),
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'category': {
                    'id': task.category.id,
                    'name': task.category.name
                } if task.category else None,
            }
        })

    except Task.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'المهمة غير موجودة'
        }, status=404)
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error updating task: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء تحديث المهمة'
        }, status=500)


@login_required
@require_http_methods(["DELETE", "POST"])
@csrf_exempt
def api_task_delete(request, task_id):
    try:
        task = Task.objects.get(id=task_id, user=request.user)
        task.delete()

        return JsonResponse({
            'success': True,
            'message': 'تم حذف المهمة بنجاح'
        })

    except Task.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'المهمة غير موجودة'
        }, status=404)
    except Exception as e:
        logger.error(f"Error deleting task: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء حذف المهمة'
        }, status=500)


@login_required
@require_POST
@csrf_exempt
def api_tasks_clear(request):
    try:
        Task.objects.filter(user=request.user).delete()
        return JsonResponse({
            'success': True,
            'message': 'تم مسح جميع المهام'
        })
    except Exception as e:
        logger.error(f"Error clearing tasks: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء مسح المهام'
        }, status=500)


# ============================
# API - الفئات
# ============================

@login_required
@require_http_methods(["GET"])
def api_categories_list(request):
    try:
        categories = Category.objects.filter(user=request.user).order_by('name')

        categories_data = []
        for cat in categories:
            task_count = Task.objects.filter(user=request.user, category=cat).count()
            categories_data.append({
                'id': cat.id,
                'name': cat.name,
                'task_count': task_count
            })

        return JsonResponse({
            'success': True,
            'categories': categories_data
        })

    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء جلب الفئات'
        }, status=500)


@login_required
@require_POST
def api_category_create(request):
    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()

        if not name:
            return JsonResponse({
                'success': False,
                'error': 'اسم الفئة مطلوب'
            }, status=400)

        if Category.objects.filter(user=request.user, name=name).exists():
            return JsonResponse({
                'success': False,
                'error': 'هذه الفئة موجودة بالفعل'
            }, status=400)

        category = Category.objects.create(user=request.user, name=name)

        return JsonResponse({
            'success': True,
            'category': {
                'id': category.id,
                'name': category.name
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء إنشاء الفئة'
        }, status=500)


# ============================
# API - المستخدمين
# ============================

@require_http_methods(["POST"])
@csrf_exempt
def api_register(request):
    try:
        data = json.loads(request.body)

        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()

        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم وكلمة المرور مطلوبة'
            }, status=400)

        if len(username) < 3:
            return JsonResponse({
                'success': False,
                'error': 'يجب أن يكون اسم المستخدم 3 أحرف على الأقل'
            }, status=400)

        if len(password) < 6:
            return JsonResponse({
                'success': False,
                'error': 'يجب أن تكون كلمة المرور 6 أحرف على الأقل'
            }, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()

        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم موجود بالفعل'
            }, status=400)

        if email and User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'error': 'هذا البريد الإلكتروني مستخدم بالفعل'
            }, status=400)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )

        login(request, user)

        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in registration: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء التسجيل'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def api_login(request):
    try:
        data = json.loads(request.body)

        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم وكلمة المرور مطلوبة'
            }, status=400)

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'اسم المستخدم أو كلمة المرور غير صحيحة'
            }, status=401)

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in login: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء تسجيل الدخول'
        }, status=500)


@login_required
@require_http_methods(["POST"])
def api_logout(request):
    try:
        logout(request)
        return JsonResponse({
            'success': True,
            'message': 'تم تسجيل الخروج بنجاح'
        })
    except Exception as e:
        logger.error(f"Error in logout: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء تسجيل الخروج'
        }, status=500)


@login_required
@require_http_methods(["GET"])
def api_user_info(request):
    try:
        user = request.user

        total_tasks = Task.objects.filter(user=user).count()
        completed_tasks = Task.objects.filter(user=user, is_completed=True).count()
        pending_tasks = Task.objects.filter(user=user, is_completed=False).count()

        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'stats': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
            }
        })

    except Exception as e:
        logger.error(f"Error fetching user info: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء جلب المعلومات'
        }, status=500)


@login_required
@require_http_methods(["POST"])
def api_user_update(request):
    try:
        data = json.loads(request.body)
        user = request.user

        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()

        user.save()

        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'بيانات غير صالحة'
        }, status=400)
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء تحديث البيانات'
        }, status=500)


# ============================
# API - الإحصائيات
# ============================

@login_required
@require_http_methods(["GET"])
def api_dashboard_stats(request):
    try:
        user = request.user
        today = timezone.now().date()

        total_tasks = Task.objects.filter(user=user).count()
        completed_tasks = Task.objects.filter(user=user, is_completed=True).count()
        pending_tasks = Task.objects.filter(user=user, is_completed=False).count()
        overdue_tasks = Task.objects.filter(
            user=user,
            is_completed=False,
            due_date__lt=today
        ).count()

        # tasks created this week
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        week_tasks = Task.objects.filter(user=user, created_at__gte=week_ago).count()

        # category stats
        category_stats = []
        categories = Category.objects.filter(user=user)
        for cat in categories:
            task_count = Task.objects.filter(user=user, category=cat).count()
            completed_count = Task.objects.filter(user=user, category=cat, is_completed=True).count()
            category_stats.append({
                'id': cat.id,
                'name': cat.name,
                'total': task_count,
                'completed': completed_count
            })

        # priority stats
        high_count = Task.objects.filter(user=user, priority='high').count()
        medium_count = Task.objects.filter(user=user, priority='medium').count()
        low_count = Task.objects.filter(user=user, priority='low').count()

        # weekly breakdown (last 7 days)
        weekly_data = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_completed = Task.objects.filter(
                user=user, is_completed=True, due_date=day
            ).count()
            day_pending = Task.objects.filter(
                user=user, is_completed=False, due_date=day
            ).count()
            weekly_data.append({
                'date': day.isoformat(),
                'completed': day_completed,
                'pending': day_pending
            })

        return JsonResponse({
            'success': True,
            'stats': {
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'overdue_tasks': overdue_tasks,
                'week_tasks': week_tasks,
                'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
                'priority': {
                    'high': high_count,
                    'medium': medium_count,
                    'low': low_count,
                }
            },
            'category_stats': category_stats,
            'weekly_data': weekly_data
        })

    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'حدث خطأ أثناء جلب الإحصائيات'
        }, status=500)
