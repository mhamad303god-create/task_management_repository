from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="اسم الفئة")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='categories',
        verbose_name="المستخدم", null=True, blank=True
    )

    class Meta:
        verbose_name_plural = "Categories"

    def _str_(self):
        return self.name


class Task(models.Model):
    PRIORITY_CHOICES = [
        ('high', 'عالية'),
        ('medium', 'متوسطة'),
        ('low', 'منخفضة'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='tasks',
        verbose_name="المستخدم"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True,
        verbose_name="الفئة"
    )
    title = models.CharField(max_length=200, verbose_name="عنوان المهمة")
    description = models.TextField(null=True, blank=True, verbose_name="الوصف")
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default='medium',
        verbose_name="الأولوية"
    )
    is_completed = models.BooleanField(default=False, verbose_name="تم الإنجاز")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ الإنشاء")
    due_date = models.DateField(null=True, blank=True, verbose_name="تاريخ الاستحقاق")

    def _str_(self):
        return self.title 