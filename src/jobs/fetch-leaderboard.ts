import type { I18n } from '@grammyjs/i18n'
import type { Database } from '../config/database.js'
import { getLeaderborad } from '../services/aoc-api.js'
import { getGroups } from '../services/group.js'
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
      const members = await getLeaderborad(process.env.LEADERBOARD_ID)
      const changes = await saveMembers(database, members)
      if (changes.length) {
        const groups = await getGroups(database)
        for (const group of groups) {
          await bot.api.sendMessage(
            group.id,
            i18n.t('en', 'change', {
              members: changes
                .map(change =>
                  i18n.t('en', change.new ? 'newMember' : 'memberChange', {
                    name: change.name ?? `Anonymous #${change.id}`,
                    score: change.change
                  })
                )
                .join('\n')
            }),
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
