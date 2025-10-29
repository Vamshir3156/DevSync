import React from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-[92vw] max-w-lg card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button className="badge" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
