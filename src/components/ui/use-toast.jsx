import * as React from "react"

const ToastContext = React.createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([])

  const toast = React.useCallback(({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  const dismiss = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`mb-4 rounded-md border p-4 shadow-lg ${
              t.variant === "destructive" ? "border-destructive bg-destructive text-destructive-foreground" : "border bg-background"
            }`}
          >
            {t.title && <h4 className="text-sm font-semibold">{t.title}</h4>}
            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
            <button
              onClick={() => dismiss(t.id)}
              className="absolute right-2 top-2 text-foreground/50 hover:text-foreground"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
