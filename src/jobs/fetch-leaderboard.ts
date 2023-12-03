import type { Database } from '../config/database.js'
import { getLeaderborad } from '../services/aoc-api.js'
import { saveMembers } from '../services/database.js'

const MINUTE = 60 * 1000

export async function startFetchingLeaderboard(
  database: Database,
  interval = 15 * MINUTE
): Promise<void> {
  const job = async () => {
    try {
      const members = await getLeaderborad(process.env.LEADERBOARD_ID)
      await saveMembers(database, members)
    } catch (error) {
      console.error('Failed to save members!', error)
    }
  }
  await job()
  setInterval(job, interval)
}
