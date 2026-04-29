import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { InstagramProvider } from '../providers/instagram.js'

export function registerInstagramTools(server: McpServer, provider: InstagramProvider): void {
  server.tool(
    'get_instagram_profile',
    "Récupère le profil public d'un compte Instagram : bio, followers, etc.",
    { username: z.string().describe("Nom d'utilisateur Instagram sans @") },
    async ({ username }) => {
      const profile = await provider.getProfile(username)
      return { content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }] }
    }
  )

  server.tool(
    'get_instagram_posts',
    "Récupère les derniers posts d'un compte Instagram avec leurs métriques",
    {
      username: z.string().describe("Nom d'utilisateur Instagram sans @"),
      limit: z.number().min(1).max(50).default(10).describe('Nombre de posts à récupérer'),
    },
    async ({ username, limit }) => {
      const posts = await provider.getPosts(username, limit)
      return { content: [{ type: 'text', text: JSON.stringify(posts, null, 2) }] }
    }
  )
}
