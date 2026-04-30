import type { Profile, Post, SocialProvider } from './types.js'

export interface HashtagPost {
  id: string
  url: string
  description: string
  username: string
  views: number
  likes: number
  comments: number
  shares: number
  publishedAt: string
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
    const items = data.aweme_list ?? []
    return items.slice(0, limit).map((item: any) => ({
      id: item.aweme_id,
      url: `https://www.tiktok.com/@${item.author?.unique_id}/video/${item.aweme_id}`,
      description: item.desc ?? '',
      likes: item.statistics?.digg_count ?? 0,
      comments: item.statistics?.comment_count ?? 0,
      shares: item.statistics?.share_count ?? 0,
      views: item.statistics?.play_count ?? 0,
      publishedAt: new Date(item.create_time * 1000).toISOString(),
      username: item.author?.unique_id ?? '',
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
    const items = data.aweme_list ?? []
    return items.map((item: any) => ({
      id: item.aweme_id,
      url: `https://www.tiktok.com/@${username}/video/${item.aweme_id}`,
      description: item.desc ?? '',
      likes: item.statistics?.digg_count ?? 0,
      comments: item.statistics?.comment_count ?? 0,
      shares: item.statistics?.share_count ?? 0,
      views: item.statistics?.play_count ?? 0,
      publishedAt: new Date(item.create_time * 1000).toISOString(),
    }))
  }
}
