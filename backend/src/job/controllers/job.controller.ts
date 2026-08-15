import { Request, Response } from "express";
import { listActiveJobs } from "../services/job.service";

// The only handler mounted publicly (see job.routes.ts). Admin job
// management (list-all/create/update/archive) is handled directly in
// admin.controller.ts, which calls straight into job.service.ts —
// there's no admin-facing job.routes.ts, since every admin route lives
// under /admin alongside the rest of the admin module.
export async function listActiveJobsHandler(_req: Request, res: Response) {
  const jobs = await listActiveJobs();
  res.status(200).json({ jobs });
}
