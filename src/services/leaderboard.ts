import type { Database } from '../config/database.js'
import type { Member } from './aoc-api.js'
import { getMembers } from './member.js'

export type Change = {
  new?: boolean
  name: string
  placeChange: number
  score: number
  scoreChange: number
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
        )}</b> places down`
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
      scoreChange: oldMember ? newMember.localScore - oldMember.localScore : 0
    })
  }
  return scoreChanged ? changes : []
}

export function buildLeaderboardString(rows: Change[]) {
  const maxPlace = rows.length
  const maxPlaceChange =
    rows.reduce(
      (placeChange, row) => Math.max(placeChange, Math.abs(row.placeChange)),
      0
    ) * 1000
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
    const placeChange = formatItem(
      row.placeChange > 0 ? `+${row.placeChange}` : row.placeChange || '',
      maxPlaceChange,
      true
    )
    const score = formatItem(row.score, maxScore)
    const scoreChange = formatItem(
      row.scoreChange > 0 ? `+${row.scoreChange}` : row.scoreChange || '',
      maxScoreChange,
      true
    )
    const name = formatItem(row.name, maxName, false, false)
    return `${place} ${placeChange}  ${name}  ❄️${score} ${scoreChange}`
  }

  return rows.map(formatRow).join('\n')
}
