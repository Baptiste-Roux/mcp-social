export interface Profile {
  username: string
  displayName: string
  bio: string
  followers: number
  following: number
  likes: number
  postCount: number
  isVerified: boolean
  avatarUrl: string
}

export interface Post {
  id: string
  url: string
  description: string
  likes: number
  comments: number
  shares: number
  views: number
  publishedAt: string
}

export interface SocialProvider {
  getProfile(username: string): Promise<Profile>
  getPosts(username: string, limit?: number): Promise<Post[]>
}
