"use client"

import { useEffect, useState } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type Toast = ToastProps & {
  id: string
  timeout: ReturnType<typeof setTimeout>
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toasts = new Map<string, Toast>()

export function useToast() {
  const [, setToasts] = useState<Map<string, Toast>>(toasts)

  useEffect(() => {
    return () => {
      for (const [, toast] of toasts) {
        clearTimeout(toast.timeout)
      }
      toasts.clear()
    }
  }, [])

  function toast({ title, description, variant = "default" }: ToastProps) {
    const id = genId()

    const update = () => {
      setToasts(new Map(toasts))
    }

    const dismiss = () => {
      toasts.delete(id)
      update()
    }

    if (toasts.size >= TOAST_LIMIT) {
      Array.from(toasts.values())
        .slice(0, toasts.size - TOAST_LIMIT + 1)
        .forEach((toast) => {
          clearTimeout(toast.timeout)
          toasts.delete(toast.id)
        })
    }

    const timeout = setTimeout(() => {
      dismiss()
    }, TOAST_REMOVE_DELAY)

    toasts.set(id, {
      id,
      title,
      description,
      variant,
      timeout,
    })
    update()

    return dismiss
  }

  return { toast }
}