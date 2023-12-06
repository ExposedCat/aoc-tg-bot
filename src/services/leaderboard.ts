import type { Database } from '../config/database.js'
import type { Member } from './member.js'
import { getMembers } from './member.js'

const DAY = 24 * 60 * 60 * 1_000

export type Change = {
  new?: boolean
  name: string
  placeChange: number
  score: number
  scoreChange: number
  timings: Member['timings']
}

function getCompletionStars(timings: Member['timings']) {
  const lastDay = Math.min(
    31,
    Math.ceil((Number(new Date()) - Number(new Date(2023, 11, 1))) / DAY)
  )

  const completed = timings.map(timing => `${timing.day}.${timing.task}`)

  let stars = ''
  for (let day = 1; day <= lastDay; ++day) {
    stars += completed.includes(`${day}.2`)
      ? '*'
      : completed.includes(`${day}.1`)
        ? '.'
        : ' '
  }
  return stars
}

function withPlaces(members: Member[]): (Member & { place: number })[] {
  return members.map((member, i) => ({ ...member, place: i + 1 }))
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
  const oldMembers = withPlaces(await getMembers(db))
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
      placeChange: oldMember ? oldMember.place - newMember.place : 0,
      score: newMember.localScore,
      scoreChange: oldMember ? newMember.localScore - oldMember.localScore : 0,
      timings: newMember.timings
    })
  }
  return scoreChanged ? changes : []
}

export function buildLeaderboardString(rows: Change[]) {
  const maxPlace = rows.length
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

  const formatItem = (
    item: string | number,
    maxLength: number,
    brackets = false,
    convert = true
  ) => {
    const value = item !== '' ? (brackets ? `(${item})` : item.toString()) : ''
    return `${value}${' '.repeat(
      (convert ? maxLength.toString().length : maxLength) - value.length
    )}`
  }

  const formatRow = (row: Change, index: number) => {
    const place = formatItem(index + 1, maxPlace)
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
    const state = getCompletionStars(row.timings)
    return `${place} ${placeChange} ${name} ❄️${score} ${scoreChange} ${state}`
  }

  const leaderboard = rows.map(formatRow).join('\n')
  return `<pre><code class="language-leaderboard">${leaderboard}</code></pre>`
}
