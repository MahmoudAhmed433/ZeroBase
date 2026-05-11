from rest_framework import serializers

from .models import Application, Bookmark, Company, CompanyReview, CustomUser, TrainingPost


class CompanySerializer(serializers.ModelSerializer):
    average_rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ("id", "username", "email", "role", "full_name", "bio")


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    company = CompanySerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ("username", "email", "password", "role", "full_name", "bio", "company")

    def validate(self, attrs):
        role = attrs.get("role")
        company_data = attrs.get("company")
        username = attrs.get("username")
        email = attrs.get("email")

        if username and CustomUser.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({"username": "This username is already in use."})
        if email and CustomUser.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})

        if role == CustomUser.Roles.COMPANY and not company_data:
            raise serializers.ValidationError("Company trust data is required for company signup.")
        return attrs

    def create(self, validated_data):
        company_data = validated_data.pop("company", None)
        password = validated_data.pop("password")
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == CustomUser.Roles.COMPANY and company_data:
            Company.objects.create(user=user, **company_data)
        return user


class TrainingPostSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_location = serializers.CharField(source="company.headquarters", read_only=True)
    company_logo = serializers.CharField(source="company.logo", read_only=True)
    trust_score = serializers.IntegerField(source="company.trust_score", read_only=True)
    is_verified = serializers.BooleanField(source="company.is_verified", read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = TrainingPost
        fields = (
            "id",
            "company",
            "company_name",
            "company_location",
            "company_logo",
            "title",
            "description",
            "duration",
            "category",
            "level",
            "price",
            "prerequisites",
            "instructor_info",
            "trust_score",
            "is_verified",
            "is_bookmarked",
            "created_at",
        )
        read_only_fields = ("company",)

    def get_is_bookmarked(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return Bookmark.objects.filter(post=obj, student=request.user).exists()


class CompanyReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = CompanyReview
        fields = ("id", "student_name", "rating", "comment", "created_at")


class TrainingPostDetailSerializer(TrainingPostSerializer):
    company_details = CompanySerializer(source="company", read_only=True)
    testimonials = CompanyReviewSerializer(source="company.reviews", many=True, read_only=True)

    class Meta(TrainingPostSerializer.Meta):
        fields = TrainingPostSerializer.Meta.fields + ("company_details", "testimonials")


class ApplicationSerializer(serializers.ModelSerializer):
    student_profile = UserSerializer(source="student", read_only=True)
    post_title = serializers.CharField(source="post.title", read_only=True)

    class Meta:
        model = Application
        fields = ("id", "post", "post_title", "student", "student_profile", "status", "created_at")
        read_only_fields = ("student",)


class BookmarkSerializer(serializers.ModelSerializer):
    post_title = serializers.CharField(source="post.title", read_only=True)

    class Meta:
        model = Bookmark
        fields = ("id", "post", "post_title", "student", "created_at")
        read_only_fields = ("student",)
