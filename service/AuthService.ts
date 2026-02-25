// service/AuthService.ts

const BIOMETRIC_API_URL =
  "https://foodzoaiusermanagementmultiennenttesting-bmc3bbgbaeephqc4.eastus2-01.azurewebsites.net/api/User/JWTBiometric-success"

export interface AuthTokens {
  token: string
  refreshToken: string | null
  expiresAt: string
  refreshTokenExpiresAt: string | null
}

class AuthService {
  async authenticateWithBiometrics(): Promise<AuthTokens> {
    const response = await fetch(BIOMETRIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message: "success" }),
    })

    if (!response.ok) {
      throw new Error("Authentication failed")
    }

    const data = await response.json()

    const accessToken = data.accessToken ?? data.token

    if (!accessToken) {
      throw new Error("No token found")
    }

    const tokens: AuthTokens = {
      token: accessToken,
      refreshToken: data.refreshToken ?? null,
      expiresAt: data.expiresAt,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? null,
    }

    this.storeTokens(tokens)
    return tokens
  }

  storeTokens(tokens: AuthTokens) {
    localStorage.setItem("authToken", tokens.token)
    localStorage.setItem("refreshToken", tokens.refreshToken || "")
    localStorage.setItem("tokenExpiry", tokens.expiresAt)
    localStorage.setItem("refreshTokenExpiry", tokens.refreshTokenExpiresAt || "")
  }

  getAuthToken(): string | null {
    return localStorage.getItem("authToken")
  }

  isAuthenticated(): boolean {
    const token = this.getAuthToken()
    if (!token) return false

    const expiry = localStorage.getItem("tokenExpiry")
    if (expiry && new Date() > new Date(expiry)) {
      this.clearTokens()
      return false
    }

    return true
  }

  clearTokens() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("tokenExpiry")
    localStorage.removeItem("refreshTokenExpiry")
  }

  addAuthHeader(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getAuthToken()
    if (!token) return headers

    return {
      ...headers,
      Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    }
  }
}

export const authService = new AuthService()