// feedback-hook.ts
import { useState, useEffect } from "react"
import * as api from "../api/api"

export type FeedbackStatus = "loaded" | "submitting" | "success" | "error"

export function useFeedback() {
  const [formData, setFormData] = useState<api.FeedbackData>({
    companyId: 0,
    customerName: "",
    rating: 0,
    comments: "",
  })
  const [status, setStatus] = useState<FeedbackStatus>("loaded")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const params = api.FeedbackService.parseUrlParams()
    setFormData(prev => ({
      ...prev,
      ...params
    }))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "companyId" || name === "rating" ? Number.parseInt(value, 10) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    try {
      await api.FeedbackService.submitFeedback(formData)
      setStatus("success")
    } catch (error) {
      console.error("Feedback submission error:", error)
      setStatus("error")
      setErrorMessage(error instanceof Error ? error.message : "An error occurred while submitting feedback")
    }
  }

  const resetForm = () => {
    setStatus("loaded")
    setErrorMessage("")
  }

  return {
    formData,
    status,
    errorMessage,
    handleChange,
    handleSubmit,
    resetForm
  }
}