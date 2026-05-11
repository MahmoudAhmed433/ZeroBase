from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import ApplicationViewSet, BookmarkViewSet, CompanyViewSet, MeView, SignupView, TrainingPostViewSet

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")
router.register("posts", TrainingPostViewSet, basename="post")
router.register("applications", ApplicationViewSet, basename="application")
router.register("bookmarks", BookmarkViewSet, basename="bookmark")

urlpatterns = [
    *router.urls,
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
]
