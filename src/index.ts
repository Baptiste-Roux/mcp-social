import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { TiktokProvider } from './providers/tiktok.js'
import { InstagramProvider } from './providers/instagram.js'
import { registerTiktokTools } from './tools/tiktok.js'
import { registerInstagramTools } from './tools/instagram.js'
import {
  generateAuthCode,
  validateAuthCode,
  generateAccessToken,
  validateAccessToken,
} from './oauth.js'

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err)
  process.exit(1)
})

const server = new McpServer({
  name: 'mcp-social',
  version: '0.1.0',
})

const tiktokProvider = new TiktokProvider()
const instagramProvider = new InstagramProvider()

registerTiktokTools(server, tiktokProvider)
registerInstagramTools(server, instagramProvider)

const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const PUBLIC_PATHS = new Set([
  '/health',
  '/oauth/authorize',
  '/oauth/token',
  '/.well-known/oauth-authorization-server',
  '/.well-known/oauth-protected-resource',
])

app.get('/.well-known/oauth-protected-resource', (_req: Request, res: Response) => {
  res.json({
    resource: process.env.BASE_URL,
    authorization_servers: [process.env.BASE_URL],
  })
})

// OAuth metadata
app.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
  res.json({
    issuer: process.env.BASE_URL,
    authorization_endpoint: `${process.env.BASE_URL}/oauth/authorize`,
    token_endpoint: `${process.env.BASE_URL}/oauth/token`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
  })
})

// Authorization endpoint
app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, state } = req.query as Record<string, string>
  console.log('authorize params:', JSON.stringify({ client_id, redirect_uri, state }))
  if (client_id !== process.env.OAUTH_CLIENT_ID) {
    res.status(400).json({ error: 'invalid_client' })
    return
  }
  // if (redirect_uri !== process.env.OAUTH_REDIRECT_URI) {
  //   res.status(400).json({ error: 'invalid_redirect_uri' })
  //   return
  // }
  const code = generateAuthCode(client_id, redirect_uri)
  const location = `${redirect_uri}?code=${code}${state ? `&state=${state}` : ''}`
  res.redirect(location)
})

// Token endpoint
app.post('/oauth/token', (req: Request, res: Response) => {
  const body = req.body as Record<string, string>
  const { grant_type, code, client_id, client_secret, redirect_uri } = body
  console.log('token request body:', JSON.stringify(body))
  if (grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'unsupported_grant_type' })
    return
  }
  if (client_id !== process.env.OAUTH_CLIENT_ID || client_secret !== process.env.OAUTH_CLIENT_SECRET) {
    res.status(401).json({ error: 'invalid_client' })
    return
  }
  if (!validateAuthCode(code, client_id, redirect_uri)) {
    res.status(400).json({ error: 'invalid_grant' })
    return
  }
  const access_token = generateAccessToken()
  res.json({ access_token, token_type: 'Bearer', expires_in: 86400 })
})

// Auth middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_PATHS.has(req.path)) return next()
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!validateAccessToken(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
await server.connect(transport)

app.all('/mcp', async (req: Request, res: Response) => {
  await transport.handleRequest(req, res, req.body)
})

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`mcp-social listening on port ${port}`)
})
