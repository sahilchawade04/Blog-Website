from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Standard fields first_name, last_name, email are in AbstractUser
    # Frontend expects camelCase in JSON, we'll map that in Serializer
    email = models.EmailField(unique=True)
    
    # Profile fields from Profile.jsx
    bio = models.TextField(blank=True, default="")
    occupation = models.CharField(max_length=255, blank=True, null=True)
    photo_url = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    
    # Social links
    instagram = models.CharField(max_length=255, blank=True, default="")
    linkedin = models.CharField(max_length=255, blank=True, default="")
    github = models.CharField(max_length=255, blank=True, default="")
    facebook = models.CharField(max_length=255, blank=True, default="")

    # RBAC Roles
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('AUTHOR', 'Author'),
        ('READER', 'Reader'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='READER')

    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    def __str__(self):
        return self.username

class Blog(models.Model):
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True) # Added subtitle field
    # Frontend might use 'category' as string
    category = models.CharField(max_length=100, blank=True, null=True)
    
    # TinyMCE/CKEditor content usually HTML string
    description = models.TextField(blank=True, default="") 
    
    thumbnail = models.ImageField(upload_to='blog_thumbnails/', blank=True, null=True)
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs')
    
    likes = models.ManyToManyField(User, related_name='liked_blogs', blank=True)
    
    # For 'get-published-blogs'
    is_published = models.BooleanField(default=False)
    
    # For logic in BlogView.jsx
    views = models.IntegerField(default=0)
    
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Comment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    likes = models.ManyToManyField(User, related_name='liked_comments', blank=True)
    
    # Threaded comments support
    parent_comment = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.post.title}"
