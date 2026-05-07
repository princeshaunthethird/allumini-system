"""
Database seeder — creates demo accounts and sample data on startup.
Safe to run multiple times (checks before inserting).
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Connection, Message, Job, Application,
    Notification, ConnectionStatus, JobType,
    ApplicationStatus, NotificationType
)
from app.utils.auth import hash_password

# ─────────────────────────────────────────────
# Demo Accounts
# ─────────────────────────────────────────────
DEMO_USERS = [
    {
        "name": "Demo Admin",
        "email": "demo@alumni.com",
        "password": "demo1234",
        "graduation_year": 2020,
        "course": "Computer Science",
        "phone": "+91 98765 43210",
        "college": "MIT College of Engineering",
        "skills": "Python, FastAPI, React, PostgreSQL, AWS, Docker",
        "bio": "Full-stack developer and alumni network admin. Passionate about building communities and helping fellow graduates find opportunities.",
        "location": "Pune, Maharashtra",
        "linkedin": "https://linkedin.com/in/demo-admin",
        "github": "https://github.com/demo-admin",
        "experience": "Senior Software Engineer @ TechCorp (2022–Present)\nSoftware Engineer @ StartupXYZ (2020–2022)\nIntern @ Infosys (2019)",
    },
    {
        "name": "Priya Sharma",
        "email": "priya@alumni.com",
        "password": "demo1234",
        "graduation_year": 2021,
        "course": "Data Science",
        "phone": "+91 87654 32109",
        "college": "MIT College of Engineering",
        "skills": "Machine Learning, Python, TensorFlow, SQL, Tableau",
        "bio": "Data Scientist at Google. Love turning raw data into actionable insights. Happy to mentor juniors!",
        "location": "Bangalore, Karnataka",
        "linkedin": "https://linkedin.com/in/priya-sharma",
        "experience": "Data Scientist @ Google (2022–Present)\nML Engineer @ Flipkart (2021–2022)",
    },
    {
        "name": "Rahul Verma",
        "email": "rahul@alumni.com",
        "password": "demo1234",
        "graduation_year": 2019,
        "course": "Electronics Engineering",
        "phone": "+91 76543 21098",
        "college": "MIT College of Engineering",
        "skills": "Embedded Systems, C++, IoT, VLSI, PCB Design",
        "bio": "Hardware engineer working on next-gen IoT devices. Co-founder of a tech startup.",
        "location": "Mumbai, Maharashtra",
        "experience": "Co-Founder @ IoTech (2021–Present)\nHardware Engineer @ Bosch (2019–2021)",
    },
    {
        "name": "Sneha Kulkarni",
        "email": "sneha@alumni.com",
        "password": "demo1234",
        "graduation_year": 2022,
        "course": "Business Administration",
        "phone": "+91 65432 10987",
        "college": "MIT College of Engineering",
        "skills": "Product Management, Agile, JIRA, Market Research, SQL",
        "bio": "Product Manager at a Series B startup. Bridging the gap between tech and business.",
        "location": "Hyderabad, Telangana",
        "experience": "Product Manager @ FinEdge (2022–Present)",
    },
    {
        "name": "Arjun Mehta",
        "email": "arjun@alumni.com",
        "password": "demo1234",
        "graduation_year": 2018,
        "course": "Mechanical Engineering",
        "phone": "+91 54321 09876",
        "college": "MIT College of Engineering",
        "skills": "AutoCAD, SolidWorks, Six Sigma, Project Management",
        "bio": "Senior Mechanical Engineer at Tata Motors. Passionate about sustainable engineering.",
        "location": "Chennai, Tamil Nadu",
        "experience": "Senior Engineer @ Tata Motors (2020–Present)\nEngineer @ L&T (2018–2020)",
    },
]

# ─────────────────────────────────────────────
# Demo Jobs
# ─────────────────────────────────────────────
DEMO_JOBS = [
    {
        "poster_index": 0,  # Demo Admin posts this
        "title": "Senior Full Stack Developer",
        "company": "TechCorp India",
        "location": "Pune / Remote",
        "job_type": JobType.full_time,
        "description": "We are looking for an experienced Full Stack Developer to join our growing team. You will work on exciting products used by millions of users.",
        "requirements": "3+ years React & Node.js\nExperience with PostgreSQL\nStrong CS fundamentals\nGood communication skills",
        "salary_range": "₹15–25 LPA",
        "deadline_days": 30,
    },
    {
        "poster_index": 1,  # Priya posts this
        "title": "Data Science Intern",
        "company": "Google",
        "location": "Bangalore",
        "job_type": JobType.internship,
        "description": "6-month internship on the Google Maps data team. Work on real-world ML problems at scale.",
        "requirements": "Python, Pandas, scikit-learn\nPursuing B.E./M.Tech in CS or related\nStrong math fundamentals",
        "salary_range": "₹80,000/month",
        "deadline_days": 15,
    },
    {
        "poster_index": 2,  # Rahul posts this
        "title": "IoT Hardware Engineer",
        "company": "IoTech Startup",
        "location": "Mumbai",
        "job_type": JobType.full_time,
        "description": "Join our early-stage startup building smart home devices. Equity + salary package.",
        "requirements": "Embedded C/C++\nRaspberry Pi / Arduino experience\nPCB design knowledge preferred",
        "salary_range": "₹8–14 LPA + equity",
        "deadline_days": 20,
    },
    {
        "poster_index": 3,  # Sneha posts this
        "title": "Associate Product Manager",
        "company": "FinEdge",
        "location": "Hyderabad / Remote",
        "job_type": JobType.full_time,
        "description": "Looking for a fresh PM to own the onboarding experience for our fintech app. Great growth opportunity.",
        "requirements": "MBA or Engineering background\nExperience with agile/scrum\nStrong analytical skills",
        "salary_range": "₹10–16 LPA",
        "deadline_days": 25,
    },
    {
        "poster_index": 0,
        "title": "DevOps Engineer (Contract)",
        "company": "TechCorp India",
        "location": "Remote",
        "job_type": JobType.contract,
        "description": "6-month contract to set up CI/CD pipelines and migrate our infrastructure to Kubernetes.",
        "requirements": "Docker, Kubernetes, Jenkins\nAWS or GCP experience\nLinux administration",
        "salary_range": "₹1.2L/month",
        "deadline_days": 10,
    },
]

# ─────────────────────────────────────────────
# Seeder
# ─────────────────────────────────────────────

def seed_database():
    db: Session = SessionLocal()
    try:
        # Skip if already seeded
        if db.query(User).filter(User.email == "demo@alumni.com").first():
            print("✅ Demo data already exists — skipping seed.")
            return

        print("🌱 Seeding demo data...")

        # ── Create users ──────────────────────────────────
        users = []
        for u in DEMO_USERS:
            user = User(
                name=u["name"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                graduation_year=u.get("graduation_year"),
                course=u.get("course"),
                phone=u.get("phone"),
                college=u.get("college"),
                skills=u.get("skills"),
                bio=u.get("bio"),
                location=u.get("location"),
                linkedin=u.get("linkedin"),
                github=u.get("github"),
                experience=u.get("experience"),
                is_active=True,
            )
            db.add(user)
            users.append(user)
        db.commit()
        for u in users:
            db.refresh(u)
        print(f"  ✓ Created {len(users)} demo users")

        # ── Create connections ────────────────────────────
        # Admin is connected to everyone
        connections_data = [
            (0, 1, ConnectionStatus.accepted),
            (0, 2, ConnectionStatus.accepted),
            (0, 3, ConnectionStatus.accepted),
            (0, 4, ConnectionStatus.accepted),
            (1, 2, ConnectionStatus.accepted),
            (1, 3, ConnectionStatus.pending),   # pending request
            (2, 4, ConnectionStatus.accepted),
        ]
        for req_i, rec_i, status in connections_data:
            conn = Connection(
                requester_id=users[req_i].id,
                receiver_id=users[rec_i].id,
                status=status,
            )
            db.add(conn)
        db.commit()
        print(f"  ✓ Created {len(connections_data)} connections")

        # ── Create messages ───────────────────────────────
        messages_data = [
            (1, 0, "Hey! Congrats on the new role at TechCorp! 🎉"),
            (0, 1, "Thanks Priya! How's Google treating you?"),
            (1, 0, "It's amazing here! The ML infra is next level. You should apply for the open role on my team."),
            (0, 1, "Oh interesting, I'll check it out. Also, are you coming to the alumni meet next month?"),
            (1, 0, "Absolutely! It's been too long since we all met. Will Rahul be there?"),
            (0, 1, "I'll ask him. He's been busy with his startup lately."),
            (2, 0, "Bro, check out the job I posted. Looking for someone like you!"),
            (0, 2, "Saw it! Looks exciting. The equity part is interesting 👀"),
            (2, 0, "Yeah man, ground floor opportunity. Think about it!"),
            (3, 0, "Hi! I'm Sneha, just joined the alumni network. Looking forward to connecting!"),
            (0, 3, "Welcome Sneha! Great to have you here. Love the work FinEdge is doing."),
        ]
        for sender_i, receiver_i, content in messages_data:
            msg = Message(
                sender_id=users[sender_i].id,
                receiver_id=users[receiver_i].id,
                content=content,
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=len(messages_data) - messages_data.index((sender_i, receiver_i, content)))
            )
            db.add(msg)
        db.commit()
        print(f"  ✓ Created {len(messages_data)} messages")

        # ── Create jobs ───────────────────────────────────
        jobs = []
        for j in DEMO_JOBS:
            job = Job(
                poster_id=users[j["poster_index"]].id,
                title=j["title"],
                company=j["company"],
                location=j["location"],
                job_type=j["job_type"],
                description=j["description"],
                requirements=j["requirements"],
                salary_range=j["salary_range"],
                deadline=datetime.utcnow() + timedelta(days=j["deadline_days"]),
                is_active=True,
            )
            db.add(job)
            jobs.append(job)
        db.commit()
        for j in jobs:
            db.refresh(j)
        print(f"  ✓ Created {len(jobs)} job postings")

        # ── Create applications ───────────────────────────
        # Priya applies to Admin's job; Rahul & Sneha apply to Data Science intern
        applications_data = [
            (1, 0, "I have 3 years of React experience and have led teams at Google. Excited about this opportunity!"),
            (2, 1, "Strong Python background. Would love to bring my IoT data experience to the Maps team."),
            (3, 0, "Though my background is in PM, I've been learning full-stack dev and would love this challenge."),
            (4, 2, "Mechanical background but strong embedded systems skills. Very interested in IoT!"),
        ]
        for applicant_i, job_i, cover in applications_data:
            app = Application(
                job_id=jobs[job_i].id,
                applicant_id=users[applicant_i].id,
                cover_letter=cover,
                status=ApplicationStatus.applied,
            )
            db.add(app)
        db.commit()
        print(f"  ✓ Created {len(applications_data)} job applications")

        # ── Create notifications ──────────────────────────
        notifs = [
            (0, NotificationType.connection_request, "Sneha Kulkarni wants to connect with you", None),
            (0, NotificationType.new_message, "New message from Rahul Verma", users[2].id),
            (0, NotificationType.job_application, "Priya Sharma applied for Senior Full Stack Developer", jobs[0].id),
            (0, NotificationType.connection_accepted, "Priya Sharma accepted your connection request", users[1].id),
            (1, NotificationType.connection_request, "Demo Admin sent you a connection request", users[0].id),
            (2, NotificationType.job_application, "Arjun Mehta applied for your IoT job", jobs[2].id),
        ]
        for user_i, ntype, message, ref_id in notifs:
            notif = Notification(
                user_id=users[user_i].id,
                type=ntype,
                message=message,
                reference_id=ref_id,
                is_read=False,
            )
            db.add(notif)
        db.commit()
        print(f"  ✓ Created {len(notifs)} notifications")

        print("")
        print("  ════════════════════════════════════════")
        print("  🎓 Demo Accounts Ready!")
        print("  ════════════════════════════════════════")
        print("  📧 demo@alumni.com     🔑 demo1234  (Master Admin)")
        print("  📧 priya@alumni.com    🔑 demo1234  (Data Scientist)")
        print("  📧 rahul@alumni.com    🔑 demo1234  (Startup Founder)")
        print("  📧 sneha@alumni.com    🔑 demo1234  (Product Manager)")
        print("  📧 arjun@alumni.com    🔑 demo1234  (Mechanical Eng.)")
        print("  ════════════════════════════════════════")
        print("")

    except Exception as e:
        db.rollback()
        print(f"  ⚠️  Seeder error: {e}")
    finally:
        db.close()
