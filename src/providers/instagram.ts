import type { Profile, Post, SocialProvider } from './types.js'

const BASE_URL = 'https://api.scrapecreators.com/v1/instagram'

function getHeaders(): Record<string, string> {
  return { 'x-api-key': process.env.SCRAPECREATORS_API_KEY ?? '' }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) {
    throw new Error(`Instagram API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export class InstagramProvider implements SocialProvider {
  async getProfile(username: string): Promise<Profile> {
    const data = await fetchJson<any>(`${BASE_URL}/profile?handle=${encodeURIComponent(username)}`)
    const u = data.user ?? data
    return {
      username: u.username ?? username,
      displayName: u.full_name ?? u.displayName ?? '',
      bio: u.biography ?? u.bio ?? '',
      followers: Number(u.follower_count ?? u.followers ?? 0),
      following: Number(u.following_count ?? u.following ?? 0),
      likes: Number(u.total_likes ?? u.likes ?? 0),
      postCount: Number(u.media_count ?? u.postCount ?? 0),
      isVerified: Boolean(u.is_verified ?? u.isVerified ?? false),
      avatarUrl: u.profile_pic_url_hd ?? u.profile_pic_url ?? u.avatarUrl ?? '',
    }
  }

  async getPosts(username: string, limit = 10): Promise<Post[]> {
    const data = await fetchJson<any>(
      `${BASE_URL}/user/posts?handle=${encodeURIComponent(username)}&limit=${limit}`
    )
    const items: any[] = data.posts ?? data.items ?? data.data ?? data ?? []
    return items.map((p: any) => ({
      id: String(p.id ?? p.pk ?? ''),
      url: p.url ?? `https://www.instagram.com/p/${p.shortcode ?? p.code ?? p.id}/`,
      description: p.caption?.text ?? p.description ?? p.caption ?? '',
      likes: Number(p.like_count ?? p.likes ?? 0),
      comments: Number(p.comment_count ?? p.comments ?? 0),
      shares: Number(p.share_count ?? p.shares ?? 0),
      views: Number(p.view_count ?? p.video_view_count ?? p.views ?? 0),
      publishedAt: p.taken_at
        ? new Date(Number(p.taken_at) * 1000).toISOString()
        : (p.publishedAt ?? p.timestamp ?? ''),
    }))
  }
}
