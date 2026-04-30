import { randomUUID } from 'crypto'

interface AuthCodeEntry {
  clientId: string
  redirectUri: string
  expiresAt: number
}

const authCodes = new Map<string, AuthCodeEntry>()
const accessTokens = new Set<string>()

export function generateAuthCode(clientId: string, redirectUri: string): string {
  const code = randomUUID()
  authCodes.set(code, { clientId, redirectUri, expiresAt: Date.now() + 10 * 60 * 1000 })
  return code
}

export function validateAuthCode(code: string, clientId: string, redirectUri: string): boolean {
  const entry = authCodes.get(code)
  if (!entry) return false
  if (entry.clientId !== clientId || entry.redirectUri !== redirectUri) return false
  if (Date.now() > entry.expiresAt) { authCodes.delete(code); return false }
  authCodes.delete(code)
  return true
}

export function generateAccessToken(): string {
  const token = randomUUID()
  accessTokens.add(token)
  return token
}

export function validateAccessToken(token: string): boolean {
  return accessTokens.has(token)
}
