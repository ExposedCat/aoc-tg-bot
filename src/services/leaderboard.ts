import type { Database } from '../config/database.js'
import { formatItem } from './ascii.js'
import type { Member } from './member.js'
import { getMembers } from './member.js'
import { getCompletionStars } from './progress.js'

export type Change = {
  new?: boolean
  name: string
  place: number
  placeChange: number
  score: number
  scoreChange: number
  timings: Member['timings']
}

export type PlacedMember = Member & { place: number }
export function withPlaces(members: Member[]): PlacedMember[] {
  const list: PlacedMember[] = []

  const lastId = members.length === 0 ? 0 : members[members.length - 1].id
  let lastScore = -1
  let place = 0

  for (let i = 0; i < members.length; ++i) {
    const member = members[i]
    if (lastScore !== member.localScore) {
      place += 1
    }
    list.push({ ...member, place })
    if (member.id === lastId) {
      break
    }
    lastScore = member.localScore
  }

  return list
}

export function getChangesInfo(changes: Change[]) {
  let changeLines = ''
  for (const change of changes) {
    if (change.new || change.placeChange > 0 || change.scoreChange) {
      changeLines += `${change.name}`
      if (change.new) {
        changeLines += ' joined AoC'
        if (change.placeChange > 0 || change.scoreChange) {
          changeLines += ','
        }
      }
      if (change.scoreChange) {
        changeLines += ` got <b>${change.scoreChange}</b> ❄️ more`
      }
      if (change.placeChange > 0) {
        if (change.scoreChange) {
          changeLines += ' and'
        }
        changeLines += ` moved <b>${change.placeChange}</b> places up`
      } else if (change.placeChange < 0 && change.scoreChange) {
        changeLines += ` but moved <b>${Math.abs(
          change.placeChange
        )}</b> place${change.placeChange > 1 ? 's' : ''} down`
      }
      changeLines += '!\n'
    }
  }
  return changeLines
}

export async function diffLeaderboard(db: Database, current: Member[]) {
  const members = await getMembers(db)
  const oldMembers = withPlaces(members)
  const newMembers = withPlaces(current)
  const changes: Change[] = []
  let scoreChanged = false
  for (const newMember of newMembers) {
    const oldMember = oldMembers.find(
      oldMember => oldMember.id === newMember.id
    )
    if (newMember.localScore !== oldMember?.localScore) {
      scoreChanged = true
    }
    changes.push({
      new: !oldMember,
      name: newMember.name ?? `Anon ${newMember.id}`,
      place: newMember.place,
      placeChange: oldMember ? oldMember.place - newMember.place : 0,
      score: newMember.localScore,
      scoreChange: oldMember ? newMember.localScore - oldMember.localScore : 0,
      timings: newMember.timings
    })
  }
  return scoreChanged ? changes : []
}

export function buildLeaderboardString(rows: Change[]) {
  const maxPlace = rows.reduce((place, row) => Math.max(place, row.place), 0)
  const maxScore = rows.reduce((score, row) => Math.max(score, row.score), 0)
  const maxScoreChange =
    rows.reduce(
      (scoreChange, row) => Math.max(scoreChange, Math.abs(row.scoreChange)),
      0
    ) * 1000
  const maxName = rows.reduce(
    (maxName, row) => Math.max(maxName, row.name.length),
    0
  )

  const formatRow = (row: Change) => {
    const place = formatItem(row.place, maxPlace)
    const placeChange = row.placeChange
      ? row.placeChange > 0
        ? '▲'
        : '▼'
      : ' '
    const score = formatItem(row.score, maxScore)
    const scoreChange = formatItem(
      row.scoreChange > 0 ? `+${row.scoreChange}` : row.scoreChange || '',
      maxScoreChange,
      true
    )
    const name = formatItem(row.name, maxName, false, false)
    const state = getCompletionStars(row.timings).slice(-3)
    return `${place} ${placeChange} ${name} ❄️${score} ${scoreChange} ${state}`
  }

  const leaderboard = rows.map(formatRow).join('\n')
  return `<pre><code class="language-leaderboard">${leaderboard}</code></pre>`
}
