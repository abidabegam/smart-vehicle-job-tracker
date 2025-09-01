from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from jobs.views import JobApplicationViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.http import JsonResponse

router = DefaultRouter()
router.register("jobs", JobApplicationViewSet, basename="jobs")

def home(_request):
    return JsonResponse({
        "service": "Smart Vehicle Job Tracker API",
        "status": "ok",
        "endpoints": {
            "token": "/api/token/",
            "refresh": "/api/token/refresh/",
            "jobs": "/api/jobs/"
        }
    })

urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]
