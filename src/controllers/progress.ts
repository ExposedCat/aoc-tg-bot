import { Composer } from 'grammy'
import { getMembers } from '../services/member.js'
import { buildProgressString } from '../services/progress.js'
import type { CustomContext } from '../types/context.js'

export const progressController = new Composer<CustomContext>()
progressController.command('progress', async ctx => {
  const members = await getMembers(ctx.db, 2024)
  const progress = buildProgressString(members)
  await ctx.text('progress', { progress })
})
