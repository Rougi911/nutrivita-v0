const TOKEN_KEY = "token"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  if (process.env.NEXT_PUBLIC_UI_DEMO === "true") return "ui-demo-not-a-real-token"
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return
  if (process.env.NEXT_PUBLIC_UI_DEMO === "true") return
  localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
  if (typeof window === "undefined") return
  if (process.env.NEXT_PUBLIC_UI_DEMO === "true") return
  localStorage.removeItem(TOKEN_KEY)
}
