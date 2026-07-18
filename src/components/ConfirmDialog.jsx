import React from 'react'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="premium-card shadow-glass-lg w-full max-w-lg mx-4 z-50 overflow-hidden">
        <div className="p-6">
          <h3 className="page-title text-lg">{title}</h3>
          <p className="mt-3 text-sm text-slate-600 break-words whitespace-pre-line">{description}</p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-white/80 border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 shadow-sm transition-all"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
