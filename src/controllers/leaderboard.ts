import { Composer } from 'grammy'
import type { CustomContext } from '../types/context.js'
import { getMembers } from '../services/member.js'
import { buildLeaderboardString, withPlaces } from '../services/leaderboard.js'

export const leaderboardController = new Composer<CustomContext>()
leaderboardController.command('leaderboard', async ctx => {
  const members = await getMembers(ctx.db)

  const leaderboard = buildLeaderboardString(
    withPlaces(members).map(member => ({
      name: member.name ?? `Anon ${member.id}`,
      timings: member.timings,
      new: false,
      score: member.flakes,
      scoreChange: 0,
      place: member.place,
      placeChange: 0
    }))
  )

  await ctx.text('leaderboard', { leaderboard })
})
