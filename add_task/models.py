from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User

# 1. جدول الفئات (Categories) - لتنظيم المهام
class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="اسم الفئة")
    
    def __str__(self):
        return self.name

# 2. جدول المهام (Tasks)
class Task(models.Model):
    # ربط المهمة بالمستخدم (صاحب المهمة)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks', verbose_name="المستخدم")
    # ربط المهمة بالفئة
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="الفئة")
    
    title = models.CharField(max_length=200, verbose_name="عنوان المهمة")
    description = models.TextField(null=True, blank=True, verbose_name="الوصف")
    is_completed = models.BooleanField(default=False, verbose_name="تم الإنجاز")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    due_date = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ الاستحقاق")

    def __str__(self):
        return self.title

# 3. جدول التعليقات (Comments)
class Comment(models.Model):
    # ربط التعليق بمهمة معينة
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments', verbose_name="المهمة")
    # ربط التعليق بالمستخدم الذي كتبه
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="كاتب التعليق")
    
    content = models.TextField(verbose_name="محتوى التعليق")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="وقت التعليق")

    def __str__(self):
        return f"تعليق بواسطة {self.author.username} على {self.task.title}"