import { 
  PrismaClient, 
  UserRole, 
  ProfileCompletionStatus, 
  EventStatus, 
  ProgramType
} from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import "dotenv/config";

const adapter = new PrismaNeon ({
  connectionString: process.env["DATABASE_URL"],
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // ---------------------------------------------------------------------------
  // 1. Core Team Users (Super Admin, Organizer, Reviewer)
  // ---------------------------------------------------------------------------
  console.log('Creating admin users...');
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@utdallas.edu' },
    update: {},
    create: {
      clerkId: 'mock_clerk_admin_1',
      email: 'admin@utdallas.edu',
      role: UserRole.SUPER_ADMIN,
      profile: {
        create: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          middleName: '',
          prefName: 'Ada',
          year: 'Senior',
          degree: 'Bachelors',
          major: 'Computer Science',
          utdEmail: 'admin@utdallas.edu',
          utdNetId: 'axl123456',
          profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        },
      },
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@utdallas.edu' },
    update: {},
    create: {
      clerkId: 'mock_clerk_organizer_1',
      email: 'organizer@utdallas.edu',
      role: UserRole.ORGANIZER,
      profile: {
        create: {
          firstName: 'Alan',
          lastName: 'Turing',
          middleName: '',
          prefName: 'Alan',
          year: 'Junior',
          degree: 'Bachelors',
          major: 'Software Engineering',
          utdEmail: 'organizer@utdallas.edu',
          profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        },
      },
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@utdallas.edu' },
    update: {},
    create: {
      clerkId: 'mock_clerk_reviewer_1',
      email: 'reviewer@utdallas.edu',
      role: UserRole.REVIEWER,
      profile: {
        create: {
          firstName: 'Grace',
          lastName: 'Hopper',
          middleName: '',
          prefName: 'Grace',
          year: 'Graduate',
          degree: 'Masters',
          major: 'Data Science',
          utdEmail: 'reviewer@utdallas.edu',
          profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
        },
      },
    },
  });

  // ---------------------------------------------------------------------------
  // 2. Mock Applicants / General Members
  // ---------------------------------------------------------------------------
  console.log('Creating standard users...');

  // Creating 5 test users using a loop
  const members = [];
  for (let i = 1; i <= 5; i++) {
    const member = await prisma.user.upsert({
      where: { email: `student${i}@utdallas.edu` },
      update: {},
      create: {
        clerkId: `mock_clerk_student_${i}`,
        email: `student${i}@utdallas.edu`,
        role: UserRole.MEMBER,
        profile: {
          create: {
            firstName: `Student`,
            lastName: `${i}`,
            middleName: '',
            prefName: `Stud ${i}`,
            year: i < 3 ? 'Freshman' : 'Sophomore',
            degree: 'Bachelors',
            major: 'Cognitive Science',
            utdEmail: `student${i}@utdallas.edu`,
            profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
          },
        },
      },
    });
    members.push(member);
  }

  // ---------------------------------------------------------------------------
  // 3. Mock Events
  // ---------------------------------------------------------------------------
  console.log('Creating events...');

  // An upcoming event
  await prisma.event.upsert({
    where: { id: 'mock-event-upcoming' },
    update: {},
    create: {
      id: 'mock-event-upcoming',
      title: 'Intro to Large Language Models',
      description: 'Join us for a beginner-friendly workshop on how LLMs work under the hood.',
      location: 'ECSS 2.102',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7 + 1000 * 60 * 90), // 1.5 hours later
      status: EventStatus.UPCOMING,
      capacity: 100,
      createdById: organizer.id,
    },
  });

  // A past/closed event
  await prisma.event.upsert({
    where: { id: 'mock-event-past' },
    update: {},
    create: {
      id: 'mock-event-past',
      title: 'AIS Kickoff Fall 2025',
      description: 'Welcome to the new semester with the AI Society!',
      location: 'SSA Auditorium',
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 120),
      status: EventStatus.CLOSED,
      capacity: 300,
      createdById: superAdmin.id,
    },
  });

  // ---------------------------------------------------------------------------
  // 4. Mock Program Application
  // ---------------------------------------------------------------------------
  console.log('Creating program applications...');

  await prisma.programApplication.upsert({
    where: { id: 'mock-app-ai-academy' },
    update: {},
    create: {
      id: 'mock-app-ai-academy',
      title: 'AI Academy - Fall 2026',
      description: 'A semester-long bootcamp to get you up to speed on machine learning fundamentals. No prior experience required!',
      programType: ProgramType.AI_ACADEMY,
      openAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // Opened 2 days ago
      closeAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14), // Closes in 14 days
      decisionDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      visibleToUsers: true,
      createdById: superAdmin.id,
    },
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });