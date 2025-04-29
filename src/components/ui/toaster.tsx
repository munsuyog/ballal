"use client"

import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

export function Toaster() {
  const { toast } = useToast()

  useEffect(() => {
    const toastContainer = document.createElement("div")
    toastContainer.className = "fixed top-4 right-4 z-50 flex flex-col gap-2"
    document.body.appendChild(toastContainer)

    const showToast = (toast: any) => {
      const toastElement = document.createElement("div")
      toastElement.className = `bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 transition-all duration-300 ease-in-out transform translate-x-0 ${
        toast.variant === "destructive" ? "border-l-4 border-red-500" : "border-l-4 border-primary"
      }`
      
      const content = `
        ${toast.title ? `<h3 class="font-medium">${toast.title}</h3>` : ""}
        ${toast.description ? `<p class="text-sm text-gray-500 dark:text-gray-400">${toast.description}</p>` : ""}
      `
      
      toastElement.innerHTML = content
      toastContainer.appendChild(toastElement)

      setTimeout(() => {
        toastElement.classList.add("opacity-0", "translate-x-full")
        setTimeout(() => toastElement.remove(), 300)
      }, 5000)
    }

    // Subscribe to toast events
    const unsubscribe = () => {
      document.body.removeChild(toastContainer)
    }

    return unsubscribe
  }, [toast])

  return null
}