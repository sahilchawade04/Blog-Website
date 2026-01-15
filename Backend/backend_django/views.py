from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "message": "Welcome to the Blog API",
        "status": "running",
        "endpoints": {
            "admin": "/admin/",
            "api": "/api/v1/"
        }
    })
