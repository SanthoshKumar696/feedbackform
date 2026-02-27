// api/apiService.ts

import { authService } from "../service/AuthService"

// import { toast } from "@/hooks/use-toast"

// Use the actual API base URL instead of localhost

const API_BASE_URL = "https://azurewebapi-posproduction-epb5fkdahze7e3hr.centralindia-01.azurewebsites.net/api"

const API_KEY = "duWXstDiceN28uWJ504x+fBIrD6T/4ZUHn/wn49VKao="

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: any
  headers?: Record<string, string>
}

const DEBUG_API = true

// Generic request function

const request = async (endpoint: string, options: RequestOptions = {}): Promise<any> => {
  try {
    // Ensure we're authenticated first

    if (!(await authService.isAuthenticated())) {
      if (DEBUG_API) console.log("Not authenticated, attempting biometric authentication...")
      await authService.authenticateWithBiometrics()
    }

    const token = await authService.getAuthToken()

    if (DEBUG_API) {
      console.log("🔐 Token check before adding auth header:", {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        startsWithBearer: token?.startsWith("Bearer ") || false,
      })
    }

    const authHeaders = await authService.addAuthHeader()

    const url = `${API_BASE_URL}${endpoint}`

    // Decide body and content-type safely
    let preparedBody: undefined | string
    let contentType: string | undefined

    if (typeof options.body === "object" && options.body !== null) {
      preparedBody = JSON.stringify(options.body)
      contentType = "application/json"
    } else if (typeof options.body === "string") {
      preparedBody = options.body // raw string (e.g. reason)
      contentType = "text/plain"
    } else {
      preparedBody = undefined
      contentType = undefined // IMPORTANT: do not send Content-Type for empty body
    }

    // Build headers without forcing Content-Type
    const headers: Record<string, string> = {
      "X-API-KEY": API_KEY,
      ...authHeaders,
      ...(options.headers || {}),
    }
    if (contentType) headers["Content-Type"] = contentType

    const config: RequestInit = {
      ...options,
      headers,
      body: preparedBody,
    }

    if (DEBUG_API) {
      const logHeaders = { ...headers }
      if (logHeaders.Authorization) logHeaders.Authorization = logHeaders.Authorization.substring(0, 20) + "..."
      if (logHeaders["X-API-KEY"]) logHeaders["X-API-KEY"] = "[HIDDEN]"
      console.log(`🚀 API Request: ${config.method || "GET"} ${url}`, {
        headers: logHeaders,
        // Avoid JSON.parse on non-JSON string bodies
        body:
          typeof preparedBody === "string" && contentType === "application/json"
            ? (() => {
                try {
                  return JSON.parse(preparedBody as string)
                } catch {
                  return preparedBody
                }
              })()
            : preparedBody,
      })
    }

    const response = await fetch(url, config)

    if (DEBUG_API) console.log(`✅ API Response: ${response.status} ${response.statusText} ${url}`)

    // Handle authentication errors

    if (response.status === 401 || response.status === 403) {
      if (DEBUG_API) console.log("Authentication failed, attempting to reauthenticate...")
      await authService.clearTokens()
      await authService.authenticateWithBiometrics()
      const newAuthHeaders = await authService.addAuthHeader()
      const retryHeaders = {
        "X-API-KEY": API_KEY,
        ...newAuthHeaders,
        ...(contentType && { "Content-Type": contentType }),
        ...options.headers,
      }
      const retryConfig: RequestInit = {
        ...config,
        headers: retryHeaders,
      }
      if (DEBUG_API) console.log("🔄 Retrying request with new token...")
      const retryResponse = await fetch(url, retryConfig)
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text()
        throw new Error(`Retry failed: ${retryResponse.status} - ${errorText}`)
      }
      const retryData = await retryResponse.json()
      return retryData
    }

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      throw new Error(errorData.message || `API error: ${response.status}`)
    }

    if (response.status === 204) {
      return { success: true }
    }

    const data = await response.json()

    return data
  } catch (error) {
    if (DEBUG_API) console.error(`❌ API Error: ${endpoint}`, error)
    throw error
  }
}

// HTTP method shortcuts

const get = (endpoint: string) => {
  return request(endpoint, { method: "GET" })
}

const post = (endpoint: string, data?: any) => {
  return request(endpoint, {
    method: "POST",
    body: data,
  })
}

const put = (endpoint: string, data?: any) => {
  return request(endpoint, {
    method: "PUT",
    body: data,
  })
}

const del = (endpoint: string) => {
  return request(endpoint, { method: "DELETE" })
}

const patch = (endpoint: string, data?: any) => {
  return request(endpoint, {
    method: "PATCH",
    body: data,
  })
}

// Export the API service functions

export const apiService = {
  request,
  get,
  post,
  put,
  patch,
  delete: del, // Using 'del' to avoid conflict with JavaScript's delete keyword
}
