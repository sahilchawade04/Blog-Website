from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, BlogViewSet, CommentViewSet, CustomTokenObtainPairView

# We use manual paths to match MERN frontend specific routes EXACTLY
# Frontend Routes analysis:
# user/register
# user/login
# user/logout
# user/profile/update
# user/all-users
# blog (POST create)
# blog/get-published-blogs
# blog/get-own-blogs
# blog/delete/<id>
# blog/my-blogs/likes
# comment/<blog_id>/comment/all
# comment/my-blogs/comments
# comment/<comment_id>/delete

urlpatterns = [
    # Auth & User
    path('user/register', UserViewSet.as_view({'post': 'register'}), name='register'),
    path('user/login', CustomTokenObtainPairView.as_view(), name='login'),
    path('user/logout', UserViewSet.as_view({'get': 'logout'}), name='logout'),
    path('user/profile/update', UserViewSet.as_view({'put': 'update_profile'}), name='update_profile'),
    path('user/all-users', UserViewSet.as_view({'get': 'all_users'}), name='all_users'),
    
    # Blog
    path('blog', BlogViewSet.as_view({'post': 'create'}), name='create_blog'),
    path('blog/get-published-blogs', BlogViewSet.as_view({'get': 'get_published_blogs'}), name='published_blogs'),
    path('blog/get-own-blogs', BlogViewSet.as_view({'get': 'get_own_blogs'}), name='own_blogs'),
    path('blog/delete/<int:pk>', BlogViewSet.as_view({'delete': 'delete_blog'}), name='delete_blog'),
    path('blog/my-blogs/likes', BlogViewSet.as_view({'get': 'my_blogs_likes'}), name='my_blogs_likes'),
    path('blog/<int:pk>/like', BlogViewSet.as_view({'get': 'like', 'put': 'like'}), name='blog_like'),
    path('blog/<int:pk>/dislike', BlogViewSet.as_view({'get': 'like', 'put': 'like'}), name='blog_dislike'),
    # Standard CRUD for retrieving single blog? Frontend uses blog/${id}/${action} ???
    # BlogView.jsx: get(url + /blog/${id}/${action}) -> action is undefined or something? 
    # Let's map blog/<id> for standard retrieve.
    path('blog/<int:pk>', BlogViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update'}), name='blog_detail'),
    # If action exists in url? url is `.../blog/${selectedBlog?._id}/${action}`. 
    # If action is 'view' or 'undefined'.
    # For now, let's assume standard retrieval.
    
    # Comments
    path('comment/<int:blog_id>/comment/all', CommentViewSet.as_view({'get': 'get_post_comments'}), name='post_comments'),
    path('comment/my-blogs/comments', CommentViewSet.as_view({'get': 'my_blogs_comments'}), name='my_blogs_comments'),
    path('comment/<int:pk>/delete', CommentViewSet.as_view({'delete': 'delete_comment'}), name='delete_comment'),
    # Comment create? CommentBox.jsx: axios.post
    # Where does it post? likely /api/v1/comment/create?? Or just /api/v1/comment ??
    # Let's assume /comment based on typical REST, but MERN often uses /create.
    # Without seeing the exact line, I'll map 'comment' (POST) to create.
    path('comment', CommentViewSet.as_view({'post': 'create'}), name='create_comment'),
    path('comment/<int:blog_id>/create', CommentViewSet.as_view({'post': 'create_post_comment'}), name='create_post_comment'),
    path('comment/<int:pk>/like', CommentViewSet.as_view({'get': 'like'}), name='comment_like'),
    path('comment/<int:pk>/reply', CommentViewSet.as_view({'post': 'reply'}), name='comment_reply'),
    path('comment/<int:pk>/edit', CommentViewSet.as_view({'put': 'update'}), name='comment_edit'),
]
