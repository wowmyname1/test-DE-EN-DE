import { useToastStore } from '../../store/toastStore.js';

const toastCss = `
@keyframes originalToastIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes originalToastOut {
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

.original-toast-container {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 6000;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.original-toast {
  background: rgba(15, 52, 96, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid #d4a843;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #e0e0e0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  animation: originalToastIn 0.3s ease, originalToastOut 0.3s ease 2.7s forwards;
  max-width: 280px;
}
`;

export default function ToastLayer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <>
      <style>{toastCss}</style>

      <div className="original-toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="original-toast">
            {toast.text}
          </div>
        ))}
      </div>
    </>
  );
}
