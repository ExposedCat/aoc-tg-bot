import type { Member } from './member.js'

type ApiResponse = {
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
      completion_day_level: Record<
        string,
        Record<
          string,
          {
            star_index: number
            get_star_ts: number
          }
        >
      >
    }
  >
}

export async function getLeaderborad(id: string, year: number) {
  try {
    const response = await fetch(
      `https://adventofcode.com/${year}/leaderboard/private/view/${id}.json`,
      { headers: { Cookie: `session=${process.env.SESSION}` } }
    )
    const data: ApiResponse = await response.json()

    return Object.values(data.members)
      .map(member => ({
        id: member.id,
        name: member.name,
        timings: Object.entries(member.completion_day_level).flatMap(
          ([day, tasks]) =>
            Object.entries(tasks).map(([task, data]) => ({
              day: Number(day),
              task: Number(task),
              date: new Date(data.get_star_ts * 1000)
            }))
        ),
        stars: member.stars,
        flakes: member.local_score
      }))
      .sort((a, b) => b.flakes - a.flakes)
  } catch (error) {
    console.error('Failed to fetch leaderboard!', error)
    return []
  }
}
