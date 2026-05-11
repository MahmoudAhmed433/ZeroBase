from django.core.management.base import BaseCommand

from core.models import Application, Company, CompanyReview, CustomUser, TrainingPost


class Command(BaseCommand):
    help = "Seed demo users, companies, posts, and applications."

    def handle(self, *args, **options):
        student_user, _ = CustomUser.objects.get_or_create(
            username="student_demo",
            defaults={
                "email": "student@zerobase.local",
                "role": CustomUser.Roles.STUDENT,
                "full_name": "ZeroBase Student Account",
            },
        )
        student_user.set_password("DemoPass123!")
        student_user.save()

        companies_data = [
            {
                "username": "company_demo",
                "email": "company@zerobase.local",
                "full_name": "ZeroBase Company Account",
                "profile": {
                    "name": "NileTech Labs",
                    "about_summary": "Industry-focused training programs delivered by working engineers.",
                    "industry": "Software & AI",
                    "official_website": "https://niletech.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/niletech",
                    "crunchbase_url": "https://www.crunchbase.com/organization/niletech",
                    "headquarters": "Cairo, Egypt",
                    "market_contribution": "Delivered practical industry mentorship for graduates.",
                    "achievements": ["Regional innovation award", "Top graduate outcomes partner"],
                    "sources": ["https://niletech.example.com/about", "https://www.linkedin.com/company/niletech"],
                    "milestones": [{"year": "2018", "event": "Internship studio launched"}],
                    "is_verified": True,
                },
                "posts": [
                    ("Frontend Practical Training Program", "Build production-ready UI modules with mentor reviews.", "8 weeks", "Web Development", "Intermediate", 0, "HTML, CSS, JavaScript basics", "Senior Frontend Engineer"),
                    ("Backend API Engineering Program", "Implement real REST APIs and auth workflows.", "10 weeks", "Backend", "Intermediate", 0, "Python fundamentals", "Lead Backend Engineer"),
                    ("AI Product Implementation Track", "Ship LLM-backed internal assistant features for operations.", "12 weeks", "AI", "Advanced", 1500, "Python + problem solving", "AI Product Lead"),
                ],
            },
            {
                "username": "company_cyber",
                "email": "cyber@zerobase.local",
                "full_name": "Delta Secure Team",
                "profile": {
                    "name": "Delta Secure Systems",
                    "about_summary": "Hands-on cybersecurity programs with SOC and red-team professionals.",
                    "industry": "Cybersecurity",
                    "official_website": "https://deltasecure.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/deltasecure",
                    "crunchbase_url": "",
                    "headquarters": "Alexandria, Egypt",
                    "market_contribution": "Reduced incident response time for enterprise clients.",
                    "achievements": ["SOC modernization partner", "Threat intelligence excellence award"],
                    "sources": ["https://deltasecure.example.com"],
                    "milestones": [{"year": "2016", "event": "SOC program launched"}],
                    "is_verified": True,
                },
                "posts": [
                    ("SOC Analyst Internship", "Monitor SIEM alerts and escalate incidents in rotation.", "9 weeks", "Cybersecurity", "Beginner", 0, "Networking basics", "SOC Manager"),
                    ("Offensive Security Boot Track", "Run penetration testing workflow under expert supervision.", "8 weeks", "Cybersecurity", "Advanced", 1200, "Linux basics", "Red Team Lead"),
                ],
            },
            {
                "username": "company_data",
                "email": "data@zerobase.local",
                "full_name": "Orbit Data Works",
                "profile": {
                    "name": "Orbit Data Works",
                    "about_summary": "Data and analytics programs for real product metrics and dashboards.",
                    "industry": "Data Analytics",
                    "official_website": "https://orbitdata.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/orbitdata",
                    "crunchbase_url": "",
                    "headquarters": "Giza, Egypt",
                    "market_contribution": "Built KPI systems across fintech and retail.",
                    "achievements": ["Top analytics consultancy 2025"],
                    "sources": ["https://orbitdata.example.com/about"],
                    "milestones": [{"year": "2020", "event": "Data academy started"}],
                    "is_verified": False,
                },
                "posts": [
                    ("Business Data Analyst Program", "Analyze real growth funnels and build executive reports.", "7 weeks", "Data Analytics", "Beginner", 500, "Excel + SQL basics", "Head of Analytics"),
                    ("BI Dashboard Engineering", "Create dashboards with clean semantic models.", "6 weeks", "Data Analytics", "Intermediate", 700, "Data basics", "BI Team Lead"),
                ],
            },
            {
                "username": "company_cloud",
                "email": "cloud@zerobase.local",
                "full_name": "CloudGate Ops",
                "profile": {
                    "name": "CloudGate Ops",
                    "about_summary": "Cloud operations and DevOps acceleration tracks.",
                    "industry": "Cloud & DevOps",
                    "official_website": "https://cloudgate.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/cloudgate",
                    "crunchbase_url": "",
                    "headquarters": "Cairo, Egypt",
                    "market_contribution": "Enabled stable cloud migrations for SME sector.",
                    "achievements": ["Cloud reliability award"],
                    "sources": ["https://cloudgate.example.com"],
                    "milestones": [{"year": "2019", "event": "DevOps lab established"}],
                    "is_verified": True,
                },
                "posts": [
                    ("DevOps Engineer Residency", "Work on CI/CD pipelines and observability.", "10 weeks", "Cloud & DevOps", "Intermediate", 1000, "Git + Linux basics", "Principal DevOps Engineer"),
                    ("Cloud Infrastructure Internship", "Deploy production-grade cloud environments.", "8 weeks", "Cloud & DevOps", "Beginner", 0, "Networking fundamentals", "Cloud Architect"),
                ],
            },
            {
                "username": "company_mobile",
                "email": "mobile@zerobase.local",
                "full_name": "Pixel Mobile Studio",
                "profile": {
                    "name": "Pixel Mobile Studio",
                    "about_summary": "Mobile engineering tracks with iOS/Android teams.",
                    "industry": "Mobile Development",
                    "official_website": "https://pixelmobile.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/pixelmobile",
                    "crunchbase_url": "",
                    "headquarters": "Mansoura, Egypt",
                    "market_contribution": "Built mobile products for edtech and logistics.",
                    "achievements": ["Best UX mobile team 2024"],
                    "sources": ["https://pixelmobile.example.com/showcase"],
                    "milestones": [{"year": "2017", "event": "Company founded"}],
                    "is_verified": False,
                },
                "posts": [
                    ("Android Engineering Program", "Ship Android features and test automation suites.", "9 weeks", "Mobile Development", "Intermediate", 900, "Kotlin basics", "Senior Android Engineer"),
                    ("iOS Product Internship", "Implement Swift-based modules in a real app release cycle.", "9 weeks", "Mobile Development", "Intermediate", 900, "Swift fundamentals", "iOS Team Lead"),
                ],
            },
            {
                "username": "company_web",
                "email": "web@zerobase.local",
                "full_name": "WebCore Dynamics",
                "profile": {
                    "name": "WebCore Dynamics",
                    "about_summary": "Modern web development and product engineering practices.",
                    "industry": "Web Development",
                    "official_website": "https://webcore.example.com",
                    "linkedin_url": "https://www.linkedin.com/company/webcore",
                    "crunchbase_url": "",
                    "headquarters": "Tanta, Egypt",
                    "market_contribution": "Helped startups launch scalable web platforms.",
                    "achievements": ["Fastest product launch partner"],
                    "sources": ["https://webcore.example.com"],
                    "milestones": [{"year": "2021", "event": "Mentorship unit created"}],
                    "is_verified": True,
                },
                "posts": [
                    ("Full-Stack Web Program", "Contribute to real feature tickets across frontend and backend.", "11 weeks", "Web Development", "Intermediate", 650, "JavaScript basics", "Engineering Manager"),
                    ("React Product Internship", "Build reusable components and optimize UX performance.", "8 weeks", "Web Development", "Beginner", 0, "React basics", "Senior React Engineer"),
                ],
            },
        ]

        created_posts = []
        for item in companies_data:
            company_user, _ = CustomUser.objects.get_or_create(
                username=item["username"],
                defaults={
                    "email": item["email"],
                    "role": CustomUser.Roles.COMPANY,
                    "full_name": item["full_name"],
                },
            )
            company_user.set_password("DemoPass123!")
            company_user.save()

            company, _ = Company.objects.get_or_create(user=company_user, defaults=item["profile"])
            for title, description, duration, category, level, price, prerequisites, instructor in item["posts"]:
                post, _ = TrainingPost.objects.get_or_create(
                    company=company,
                    title=title,
                    defaults={
                        "description": description,
                        "duration": duration,
                        "category": category,
                        "level": level,
                        "price": price,
                        "prerequisites": prerequisites,
                        "instructor_info": instructor,
                    },
                )
                created_posts.append(post)

        # Create sample student applications for first few opportunities.
        for index, post in enumerate(created_posts[:6]):
            status = [Application.Status.PENDING, Application.Status.CONTACTED, Application.Status.ACCEPTED][index % 3]
            Application.objects.get_or_create(
                post=post,
                student=student_user,
                defaults={"status": status},
            )

        for company in Company.objects.all():
            CompanyReview.objects.get_or_create(
                company=company,
                student=student_user,
                rating=4,
                defaults={"comment": f"Great practical learning experience with {company.name}."},
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))
