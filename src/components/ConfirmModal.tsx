interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" className="modal-button modal-button--no" onClick={onCancel}>
            Non
          </button>
          <button type="button" className="modal-button modal-button--yes" onClick={onConfirm}>
            Oui
          </button>
        </div>
      </div>
    </div>
  );
}
