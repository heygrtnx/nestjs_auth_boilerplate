import { PrismaClient, Role, Status } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if super admin exists
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { telephoneNumber: '+2349066966789' },
  });

  // Check if developers already exist
  const existingDeveloper1 = await prisma.user.findUnique({
    where: { telephoneNumber: '+2349010484986' },
  });

  // Create super admin if doesn't exist
  if (!existingSuperAdmin) {
    const superAdmin = await prisma.user.create({
      data: {
        firstName: 'DebizFood',
        lastName: 'Limited',
        email: 'eventsandcateringbydebiz@gmail.com',
        telephoneNumber: '+2349066966789',
        dob: '1990-01-01',
        role: Role.SUPER_ADMIN,
        accountStatus: Status.ACTIVE,
        isActive: true,
        Admins: {
          create: {
            password:
              '$argon2id$v=19$m=65536,t=3,p=4$UibvEaS+FiHJF2w6egxBeA$k/e5sptgMqKZjOxwVqoL+WkJ5zOnBEbxxKqpuIa/OXE', // password: Password123!
            inviteStatus: Status.APPROVED,
          },
        },
      },
    });
    console.log('Created super admin:', superAdmin);
  }

  // Only create developers if they don't exist
  if (!existingDeveloper1) {
    const developer1 = await prisma.user.create({
      data: {
        firstName: 'Greatness',
        lastName: 'Abolade',
        email: 'dothostng@gmail.com',
        telephoneNumber: '+2349010484986',
        dob: '1990-01-01',
        role: Role.DEVELOPER,
        accountStatus: Status.ACTIVE,
        isActive: true,
        Admins: {
          create: {
            password:
              '$argon2id$v=19$m=65536,t=3,p=4$UibvEaS+FiHJF2w6egxBeA$k/e5sptgMqKZjOxwVqoL+WkJ5zOnBEbxxKqpuIa/OXE', // password: Password123!
            inviteStatus: Status.APPROVED,
          },
        },
      },
    });
    console.log('Created developer1:', developer1);
  }

  console.log('Seeding completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
