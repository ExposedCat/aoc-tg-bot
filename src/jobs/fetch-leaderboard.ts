import type { I18n } from '@grammyjs/i18n'
import type { Database } from '../config/database.js'
import { getLeaderborad } from '../services/aoc-api.js'
import { getGroups } from '../services/group.js'
import {
  buildLeaderboardString,
  changesToString,
  diffLeaderboard
} from '../services/leaderboard.js'
import { saveMembers } from '../services/member.js'
import type { Bot } from '../types/telegram.js'

const MINUTE = 60 * 1000

export async function startFetchingLeaderboard(
  database: Database,
  bot: Bot,
  i18n: I18n,
  interval = 15 * MINUTE
): Promise<void> {
  const job = async () => {
    try {
      // TODO: all years
      const currentMembers = await getLeaderborad(
        process.env.LEADERBOARD_ID,
        2024
      )
      const changes = await diffLeaderboard(database, 2024, currentMembers)
      await saveMembers(database, 2024, currentMembers)
      if (
        changes.some(
          change =>
            change.flakeChange || change.starChange || change.placeChange
        )
      ) {
        const groups = await getGroups(database)
        const stringLeaderboard = buildLeaderboardString(changes)
        const changeLines = changesToString(changes)
        const text = i18n.t('en', 'leaderboard', {
          leaderboard: `${changeLines}\n${stringLeaderboard}`
        })
        for (const group of groups) {
          try {
            await bot.api.sendMessage(group.id, text, { parse_mode: 'HTML' })
          } catch {
            console.error(`Failed to notify chat ${group.id}!`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to save members:', error)
    }
  }
  await job()
  setInterval(job, interval)
}
