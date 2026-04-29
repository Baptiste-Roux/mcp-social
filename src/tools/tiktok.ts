import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { TiktokProvider } from '../providers/tiktok.js'


export function registerTiktokTools(server: McpServer, provider: TiktokProvider): void {
  server.tool(
    'get_tiktok_profile',
    "Récupère le profil public d'un compte TikTok : bio, followers, likes, etc.",
    { username: z.string().describe("Nom d'utilisateur TikTok sans @") },
    async ({ username }) => {
      const profile = await provider.getProfile(username)
      return { content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }] }
    }
  )

  server.tool(
    'get_tiktok_posts',
    "Récupère les dernières vidéos d'un compte TikTok avec leurs métriques (vues, likes, commentaires, partages)",
    {
      username: z.string().describe("Nom d'utilisateur TikTok sans @"),
      limit: z.number().min(1).max(50).default(10).describe('Nombre de vidéos à récupérer'),
    },
    async ({ username, limit }) => {
      const posts = await provider.getPosts(username, limit)
      return { content: [{ type: 'text', text: JSON.stringify(posts, null, 2) }] }
    }
  )

  server.tool(
    'search_tiktok_by_hashtag',
    'Recherche des vidéos TikTok par hashtag. Utile pour découvrir des comptes sans connaître leur username.',
    {
      hashtag: z.string().describe('Hashtag sans le # (ex: foodmarseille)'),
      limit: z.number().min(1).max(50).default(20).describe('Nombre de résultats'),
    },
    async ({ hashtag, limit }) => {
      const results = await provider.searchByHashtag(hashtag, limit)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )

  server.tool(
    'search_tiktok_accounts',
    'Recherche des comptes TikTok par mot-clé ou nom. Utile pour trouver des créateurs food sur une ville ou région.',
    {
      query: z.string().describe('Mot-clé de recherche (ex: food marseille, restaurant aix)'),
      limit: z.number().min(1).max(30).default(10).describe('Nombre de comptes'),
    },
    async ({ query, limit }) => {
      const results = await provider.searchAccounts(query, limit)
      return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] }
    }
  )
}
