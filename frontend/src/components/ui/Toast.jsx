import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.show && (
        <div
          className="position-fixed top-0 end-0 p-3 m-3 rounded shadow-sm"
          style={{
            zIndex: 9999,
            backgroundColor: toast.type === "success" ? "#d4edda" : "#f8d7da",
            color: toast.type === "success" ? "#155724" : "#721c24",
            minWidth: "280px",
          }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  return ctx ? ctx.showToast : () => {}
}
