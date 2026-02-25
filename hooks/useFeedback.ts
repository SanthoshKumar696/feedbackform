// hooks/useFeedback.ts
import { useState, useEffect } from "react"
import { apiService } from "../api/api"

interface FeedbackData {
  companyId: number
  customerName: string
  rating: number
  comments: string
}

type FeedbackStatus = "loaded" | "submitting" | "success" | "error"

export function useFeedback() {
  const [formData, setFormData] = useState<FeedbackData>({
    companyId: 0,
    customerName: "",
    rating: 0,
    comments: "",
  })
  const [status, setStatus] = useState<FeedbackStatus>("loaded")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    setFormData(prev => ({
      ...prev,
      companyId: Number.parseInt(searchParams.get("companyId") || "0", 10),
      customerName: searchParams.get("customerName") || "",
      rating: Number.parseInt(searchParams.get("rating") || "0", 10),
      comments: searchParams.get("comments") || "",
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
      await apiService.post("/feedback", formData)
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