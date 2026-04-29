import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { TiktokProvider } from './providers/tiktok.js'
import { InstagramProvider } from './providers/instagram.js'
import { registerTiktokTools } from './tools/tiktok.js'
import { registerInstagramTools } from './tools/instagram.js'

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
app.use(express.json())

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') return next()
  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.MCP_SECRET_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

let transport: SSEServerTransport | null = null

app.get('/sse', async (_req: Request, res: Response) => {
  transport = new SSEServerTransport('/messages', res)
  await server.connect(transport)
  res.on('close', () => { transport?.close() })
})

app.post('/messages', async (req: Request, res: Response) => {
  if (!transport) {
    res.status(503).json({ error: 'No SSE connection active' })
    return
  }
  await transport.handlePostMessage(req, res)
})

const port = process.env.PORT ?? 3000
app.listen(port, () => {
  console.log(`mcp-social listening on port ${port}`)
})
