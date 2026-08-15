import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

function serializeJob(job: {
  id: string;
  name: string;
  minimumWorkMinutes: number;
  breakIsPaidByDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: job.id,
    name: job.name,
    minimumWorkMinutes: job.minimumWorkMinutes,
    breakIsPaidByDefault: job.breakIsPaidByDefault,
    isActive: job.isActive,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

// Public — backs the registration and complete-Google-signup job
// dropdowns, which used to import the static JOB_TITLES array. Only
// active jobs are offered, so an archived job can't be selected for a
// brand-new account (existing employees already assigned to it are
// unaffected).
export async function listActiveJobs() {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return jobs.map(serializeJob);
}

// Admin — includes archived jobs too, so the management screen can show
// and reactivate them.
export async function listAllJobs() {
  const jobs = await prisma.job.findMany({
    orderBy: { name: "asc" },
  });

  return jobs.map(serializeJob);
}

export async function createJob(input: {
  name: string;
  minimumWorkMinutes: number;
  breakIsPaidByDefault: boolean;
}) {
  const existing = await prisma.job.findUnique({ where: { name: input.name } });

  if (existing) {
    throw new AppError("A job with this name already exists.", 409);
  }

  const job = await prisma.job.create({ data: input });

  return serializeJob(job);
}

async function getJobOrThrow(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  return job;
}

// Deliberately doesn't touch existing Shift.minimumWorkMinutesAtClockIn
// snapshots — a job's minimum can change going forward without rewriting
// the rules a historical (or currently in-progress) shift is actually
// governed by. Only shifts clocked in after this update pick up the new
// value.
export async function updateJob(
  jobId: string,
  input: { name?: string; minimumWorkMinutes?: number; breakIsPaidByDefault?: boolean },
) {
  await getJobOrThrow(jobId);

  if (input.name) {
    const existing = await prisma.job.findUnique({ where: { name: input.name } });
    if (existing && existing.id !== jobId) {
      throw new AppError("A job with this name already exists.", 409);
    }
  }

  const job = await prisma.job.update({ where: { id: jobId }, data: input });

  return serializeJob(job);
}

// Jobs are archived, never deleted — every User.currentJobId and
// Shift.jobId reference stays valid forever, including for employees
// still actively assigned to a now-archived job. Archiving only removes
// it from the registration dropdown and the "assign a job" picker going
// forward.
export async function setJobActive(jobId: string, isActive: boolean) {
  await getJobOrThrow(jobId);

  const job = await prisma.job.update({ where: { id: jobId }, data: { isActive } });

  return serializeJob(job);
}
