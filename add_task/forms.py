from django import forms
from django.contrib.auth.models import User
from .models import Task, Category


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ('title', 'description', 'category', 'priority', 'due_date')
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'عنوان المهمة',
                'dir': 'rtl'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-input',
                'placeholder': 'وصف المهمة',
                'dir': 'rtl',
                'rows': 3
            }),
            'due_date': forms.DateInput(attrs={
                'class': 'form-input',
                'type': 'date'
            }),
            'priority': forms.Select(attrs={
                'class': 'form-select-custom'
            }),
            'category': forms.Select(attrs={
                'class': 'form-select-custom'
            }),
        }


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ('name',)
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'اسم الفئة',
                'dir': 'rtl'
            }),
        }