import { Composer } from 'grammy'
import type { CustomContext } from '../types/context.js'
import { getMembers } from '../services/member.js'

export const leaderboardController = new Composer<CustomContext>()
leaderboardController.command('leaderboard', async ctx => {
  const members = await getMembers(ctx.db)

  await ctx.text('leaderboard', {
    members: members
      .map((member, place) =>
        ctx.i18n.t('member', {
          position: place < 3 ? ctx.i18n.t(`place.${place}`) : `${place + 1}.`,
          name: member.name ?? `Anon ${member.id}`,
          score: member.localScore
        })
      )
      .join('\n')
  })
})
