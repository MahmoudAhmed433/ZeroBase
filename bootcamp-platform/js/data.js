const categories = ["AI", "Web Development", "Cybersecurity", "Data Analysis", "Cloud", "Mobile"];
const cities = ["Cairo", "Giza", "Alexandria", "Mansoura", "Aswan", "Tanta"];

const companies = [
  {
    id: "c1",
    name: "NileTech Solutions",
    logo: "NT",
    verified: true,
    trustScore: 92,
    completedPrograms: 33,
    avgRating: 4.8,
    responseSpeed: "Fast",
    reports: 1,
    about: "NileTech Solutions builds enterprise AI and analytics products for regional businesses.",
    governorate: "Cairo",
    gallery: ["Workspace", "Mentoring Session", "Demo Day"]
  },
  {
    id: "c2",
    name: "Delta Cyber Labs",
    logo: "DC",
    verified: true,
    trustScore: 88,
    completedPrograms: 21,
    avgRating: 4.6,
    responseSpeed: "Fast",
    reports: 2,
    about: "Delta Cyber Labs provides offensive security testing and SOC support for organizations.",
    governorate: "Alexandria",
    gallery: ["Security Team", "Lab Room", "Blue Team Drill"]
  },
  {
    id: "c3",
    name: "Orbit Web Systems",
    logo: "OW",
    verified: false,
    trustScore: 74,
    completedPrograms: 14,
    avgRating: 4.1,
    responseSpeed: "Medium",
    reports: 4,
    about: "Orbit Web Systems develops digital products and ecommerce platforms for startups.",
    governorate: "Giza",
    gallery: ["Product Workshop", "Frontend Team", "Client Presentation"]
  },
  {
    id: "c4",
    name: "Cloud Gate Egypt",
    logo: "CG",
    verified: true,
    trustScore: 85,
    completedPrograms: 19,
    avgRating: 4.5,
    responseSpeed: "Medium",
    reports: 2,
    about: "Cloud Gate Egypt specializes in cloud migration and DevOps automation.",
    governorate: "Cairo",
    gallery: ["Cloud Ops", "Team Standup", "Infrastructure Dashboard"]
  }
];

const programs = [
  {
    id: "p1",
    companyId: "c1",
    title: "AI Product Training Program",
    category: "AI",
    city: "Cairo",
    durationWeeks: 8,
    priceType: "Free",
    seats: 25,
    featured: true,
    deadline: "2026-06-01T23:59:59",
    schedule: "Sun - Wed, 10:00 AM - 2:00 PM",
    locationText: "Smart Village, Cairo",
    mapEmbed: "https://maps.google.com/maps?q=smart%20village%20cairo&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Join product and ML teams to work on live AI deployment pipelines and user-facing product features.",
    requiredSkills: ["Basic Python", "Communication", "Problem Solving"],
    postedAt: "2026-04-30T08:00:00"
  },
  {
    id: "p2",
    companyId: "c2",
    title: "SOC Analyst Training Program",
    category: "Cybersecurity",
    city: "Alexandria",
    durationWeeks: 10,
    priceType: "Paid",
    seats: 18,
    featured: true,
    deadline: "2026-05-22T23:59:59",
    schedule: "Mon - Thu, 9:00 AM - 1:00 PM",
    locationText: "Smouha, Alexandria",
    mapEmbed: "https://maps.google.com/maps?q=alexandria%20egypt&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Hands-on SOC operations training with SIEM workflows, incident response simulations, and reporting.",
    requiredSkills: ["Networking Basics", "Linux Basics", "English Reading"],
    postedAt: "2026-04-28T09:00:00"
  },
  {
    id: "p3",
    companyId: "c3",
    title: "Frontend Engineering Training Program",
    category: "Web Development",
    city: "Giza",
    durationWeeks: 6,
    priceType: "Free",
    seats: 30,
    featured: false,
    deadline: "2026-05-30T23:59:59",
    schedule: "Sat - Tue, 11:00 AM - 3:00 PM",
    locationText: "Dokki, Giza",
    mapEmbed: "https://maps.google.com/maps?q=dokki%20giza&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Collaborate with frontend squads to build responsive interfaces and reusable design systems.",
    requiredSkills: ["HTML & CSS Basics", "JavaScript Basics", "Teamwork"],
    postedAt: "2026-05-01T10:00:00"
  },
  {
    id: "p4",
    companyId: "c4",
    title: "Cloud DevOps Training Program",
    category: "Cloud",
    city: "Cairo",
    durationWeeks: 12,
    priceType: "Paid",
    seats: 15,
    featured: false,
    deadline: "2026-05-18T23:59:59",
    schedule: "Sun - Thu, 12:00 PM - 4:00 PM",
    locationText: "Nasr City, Cairo",
    mapEmbed: "https://maps.google.com/maps?q=nasr%20city%20cairo&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Train with cloud engineers on CI/CD, container operations, and cloud infrastructure reliability.",
    requiredSkills: ["Linux Basics", "Git Basics", "Basic Scripting"],
    postedAt: "2026-04-25T12:00:00"
  },
  {
    id: "p5",
    companyId: "c1",
    title: "Data Analytics Training Program",
    category: "Data Analysis",
    city: "Mansoura",
    durationWeeks: 7,
    priceType: "Free",
    seats: 20,
    featured: false,
    deadline: "2026-06-10T23:59:59",
    schedule: "Mon - Wed, 10:00 AM - 1:00 PM",
    locationText: "University District, Mansoura",
    mapEmbed: "https://maps.google.com/maps?q=mansoura%20egypt&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Practice dashboarding, business metrics, and storytelling with data teams and analysts.",
    requiredSkills: ["Spreadsheet Basics", "Math Basics", "Curiosity"],
    postedAt: "2026-05-02T09:30:00"
  },
  {
    id: "p6",
    companyId: "c2",
    title: "Mobile Security Training Program",
    category: "Cybersecurity",
    city: "Cairo",
    durationWeeks: 9,
    priceType: "Paid",
    seats: 22,
    featured: false,
    deadline: "2026-05-26T23:59:59",
    schedule: "Tue - Fri, 2:00 PM - 6:00 PM",
    locationText: "New Cairo",
    mapEmbed: "https://maps.google.com/maps?q=new%20cairo&t=&z=13&ie=UTF8&iwloc=&output=embed",
    description: "Learn secure mobile development checks, threat modeling, and app security validation routines.",
    requiredSkills: ["Mobile Basics", "OOP Basics", "Security Curiosity"],
    postedAt: "2026-05-03T07:30:00"
  }
];

const questionsMock = {
  p1: [
    { by: "Student", text: "Is this beginner friendly?", reply: "Yes, we include a fundamentals week." },
    { by: "Student", text: "Is attendance hybrid?", reply: "This program is fully on-site." }
  ],
  p2: [
    { by: "Student", text: "Any night sessions?", reply: "No, currently daytime only." }
  ]
};

const verificationRecords = [
  {
    id: "VR-11001",
    studentName: "Amina Adel",
    companyName: "NileTech Solutions",
    programTitle: "AI Product Training Program",
    startDate: "2025-11-03",
    endDate: "2026-01-02",
    status: "Verified"
  },
  {
    id: "VR-11002",
    studentName: "Karim Mostafa",
    companyName: "Delta Cyber Labs",
    programTitle: "SOC Analyst Training Program",
    startDate: "2025-10-01",
    endDate: "2025-12-20",
    status: "Verified"
  }
];
