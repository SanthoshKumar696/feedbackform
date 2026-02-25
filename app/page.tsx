// page.tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { apiService } from "../api/api"

interface FeedbackData {
  companyId: number
  customerName: string
  rating: number
  comments: string
}

type FeedbackStatus = "loaded" | "submitting" | "success" | "error"

export default function FeedbackPage() {
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
    const companyId = Number.parseInt(searchParams.get("companyId") || "0", 10)
    const customerName = searchParams.get("customerName") || ""
    const rating = Number.parseInt(searchParams.get("rating") || "0", 10)
    const comments = searchParams.get("comments") || ""

    setFormData({
      companyId,
      customerName,
      rating,
      comments,
    })
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
    await apiService.request("/feedback/submit", {
      method: "POST",
      body: formData,
      headers: {
        "X-Company-Id": formData.companyId.toString()
      }
    })

    setStatus("success")
  } catch (error) {
    console.error("Feedback submission error:", error)
    setStatus("error")
    setErrorMessage(error instanceof Error ? error.message : "An error occurred while submitting feedback")
  }
}

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Feedback Form</CardTitle>
          <CardDescription>Please provide your feedback below</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loaded" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <select
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value={0}>Select a rating...</option>
                  <option value={1}>1 - Poor</option>
                  <option value={2}>2 - Fair</option>
                  <option value={3}>3 - Good</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={5}>5 - Excellent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comments</label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your feedback..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Submit Feedback
              </Button>
            </form>
          )}

          {status === "submitting" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Submitting your feedback...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Thank You!</p>
                <p className="mt-1 text-sm text-muted-foreground">Your feedback has been successfully submitted.</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <Button onClick={() => setStatus("loaded")} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}