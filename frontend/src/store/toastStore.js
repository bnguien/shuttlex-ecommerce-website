import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toast: { show: false, message: "", type: "success" },
  showToast: (message, type = "success") => {
    set({ toast: { show: true, message, type } })
    setTimeout(() => {
      set((state) => ({ toast: { ...state.toast, show: false } }))
    }, 3000)
  }
}))
