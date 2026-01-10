from rest_framework import viewsets, status, permissions, generics, serializers # Added serializers import
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Count

from .models import Blog, Comment
from .serializers import UserSerializer, BlogSerializer, CommentSerializer
from .permissions import IsAdmin, IsAuthor, IsReader, IsAuthorOrReadOnly

User = get_user_model()

# Custom Token Serializer to Include User Data
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Force username to be optional (overriding simplejwt's default required=True)
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['email'] = serializers.EmailField(required=True)
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        return token

    def validate(self, attrs):
        # Allow login with email
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError({"detail": "No account found with this email."})
        
        data = super().validate(attrs)
        # Add extra responses here
        data['user'] = UserSerializer(self.user).data
        data['message'] = "Welcome back!"
        data['success'] = True
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] 

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Account created successfully.",
                "success": True,
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        # JWT is stateless, so 'logout' is mostly client-side discarding token.
        return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='profile/update', permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully.",
                "success": True,
                "user": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='all-users')
    def all_users(self, request):
        users = User.objects.all()
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class BlogViewSet(viewsets.ModelViewSet):
    queryset = Blog.objects.all().order_by('-created_at')
    serializer_class = BlogSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({
            "success": True,
            "message": "Blog created successfully",
            "blog": serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle 'action' param for publish/unpublish from togglePublishUnpublish
        # The frontend sends { action: "true"/"false" }
        action_param = request.data.get('action')
        if action_param:
            is_published = action_param == "true"
            # Update the serializer data if necessary, or just save the object
            # Since we are just toggling one field not in serializer normally expected this way? 
            # Actually simplest is to modify data before serialization or handle manually.
            # Let's map it to isPublished field expected by serializer if possible, 
            # OR just update the instance directly since it's a specific logic.
            # Given MERN often sends ad-hoc JSON.
            request.data['isPublished'] = is_published # Map to serializer source or field
            # But request.data might be immutable (QueryDict) if multipart? 
            # If JSON, it's mutable. If multipart, we need to be careful.
            # Safe way:
            if isinstance(request.data, dict):
                 request.data['isPublished'] = is_published
            
            # Update published_at if publishing
            if is_published and not instance.is_published:
                from django.utils import timezone
                instance.published_at = timezone.now()
                instance.save() # Save the timestamp change
            elif not is_published:
                instance.published_at = None
                instance.save()
            
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response({
            "success": True,
            "message": "Blog updated successfully",
            "blog": serializer.data
        })


    @action(detail=False, methods=['get'], url_path='get-published-blogs')
    def get_published_blogs(self, request):
        blogs = Blog.objects.filter(is_published=True).order_by('-created_at')
        serializer = self.get_serializer(blogs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='get-own-blogs', permission_classes=[permissions.IsAuthenticated])
    def get_own_blogs(self, request):
        blogs = Blog.objects.filter(author=request.user).order_by('-created_at')
        serializer = self.get_serializer(blogs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'], url_path='delete', permission_classes=[permissions.IsAuthenticated])
    def delete_blog(self, request, pk=None):
        blog = self.get_object()
        if request.user.role != 'ADMIN' and blog.author != request.user:
             return Response({"message": "You are not authorized to delete this blog"}, status=status.HTTP_403_FORBIDDEN)
        blog.delete()
        return Response({"message": "Blog deleted successfully", "success": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put', 'get'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        blog = self.get_object()
        user = request.user
        if user in blog.likes.all():
            blog.likes.remove(user)
            return Response({"message": "Unliked", "success": True}, status=status.HTTP_200_OK)
        else:
            blog.likes.add(user)
            return Response({"message": "Liked", "success": True}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my-blogs/likes', permission_classes=[permissions.IsAuthenticated])
    def my_blogs_likes(self, request):
        if not request.user.is_authenticated:
             return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        # Total likes on my blogs
        total_likes = 0
        my_blogs = Blog.objects.filter(author=request.user)
        for blog in my_blogs:
            total_likes += blog.likes.count()
        return Response({
            "success": True,
            "totalLikes": total_likes
        })

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all().order_by('-created_at')
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='get_post_comments')
    def get_post_comments(self, request, blog_id=None):
        if not blog_id:
            return Response({"message": "Blog ID required"}, status=status.HTTP_400_BAD_REQUEST)
        comments = Comment.objects.filter(post_id=blog_id).order_by('-created_at')
        serializer = self.get_serializer(comments, many=True)
        return Response({
            "success": True,
            "comments": serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my-blogs/comments', permission_classes=[permissions.IsAuthenticated])
    def my_blogs_comments(self, request):
        if not request.user.is_authenticated:
            return Response({"message": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        # Comments on my blogs
        if request.user.role == 'ADMIN':
            comments = Comment.objects.all().order_by('-created_at')
        else:
            comments = Comment.objects.filter(post__author=request.user).order_by('-created_at')
        serializer = self.get_serializer(comments, many=True)
        return Response({
            "success": True,
            "totalComments": comments.count(),
            "comments": serializer.data
        })
    
    @action(detail=True, methods=['delete'], url_path='delete', permission_classes=[permissions.IsAuthenticated])
    def delete_comment(self, request, pk=None):
        comment = self.get_object()
        # Allow author of comment OR author of post to delete?
        # Usually standard is comment author.
        if request.user.role != 'ADMIN' and comment.user != request.user and comment.post.author != request.user:
            return Response({"message": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        comment.delete()
        return Response({"success": True, "message": "Comment deleted"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['put', 'get'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        comment = self.get_object()
        user = request.user
        if user in comment.likes.all():
            comment.likes.remove(user)
            message = "Unliked"
        else:
            comment.likes.add(user)
            message = "Liked"
        
        serializer = self.get_serializer(comment)
        return Response({
            "message": message, 
            "success": True, 
            "updatedComment": serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        parent_comment = self.get_object()
        
        # Prepare data
        data = request.data.copy()
        data['post'] = parent_comment.post.id
        data['parent_comment'] = parent_comment.id
        
        serializer = self.get_serializer(data=data)
        serialized_reply = None
        if serializer.is_valid():
             serializer.save(user=request.user, post=parent_comment.post, parent_comment=parent_comment)
             serialized_reply = serializer.data
        else:
             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True, 
            "message": "Reply added", 
            "reply": serialized_reply
        }, status=status.HTTP_201_CREATED)

    def create_post_comment(self, request, blog_id=None):
        # Ensure user is authenticated
        if not request.user.is_authenticated:
            return Response({"message": "Please login to comment", "success": False}, status=status.HTTP_401_UNAUTHORIZED)

        # Ensure blog exists
        try:
            blog = Blog.objects.get(pk=blog_id)
        except Blog.DoesNotExist:
             return Response({"message": "Blog not found", "success": False}, status=status.HTTP_404_NOT_FOUND)
        
        # Prepare data
        data = request.data.copy()
        data['post'] = blog.id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({
                "success": True,
                "message": "Comment Added",
                "comment": serializer.data
            }, status=status.HTTP_201_CREATED)
        else:
            print(serializer.errors) # Debugging
            return Response({"message": "Invalid data", "errors": serializer.errors, "success": False}, status=status.HTTP_400_BAD_REQUEST)
