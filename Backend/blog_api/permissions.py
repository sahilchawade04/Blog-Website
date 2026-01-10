from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')

class IsAuthor(permissions.BasePermission):
    """
    Custom permission to allow authors to create/edit their own content.
    """
    def has_permission(self, request, view):
        # Allow if authenticated and is AUTHOR or ADMIN
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'AUTHOR' or request.user.role == 'ADMIN'))
    
    def has_object_permission(self, request, view, obj):
        # Allow admins to do anything
        if request.user.role == 'ADMIN':
            return True
        # Authors can only modify their own objects
        return obj.author == request.user

class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Authors can write, others can read.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to Authors and Admins
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'AUTHOR' or request.user.role == 'ADMIN'))

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if request.user.role == 'ADMIN':
            return True
            
        return obj.author == request.user

class IsReader(permissions.BasePermission):
    """
    Readers can only read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Readers cannot modify
        return False
