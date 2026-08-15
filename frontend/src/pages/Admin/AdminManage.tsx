import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import {
  useAdminClients,
  useAdminJobs,
  useCreateClient,
  useCreateJob,
  useSetClientActive,
  useSetJobActive,
} from "@/hooks/useAdmin";
import { extractErrorMessage } from "@/api/client";
import type { Client, Job } from "@/types/job";

function JobRow({ job }: { job: Job }) {
  const setActive = useSetJobActive();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{job.name}</p>
        <p className="text-xs text-ink-soft">
          {(job.minimumWorkMinutes / 60).toFixed(1)}h minimum &middot;{" "}
          {job.breakIsPaidByDefault ? "break paid by default" : "break unpaid by default"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            job.isActive ? "bg-status-working-bg text-status-working" : "bg-status-idle-bg text-ink-soft"
          }`}
        >
          {job.isActive ? "Active" : "Archived"}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="px-2.5! py-1! text-xs"
          isLoading={setActive.isPending}
          onClick={() => setActive.mutate({ jobId: job.id, isActive: !job.isActive })}
        >
          {job.isActive ? "Archive" : "Reactivate"}
        </Button>
      </div>
    </div>
  );
}

function CreateJobForm() {
  const [name, setName] = useState("");
  const [minimumHours, setMinimumHours] = useState("8");
  const [breakIsPaidByDefault, setBreakIsPaidByDefault] = useState(false);
  const createJob = useCreateJob();

  const handleSubmit = () => {
    const hours = Number(minimumHours);
    if (!name.trim() || !Number.isFinite(hours) || hours <= 0) {
      return;
    }
    createJob.mutate(
      { name: name.trim(), minimumWorkMinutes: Math.round(hours * 60), breakIsPaidByDefault },
      {
        onSuccess: () => {
          setName("");
          setMinimumHours("8");
          setBreakIsPaidByDefault(false);
        },
      },
    );
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-ink-soft">Job name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Support Specialist"
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">Minimum hours / day</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={minimumHours}
            onChange={(event) => setMinimumHours(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={breakIsPaidByDefault}
              onChange={(event) => setBreakIsPaidByDefault(event.target.checked)}
              className="h-4 w-4 rounded border-line"
            />
            Break paid by default
          </label>
        </div>
      </div>

      {createJob.isError ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(createJob.error)}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-3 px-3! py-1.5! text-xs"
        isLoading={createJob.isPending}
        onClick={handleSubmit}
      >
        Add Job
      </Button>
    </div>
  );
}

function ClientRow({ client }: { client: Client }) {
  const setActive = useSetClientActive();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
      <p className="text-sm font-medium text-ink">{client.name}</p>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            client.isActive ? "bg-status-working-bg text-status-working" : "bg-status-idle-bg text-ink-soft"
          }`}
        >
          {client.isActive ? "Active" : "Archived"}
        </span>
        <Button
          type="button"
          variant="secondary"
          className="px-2.5! py-1! text-xs"
          isLoading={setActive.isPending}
          onClick={() => setActive.mutate({ clientId: client.id, isActive: !client.isActive })}
        >
          {client.isActive ? "Archive" : "Reactivate"}
        </Button>
      </div>
    </div>
  );
}

function CreateClientForm() {
  const [name, setName] = useState("");
  const createClient = useCreateClient();

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-ink-soft">Client name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Button
          type="button"
          className="px-3! py-1.5! text-xs"
          isLoading={createClient.isPending}
          disabled={!name.trim()}
          onClick={() => createClient.mutate(name.trim(), { onSuccess: () => setName("") })}
        >
          Add Client
        </Button>
      </div>
      {createClient.isError ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(createClient.error)}
        </p>
      ) : null}
    </div>
  );
}

export function AdminJobs() {
  const { data: jobs, isLoading: isLoadingJobs } = useAdminJobs();
  const { data: clients, isLoading: isLoadingClients } = useAdminClients();

  return (
    <AppLayout>
      <div className="mb-6">
        <Link to="/admin" className="text-sm font-medium text-brand hover:text-brand-dark">
          &larr; Back to Employees
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Jobs &amp; Clients</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Jobs drive each employee's minimum daily hours, auto-close timing, and default break-pay policy. Clients
          are who a reconciliation compares an employee's shift history against.
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="mb-4 text-sm font-semibold text-ink">Jobs</h2>
        <CreateJobForm />
        <div className="mt-4">
          {isLoadingJobs ? (
            <Loader label="Loading jobs" />
          ) : !jobs || jobs.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-soft">No jobs yet</p>
          ) : (
            jobs.map((job) => <JobRow key={job.id} job={job} />)
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-ink">Clients</h2>
        <CreateClientForm />
        <div className="mt-4">
          {isLoadingClients ? (
            <Loader label="Loading clients" />
          ) : !clients || clients.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-soft">No clients yet</p>
          ) : (
            clients.map((client) => <ClientRow key={client.id} client={client} />)
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
