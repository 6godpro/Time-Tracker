import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";

interface IdleWarningModalProps {
  open: boolean;
  secondsRemaining: number;
  onStayActive: () => void;
}

export function IdleWarningModal({
  open,
  secondsRemaining,
  onStayActive,
}: IdleWarningModalProps) {

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onStayActive();
      }}
      title="Still there?"
      description={`You've been inactive for a while. For your security, you'll be signed out in ${secondsRemaining}s.`}
    >
      <Button type="button" className="w-full" onClick={onStayActive}>
        Stay signed in
      </Button>
    </Modal>
  );
}
