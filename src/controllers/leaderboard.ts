import { Composer } from 'grammy'
import {
  buildLeaderboardString,
  diffLeaderboard
} from '../services/leaderboard.js'
import { getMembers } from '../services/member.js'
import type { CustomContext } from '../types/context.js'

export const leaderboardController = new Composer<CustomContext>()
leaderboardController.command('leaderboard', async ctx => {
  // TODO: all years
  const members = await getMembers(ctx.db, 2024)
  const diff = await diffLeaderboard(ctx.db, 2024, members)
  const leaderboard = buildLeaderboardString(diff)

  await ctx.text('leaderboard', { leaderboard })
})
