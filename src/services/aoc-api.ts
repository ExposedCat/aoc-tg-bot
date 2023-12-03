const ENDPOINT = 'https://adventofcode.com/2023/leaderboard/private/view'

type APIResponse = {
  event: string
  owner_id: number
  members: Record<
    string,
    {
      global_score: number
      name: string | null
      last_star_ts: number
      stars: number
      local_score: number
      id: number
    }
  >
}

export type Member = {
  id: number
  name: string | null
  lastStar: Date | null
  stars: number
  localScore: number
}

export async function getLeaderborad(id: string): Promise<Member[] | []> {
  try {
    const response = await fetch(`${ENDPOINT}/${id}.json`, {
      headers: { Cookie: `session=${process.env.SESSION}` }
    })
    const data: APIResponse = await response.json()

    return Object.values(data.members)
      .map(member => ({
        id: member.id,
        name: member.name,
        lastStar: member.last_star_ts
          ? new Date(member.last_star_ts * 1000)
          : null,
        stars: member.stars,
        localScore: member.local_score
      }))
      .sort((a, b) => b.localScore - a.localScore)
  } catch (error) {
    console.error('Failed to fetch leaderboard!', error)
    return []
  }
}
