import React, { useState, useEffect } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

// Quản lý event toast toàn cục
export const toastEvents = {
  show: (message, type = 'success', duration = 3500) => {
    window.dispatchEvent(
      new CustomEvent('admin-show-toast', {
        detail: { id: Date.now() + Math.random(), message, type, duration }
      })
    )
  },
  success: (message, duration = 3500) => toastEvents.show(message, 'success', duration),
  error: (message, duration = 4000) => toastEvents.show(message, 'error', duration),
  warning: (message, duration = 3500) => toastEvents.show(message, 'warning', duration),
  info: (message, duration = 3000) => toastEvents.show(message, 'info', duration)
}

export default function AdminToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleAddToast = (e) => {
      const newToast = e.detail
      setToasts((prev) => [...prev, newToast])

      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id)
        }, newToast.duration)
      }
    }

    window.addEventListener('admin-show-toast', handleAddToast)
    return () => window.removeEventListener('admin-show-toast', handleAddToast)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="admin-toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let icon = <CheckCircle2 size={18} className="admin-toast-icon-success" />
        if (toast.type === 'error') icon = <AlertCircle size={18} className="admin-toast-icon-error" />
        if (toast.type === 'warning') icon = <AlertTriangle size={18} className="admin-toast-icon-warning" />
        if (toast.type === 'info') icon = <Info size={18} className="admin-toast-icon-info" />

        return (
          <div key={toast.id} className={`admin-toast-item admin-toast-${toast.type}`}>
            <div className="admin-toast-content">
              <span className="admin-toast-icon">{icon}</span>
              <span className="admin-toast-message">{toast.message}</span>
            </div>
            <button
              className="admin-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
