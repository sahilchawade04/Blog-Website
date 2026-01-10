import os
import sys
import django

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_django.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from blog_api.serializers import UserSerializer

def test_registration_validation():
    factory = APIRequestFactory()
    
    # Test 1: Valid Reader Registration
    reader_data = {
        'firstName': 'Test',
        'lastName': 'Reader',
        'email': 'reader@test.com',
        'password': 'password123',
        'role': 'READER'
    }
    serializer = UserSerializer(data=reader_data)
    if serializer.is_valid():
        print("PASS: Reader registration valid")
    else:
        print(f"FAIL: Reader registration failed: {serializer.errors}")

    # Test 2: Valid Author Registration
    author_data = {
        'firstName': 'Test',
        'lastName': 'Author',
        'email': 'author@test.com',
        'password': 'password123',
        'role': 'AUTHOR'
    }
    serializer = UserSerializer(data=author_data)
    if serializer.is_valid():
        print("PASS: Author registration valid")
    else:
        print(f"FAIL: Author registration failed: {serializer.errors}")

    # Test 3: Invalid Admin Registration
    admin_data = {
        'firstName': 'Test',
        'lastName': 'Admin',
        'email': 'admin@test.com',
        'password': 'password123',
        'role': 'ADMIN'
    }
    serializer = UserSerializer(data=admin_data)
    if not serializer.is_valid():
        if 'role' in serializer.errors:
            print("PASS: Admin registration correctly blocked")
        else:
            print(f"FAIL: Admin registration failed but not for role: {serializer.errors}")
    else:
        print("FAIL: Admin registration Should have failed but passed")

if __name__ == "__main__":
    test_registration_validation()
