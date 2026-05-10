from django.contrib import admin

from core.models import (
    BaseProfile,
    CompanyCreditWallet,
    CompanyPost,
    CompanyProfile,
    CompanySubscription,
    CompanySubscriptionPlan,
    CreditTransaction,
    PostPaymentTransaction,
    RefreshToken,
    StudentProfile,
)

admin.site.register(BaseProfile)
admin.site.register(StudentProfile)
admin.site.register(CompanyProfile)
admin.site.register(CompanyPost)
admin.site.register(RefreshToken)
admin.site.register(CompanySubscriptionPlan)
admin.site.register(CompanySubscription)
admin.site.register(CompanyCreditWallet)
admin.site.register(CreditTransaction)
admin.site.register(PostPaymentTransaction)

# Register your models here.
