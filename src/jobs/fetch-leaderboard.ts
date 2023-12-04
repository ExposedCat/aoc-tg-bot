import type { Database } from '../config/database.js'
import { getLeaderborad } from '../services/aoc-api.js'
import { getGroups } from '../services/group.js'
import {
  diffLeaderboard,
  buildLeaderboardString,
  getChangesInfo
} from '../services/leaderboard.js'
import { saveMembers } from '../services/member.js'
import type { Bot } from '../types/telegram.js'

const MINUTE = 60 * 1000

export async function startFetchingLeaderboard(
  database: Database,
  bot: Bot,
  interval = 15 * MINUTE
): Promise<void> {
  const job = async () => {
    try {
      const currentMembers = await getLeaderborad(process.env.LEADERBOARD_ID)
      const changes = await diffLeaderboard(database, currentMembers)
      await saveMembers(database, currentMembers)
      if (changes.length) {
        const groups = await getGroups(database)
        const stringLeaderboard = buildLeaderboardString(changes)
        const changeLines = getChangesInfo(changes)
        for (const group of groups) {
          await bot.api.sendMessage(
            group.id,
            `${changeLines}\n<pre><code class="language-leaderboard">${stringLeaderboard}</code></pre>`,
            { parse_mode: 'HTML' }
          )
        }
      }
    } catch (error) {
      console.error('Failed to save members!', error)
    }
  }
  await job()
  setInterval(job, interval)
}
