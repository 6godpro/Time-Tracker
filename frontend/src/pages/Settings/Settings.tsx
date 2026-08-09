import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { useAuthStore } from "@/store/authStore";
import { useChangePassword, useRequestAccountDeletion } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

function ChangePasswordModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const changePassword = useChangePassword();

  // Reset both the form fields and any stale mutation error whenever the
  // modal opens/closes, so reopening it after a failed or successful
  // attempt always starts clean instead of showing the last attempt's state.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      changePassword.reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = (values: ChangePasswordForm) => {
    changePassword.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
        onSuccess();
      },
    });
  };

  const fields = [
    { name: "currentPassword" as const, label: "Current Password", autoComplete: "current-password" },
    { name: "newPassword" as const, label: "New Password", autoComplete: "new-password" },
    { name: "confirmNewPassword" as const, label: "Confirm New Password", autoComplete: "new-password" },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Change Password"
      description="Enter your current password, then choose a new one."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {fields.map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-ink">
              {field.label}
            </label>
            <input
              id={field.name}
              type="password"
              autoComplete={field.autoComplete}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register(field.name)}
            />
            {errors[field.name] ? (
              <p className="mt-1 text-xs text-danger">{errors[field.name]?.message}</p>
            ) : null}
          </div>
        ))}

        {changePassword.isError ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {extractErrorMessage(changePassword.error)}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={changePassword.isPending}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteAccountModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const requestDeletion = useRequestAccountDeletion();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      requestDeletion.reset();
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    requestDeletion.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess();
      },
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Delete account"
      description="This permanently deletes your account and all of your shift, break, and payroll history. This can't be undone."
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          We'll email you a link to confirm — nothing is deleted until you click it.
        </p>

        {requestDeletion.isError ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {extractErrorMessage(requestDeletion.error)}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="danger" isLoading={requestDeletion.isPending} onClick={handleConfirm}>
            Email Me a Deletion Link
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Settings() {
  const user = useAuthStore((s) => s.user);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Manage your account security</p>
      </div>

      {successMessage ? (
        <p className="mb-6 rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
          {successMessage}
        </p>
      ) : null}

      <div className="space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <p className="mt-1 text-sm text-ink-soft">Signed in as</p>
          <p className="mt-3 text-sm font-medium text-ink">{user?.email}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Password</h2>
              <p className="mt-1 text-sm text-ink-soft">Change the password used to sign in to your account.</p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => {
                setSuccessMessage(null);
                setIsPasswordModalOpen(true);
              }}
            >
              Change Password
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">Delete account</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Permanently delete your account and all of your history. This can't be undone.
              </p>
            </div>
            <Button
              variant="danger"
              className="shrink-0"
              onClick={() => {
                setSuccessMessage(null);
                setIsDeleteModalOpen(true);
              }}
            >
              Delete account
            </Button>
          </div>
        </Card>
      </div>

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onOpenChange={setIsPasswordModalOpen}
        onSuccess={() => setSuccessMessage("Your password has been updated.")}
      />

      <DeleteAccountModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onSuccess={() => setSuccessMessage("Check your email for a link to confirm deleting your account.")}
      />
    </AppLayout>
  );
}