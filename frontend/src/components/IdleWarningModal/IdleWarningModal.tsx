import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";

interface IdleWarningModalProps {
  open: boolean;
  secondsRemaining: number;
  onStayActive: () => void;
  logout: () => void;
}

export function IdleWarningModal({
  open,
  secondsRemaining,
  onStayActive,
  logout,
}: IdleWarningModalProps) {
  return (
    <Modal
      open={open}
      onOpenChange={() => {}}
      title="Still there?"
      description={`You've been inactive for a while. For your security, you'll be signed out in ${secondsRemaining}s.`}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          type="button"
          className="w-full text-brand"
          onClick={onStayActive}
          variant="secondary"
        >
          Stay signed in
        </Button>
        <Button type="button" className="w-full" onClick={() => logout()}>
          Log out
        </Button>
      </div>
    </Modal>
  );
}
