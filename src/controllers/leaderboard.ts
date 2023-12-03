import { Composer } from 'grammy'
import type { CustomContext } from '../types/context.js'
import { getMembers } from '../services/database.js'

export const leaderboardController = new Composer<CustomContext>()
leaderboardController.command('leaderboard', async ctx => {
  const members = await getMembers(ctx.db)

  const formatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  })

  await ctx.text('leaderboard', {
    members: members
      .map((member, place) =>
        ctx.i18n.t('member', {
          position: place < 3 ? ctx.i18n.t(`place.${place}`) : `${place + 1}.`,
          name: member.name ?? `Anonymous #${member.id}`,
          score: member.localScore,
          day: member.lastStar
            ? ctx.i18n.t('day', { date: formatter.format(member.lastStar) })
            : ''
        })
      )
      .join('\n')
  })
})
