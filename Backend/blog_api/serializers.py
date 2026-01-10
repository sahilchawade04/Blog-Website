from rest_framework import serializers
from .models import User, Blog, Comment

class UserSerializer(serializers.ModelSerializer):
    # Map Django fields to MERN frontend expected fields
    _id = serializers.IntegerField(source='id', read_only=True)
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    photoUrl = serializers.ImageField(source='photo_url', required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['_id', 'username', 'email', 'firstName', 'lastName', 'bio', 'occupation', 'photoUrl', 'role', 'instagram', 'linkedin', 'github', 'facebook', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': False}
        }

    def validate(self, attrs):
        # Prevent assigning ADMIN role publicly
        if 'role' in attrs and attrs['role'] == 'ADMIN':
             raise serializers.ValidationError({"role": "Admin role cannot be assigned via public registration."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        # Auto-generate username from email if not provided
        if 'username' not in validated_data:
            validated_data['username'] = validated_data.get('email')
            
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class CommentSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source='id', read_only=True)
    userId = serializers.ReadOnlyField(source='user.id')
    user = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    numberOfLikes = serializers.SerializerMethodField()
    
    postId = serializers.SerializerMethodField()
    
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Comment
        fields = ['_id', 'content', 'post', 'postId', 'userId', 'user', 'likes', 'numberOfLikes', 'replies', 'createdAt']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

    def get_numberOfLikes(self, obj):
        return obj.likes.count()

    def get_postId(self, obj):
        return {
            "_id": obj.post.id,
            "title": obj.post.title
        }

class BlogSerializer(serializers.ModelSerializer):
    _id = serializers.IntegerField(source='id', read_only=True)
    author = UserSerializer(read_only=True)
    # We might need author_id for writing
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='author', write_only=True, required=False
    )
    likes_count = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    # Mapping isPublished -> is_published
    isPublished = serializers.BooleanField(source='is_published', required=False)
    publishedAt = serializers.DateTimeField(source='published_at', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    
    class Meta:
        model = Blog
        fields = ['_id', 'title', 'subtitle', 'description', 'thumbnail', 'category', 'author', 'author_id', 'likes', 'likes_count', 'comments', 'isPublished', 'publishedAt', 'views', 'createdAt', 'updatedAt']

    def get_likes_count(self, obj):
        return obj.likes.count()
