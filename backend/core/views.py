from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Application, Bookmark, Company, CustomUser, TrainingPost
from .serializers import (
    ApplicationSerializer,
    BookmarkSerializer,
    CompanySerializer,
    SignupSerializer,
    TrainingPostDetailSerializer,
    TrainingPostSerializer,
    UserSerializer,
)


class IsCompanyUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.Roles.COMPANY)


class IsStudentUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == CustomUser.Roles.STUDENT)


class CompanyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["industry", "is_verified"]
    search_fields = ["name", "about_summary", "market_contribution", "headquarters"]
    ordering_fields = ["trust_score", "founded_date", "created_at", "name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        min_trust = self.request.query_params.get("min_trust")
        max_trust = self.request.query_params.get("max_trust")
        founded_year = self.request.query_params.get("founded_year")

        if min_trust is not None:
            queryset = queryset.filter(trust_score__gte=min_trust)
        if max_trust is not None:
            queryset = queryset.filter(trust_score__lte=max_trust)
        if founded_year is not None:
            queryset = queryset.filter(founded_date__year=founded_year)

        return queryset


class SignupView(generics.CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class TrainingPostViewSet(viewsets.ModelViewSet):
    queryset = TrainingPost.objects.select_related("company").all()
    serializer_class = TrainingPostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["company__industry", "company__is_verified", "category", "level"]
    search_fields = ["title", "description", "company__name"]
    ordering_fields = ["created_at", "company__trust_score", "price"]

    def get_queryset(self):
        queryset = super().get_queryset()
        min_trust = self.request.query_params.get("min_trust")
        posted_after = self.request.query_params.get("posted_after")
        if min_trust is not None:
            queryset = queryset.filter(company__trust_score__gte=min_trust)
        if posted_after:
            queryset = queryset.filter(created_at__date__gte=posted_after)
        return queryset

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy", "company_dashboard", "candidates"]:
            return [permissions.IsAuthenticated(), IsCompanyUser()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TrainingPostDetailSerializer
        return TrainingPostSerializer

    def perform_create(self, serializer):
        company = getattr(self.request.user, "company_profile", None)
        if company is None:
            raise PermissionDenied("Company profile required.")
        serializer.save(company=company)

    @action(detail=False, methods=["get"], url_path="company-dashboard")
    def company_dashboard(self, request):
        company = getattr(request.user, "company_profile", None)
        if company is None:
            raise PermissionDenied("Company profile required.")
        posts = self.get_queryset().filter(company=company)
        return Response(self.get_serializer(posts, many=True).data)

    @action(detail=True, methods=["get"], url_path="candidates")
    def candidates(self, request, pk=None):
        post = self.get_object()
        if post.company.user_id != request.user.id:
            raise PermissionDenied("Not your post.")
        applications = Application.objects.filter(post=post).select_related("student")
        return Response(ApplicationSerializer(applications, many=True).data)


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.select_related("post", "student").all()
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["status"]

    def get_permissions(self):
        if self.action in ["create", "my_courses"]:
            return [permissions.IsAuthenticated(), IsStudentUser()]
        if self.action in ["update_status", "list_company"]:
            return [permissions.IsAuthenticated(), IsCompanyUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == CustomUser.Roles.STUDENT:
            return queryset.filter(student=user)
        if user.role == CustomUser.Roles.COMPANY:
            return queryset.filter(post__company__user=user)
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=False, methods=["get"], url_path="my-courses")
    def my_courses(self, request):
        applications = self.get_queryset().filter(student=request.user)
        return Response(self.get_serializer(applications, many=True).data)

    @action(detail=False, methods=["get"], url_path="company-candidates")
    def list_company(self, request):
        applications = self.get_queryset().filter(post__company__user=request.user)
        return Response(self.get_serializer(applications, many=True).data)

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        application = self.get_object()
        if application.post.company.user_id != request.user.id:
            raise PermissionDenied("You can only manage candidates for your own posts.")
        new_status = request.data.get("status")
        valid_status = {choice[0] for choice in Application.Status.choices}
        if new_status not in valid_status:
            return Response({"detail": "Invalid status."}, status=400)
        application.status = new_status
        application.save()
        return Response(self.get_serializer(application).data)


class BookmarkViewSet(viewsets.ModelViewSet):
    queryset = Bookmark.objects.select_related("post", "student").all()
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated, IsStudentUser]

    def get_queryset(self):
        return super().get_queryset().filter(student=self.request.user)

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)
