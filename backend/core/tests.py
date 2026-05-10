import json

from django.test import Client, TestCase

from core.models import CompanyPost


class AuthAndPostFlowTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_student_and_company_registration(self):
        student_payload = {
            "username": "teststudent",
            "email": "student@example.com",
            "password": "StrongPass!2",
        }
        response = self.client.post(
            "/api/auth/register/student/",
            data=json.dumps(student_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)

        company_payload = {
            "company_name": "Zero Corp",
            "email": "company@example.com",
            "password": "Company!123",
            "industry": "Software",
            "size": "50-100",
            "description": "A test company",
        }
        response = self.client.post(
            "/api/auth/register/company/",
            data=json.dumps(company_payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)

    def test_only_company_can_create_post(self):
        student = self.client.post(
            "/api/auth/register/student/",
            data=json.dumps(
                {
                    "username": "teststudent2",
                    "email": "student2@example.com",
                    "password": "StrongPass!2",
                }
            ),
            content_type="application/json",
        ).json()["data"]["access_token"]

        response = self.client.post(
            "/api/create-post/",
            data=json.dumps(
                {
                    "title": "Role",
                    "description": "Desc",
                    "type": "job",
                    "location": "Remote",
                    "requirements": "Req",
                    "tags": ["python"],
                }
            ),
            content_type="application/json",
            headers={"Authorization": f"Bearer {student}"},
        )
        self.assertEqual(response.status_code, 403)

        company = self.client.post(
            "/api/auth/register/company/",
            data=json.dumps(
                {
                    "company_name": "Test Co",
                    "email": "co2@example.com",
                    "password": "StrongPass!2",
                    "industry": "Tech",
                    "size": "10-50",
                    "description": "Testing",
                }
            ),
            content_type="application/json",
        ).json()["data"]["access_token"]

        response = self.client.post(
            "/api/create-post/",
            data=json.dumps(
                {
                    "title": "Backend Engineer",
                    "description": "Desc",
                    "type": "job",
                    "location": "Remote",
                    "requirements": "Req",
                    "tags": ["python"],
                }
            ),
            content_type="application/json",
            headers={"Authorization": f"Bearer {company}"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(CompanyPost.objects.count(), 1)
        post = CompanyPost.objects.first()
        self.assertFalse(post.is_published)
        self.assertEqual(post.payment_status, "pending")

    def test_post_requires_payment_before_feed_visibility(self):
        company_token = self.client.post(
            "/api/auth/register/company/",
            data=json.dumps(
                {
                    "company_name": "Paid Co",
                    "email": "paid@example.com",
                    "password": "StrongPass!2",
                    "industry": "Tech",
                    "size": "10-50",
                    "description": "Testing",
                }
            ),
            content_type="application/json",
        ).json()["data"]["access_token"]

        student_token = self.client.post(
            "/api/auth/register/student/",
            data=json.dumps(
                {
                    "username": "std3",
                    "email": "student3@example.com",
                    "password": "StrongPass!2",
                }
            ),
            content_type="application/json",
        ).json()["data"]["access_token"]

        created = self.client.post(
            "/api/create-post/",
            data=json.dumps(
                {
                    "title": "Intern Role",
                    "description": "Desc",
                    "type": "internship",
                    "location": "Remote",
                    "requirements": "Req",
                    "tags": ["intern"],
                }
            ),
            content_type="application/json",
            headers={"Authorization": f"Bearer {company_token}"},
        ).json()["data"]

        feed_before = self.client.get("/api/home/", headers={"Authorization": f"Bearer {student_token}"}).json()["data"]["items"]
        self.assertEqual(len(feed_before), 0)

        self.client.post(
            f"/api/company/posts/{created['id']}/payment/confirm/",
            data=json.dumps({"payment_status": "paid", "transaction_ref": "mock_tx_1"}),
            content_type="application/json",
            headers={"Authorization": f"Bearer {company_token}"},
        )

        feed_after = self.client.get("/api/home/", headers={"Authorization": f"Bearer {student_token}"}).json()["data"]["items"]
        self.assertEqual(len(feed_after), 1)

# Create your tests here.
