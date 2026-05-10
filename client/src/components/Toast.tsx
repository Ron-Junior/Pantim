import { Component, createSignal, createEffect, onCleanup, Show } from 'solid-js';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: Component<ToastProps> = (props) => {
  createEffect(() => {
    const timer = setTimeout(() => {
      props.onClose();
    }, 3000);
    onCleanup(() => clearTimeout(timer));
  });

  const bgClass = () => {
    switch (props.type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'info':
        return 'bg-blue-600';
    }
  };

  const iconClass = () => {
    switch (props.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
        return 'ℹ';
    }
  };

  return (
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div class={`${bgClass()} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3`}>
        <span class="text-lg font-bold">{iconClass()}</span>
        <span class="text-base font-medium text-nowrap">{props.message}</span>
      </div>
    </div>
  );
};

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);
let toastId = 0;

export const showToast = (message: string, type: ToastType = 'info') => {
  const id = ++toastId;
  setToasts((prev) => [...prev, { id, message, type }]);
};

export const ToastContainer: Component = () => {
  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <Show when={toasts().length > 0}>
      <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {toasts().map((toast) => (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </Show>
  );
};

export default Toast;