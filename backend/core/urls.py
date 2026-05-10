from django.urls import path

from core import views

urlpatterns = [
    path("auth/csrf/", views.csrf_token, name="csrf-token"),
    path("auth/register/student/", views.register_student_view, name="register-student"),
    path("auth/register/company/", views.register_company_view, name="register-company"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/refresh/", views.refresh_view, name="refresh-token"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/change-password/", views.change_password_view, name="change-password"),
    path("account/", views.delete_account_view, name="delete-account"),
    path("profile/", views.profile_view, name="profile"),
    path("create-post/", views.create_post_view, name="create-post"),
    path("company/posts/", views.company_posts_view, name="company-posts"),
    path("company/posts/<int:post_id>/payment/confirm/", views.confirm_post_payment_view, name="confirm-post-payment"),
    path("home/", views.feed_view, name="home-feed"),
]
