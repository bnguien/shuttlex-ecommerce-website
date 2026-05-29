import { useToastStore } from "../../store/toastStore"

export function ToastContainer() {
  const toast = useToastStore((state) => state.toast)
  
  if (!toast.show) return null
  
  return (
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
  )
}

export function useToast() {
  return useToastStore((state) => state.showToast)
}
