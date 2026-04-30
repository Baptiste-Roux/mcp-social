import type { Profile, Post, SocialProvider } from './types.js'

export interface HashtagPost {
  id: string
  url: string
  description: string
  username: string
  views: number
  likes: number
}

export interface AccountResult {
  username: string
  displayName: string
  followers: number
  description: string
  avatarUrl: string
}

const BASE_URL = 'https://api.scrapecreators.com/v1/tiktok'

function getHeaders(): Record<string, string> {
  return { 'x-api-key': process.env.SCRAPECREATORS_API_KEY ?? '' }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) {
    throw new Error(`TikTok API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export class TiktokProvider implements SocialProvider {
  async getProfile(username: string): Promise<Profile> {
    const data = await fetchJson<any>(`${BASE_URL}/profile?handle=${encodeURIComponent(username)}`)
    const u = data.user
    const s = data.stats
    return {
      username: u.uniqueId,
      displayName: u.nickname,
      bio: u.signature ?? '',
      followers: s.followerCount ?? 0,
      following: s.followingCount ?? 0,
      likes: s.heartCount ?? 0,
      postCount: s.videoCount ?? 0,
      isVerified: u.verified ?? false,
      avatarUrl: u.avatarMedium ?? '',
    }
  }

  async searchByHashtag(hashtag: string, limit = 20): Promise<HashtagPost[]> {
    const data = await fetchJson<any>(
      `${BASE_URL}/search/hashtag?hashtag=${encodeURIComponent(hashtag)}&limit=${limit}`
    )
    const items: any[] = data.videos ?? data.posts ?? data.items ?? data ?? []
    return items.slice(0, limit).map((v: any) => ({
      id: String(v.id ?? v.aweme_id ?? ''),
      url: v.webVideoUrl ?? v.url ?? `https://www.tiktok.com/@${v.author?.uniqueId}/video/${v.id}`,
      description: v.desc ?? v.description ?? '',
      username: v.author?.uniqueId ?? v.author?.username ?? v.username ?? '',
      views: Number(v.playCount ?? v.stats?.playCount ?? v.views ?? 0),
      likes: Number(v.diggCount ?? v.stats?.diggCount ?? v.likes ?? 0),
    }))
  }

  async searchAccounts(query: string, limit = 10): Promise<AccountResult[]> {
    const data = await fetchJson<any>(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}&type=user&limit=${limit}`
    )
    const items: any[] = data.users ?? data.accounts ?? data.items ?? data ?? []
    return items.slice(0, limit).map((u: any) => ({
      username: u.uniqueId ?? u.username ?? '',
      displayName: u.nickname ?? u.displayName ?? '',
      followers: Number(u.followerCount ?? u.followers ?? 0),
      description: u.signature ?? u.bio ?? '',
      avatarUrl: u.avatarLarger ?? u.avatarUrl ?? '',
    }))
  }

  async getPosts(username: string, limit = 10): Promise<Post[]> {
    const data = await fetchJson<any>(
      `https://api.scrapecreators.com/v3/tiktok/profile/videos?handle=${encodeURIComponent(username)}&limit=${limit}`
    )
    console.log('raw posts:', JSON.stringify(data, null, 2).slice(0, 500))
    const items: any[] = data.videos ?? data.posts ?? data.items ?? data ?? []
    return items.map((v: any) => ({
      id: String(v.id ?? v.aweme_id ?? ''),
      url: v.webVideoUrl ?? v.url ?? `https://www.tiktok.com/@${username}/video/${v.id}`,
      description: v.desc ?? v.description ?? '',
      likes: Number(v.diggCount ?? v.stats?.diggCount ?? v.likes ?? 0),
      comments: Number(v.commentCount ?? v.stats?.commentCount ?? v.comments ?? 0),
      shares: Number(v.shareCount ?? v.stats?.shareCount ?? v.shares ?? 0),
      views: Number(v.playCount ?? v.stats?.playCount ?? v.views ?? 0),
      publishedAt: v.createTime
        ? new Date(Number(v.createTime) * 1000).toISOString()
        : (v.publishedAt ?? ''),
    }))
  }
}
