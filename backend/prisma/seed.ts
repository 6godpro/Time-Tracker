import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function resolveJobId(jobName: string): Promise<string> {
  const existingJob = await prisma.job.findUnique({ where: { name: jobName } });

  if (existingJob) {
    return existingJob.id;
  }

  const created = await prisma.job.create({
    data: { name: jobName, minimumWorkMinutes: 480, breakIsPaidByDefault: false },
  });

  console.log(`Job "${jobName}" didn't exist yet — created it with an 8h minimum.`);

  return created.id;
}

async function main() {
  const firstName = process.env.ADMIN_FIRST_NAME;
  const lastName = process.env.ADMIN_LAST_NAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const jobTitle = process.env.ADMIN_JOB_TITLE;

  if (!firstName || !lastName || !jobTitle || !email || !password) {
    throw new Error(
      "Seeding the admin account requires ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, ADMIN_JOB_TITLE, and ADMIN_PASSWORD to be set in backend/.env",
    );
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Also force-verify here: this script is a trusted, manually-run
    // setup step, not the public register flow, so there's no reason to
    // leave someone it just promoted to ADMIN unable to log in because
    // they never clicked an email link.
    if (existing.role !== "ADMIN" || !existing.emailVerified) {
      await prisma.user.update({ where: { email }, data: { role: "ADMIN", emailVerified: true } });
      console.log(`Existing user ${email} promoted to ADMIN and marked verified.`);
    } else {
      console.log(`Admin ${email} already exists. Nothing to do.`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const currentJobId = await resolveJobId(jobTitle);

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      currentJobId,
      email,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  console.log(`Admin account created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });