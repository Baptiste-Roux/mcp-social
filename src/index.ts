import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
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

const transport = new StdioServerTransport()
await server.connect(transport)
