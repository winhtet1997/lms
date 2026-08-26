import { useState } from "react";

export function useConfirm() {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const [resolver, setResolver] = useState(null);

  const confirm = (options = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title || "Are you sure?",
        message: options.message || "This action cannot be undone.",
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
      });
      setResolver(() => resolve);
    });
  };

  const handleClose = (result) => {
    setState((prev) => ({ ...prev, open: false }));
    resolver(result);
  };

  const ConfirmModal = () =>
    state.open ? (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={() => handleClose(false)}
      >
        <div className="bg-white rounded-lg p-6 w-80 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <h3 className="font-bold text-lg mb-3">{state.title}</h3>
          <p className="text-sm mb-5">{state.message}</p>

          <div className="flex justify-end gap-3">
            <button
              className="btn btn-ghost"
              onClick={() => handleClose(false)}
            >
              {state.cancelText}
            </button>

            <button
              className="btn btn-error text-white shadow-none"
              onClick={() => handleClose(true)}
            >
              {state.confirmText}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return { confirm, ConfirmModal };
}