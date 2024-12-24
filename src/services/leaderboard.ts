import type { Database } from '../config/database.js'
import { formatItem } from './ascii.js'
import type { FlatMember, Member } from './member.js'
import { getMembers } from './member.js'
import { getCompletionStars } from './progress.js'

export type Change = Pick<FlatMember, 'flakes' | 'timings'> & {
  new: boolean
  quit: boolean
  name: string
  place: number
  placeChange: number
  starChange: number
  flakeChange: number
}

export function changesToString(changes: Change[]) {
  let lines = ''
  for (const change of changes) {
    lines += `${change.name} `
    if (change.new) {
      lines += `joined AoC`
    } else if (change.quit) {
      lines += `quit AoC`
    } else if (change.flakeChange || change.starChange || change.placeChange) {
      if (change.starChange || change.flakeChange) lines += `got `
      if (change.starChange) {
        lines += `${change.starChange}<code>★</code> `
      }
      if (change.flakeChange) {
        lines += `${change.flakeChange}<code>❆</code> `
      }
      if (change.placeChange) {
        lines += `${change.starChange || change.flakeChange ? 'and ' : ''}moved ${Math.abs(change.placeChange)}<code>${change.placeChange > 0 ? '▲' : '▼'}</code> `
      }
    }
    lines += `\n`
  }
  return lines
}

export function buildLeaderboardString(changes: Change[]) {
  const [maxPlace, maxFlakes] = changes.reduce(
    ([place, flakes], row) => [
      Math.max(place, row.place),
      Math.max(flakes, row.flakes)
    ],
    [0, 0]
  )
  const maxFlakesChange =
    changes.reduce(
      (scoreChange, row) => Math.max(scoreChange, Math.abs(row.flakeChange)),
      0
    ) * 1000
  const maxName = changes.reduce(
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
    const score = formatItem(row.flakes, maxFlakes)
    const scoreChange = formatItem(
      row.flakeChange > 0 ? `+${row.flakeChange}` : row.flakeChange || '',
      maxFlakesChange,
      true
    )
    const name = formatItem(row.name, maxName, false, false)
    const state = getCompletionStars(row.timings).slice(-3)
    return `${place} ${placeChange} ${name} ❄️${score} ${scoreChange} ${state}`
  }

  const leaderboard = changes.map(formatRow).join('\n')
  return `<pre><code class="language-leaderboard">${leaderboard}</code></pre>`
}

export async function diffLeaderboard(
  db: Database,
  year: number,
  members: FlatMember[]
): Promise<Change[]> {
  const withPlaces = (members: FlatMember[]) =>
    members.map(member => ({
      ...member,
      place: members.reduce(
        (place, another) => place + Number(another.flakes > member.flakes),
        1
      )
    }))
  const oldMembers = withPlaces(await getMembers(db, year))
  const currentMembers = withPlaces(members)
  const changes: Change[] = currentMembers
    .filter(member => !oldMembers.some(old => old.id === member.id))
    .map(member => ({
      new: true,
      quit: false,
      name: member.name ?? member.id.toString(),
      place: member.place,
      flakes: member.flakes,
      timings: member.timings,
      placeChange: member.place,
      starChange: member.stars,
      flakeChange: member.flakes
    }))
  for (const member of oldMembers) {
    const updated = currentMembers.find(current => current.id === member.id)
    if (
      !updated ||
      updated.flakes !== member.flakes ||
      updated.stars !== member.stars ||
      updated.place !== member.place
    ) {
      changes.push({
        new: false,
        quit: !updated,
        name: member.name ?? member.id.toString(),
        place: updated?.place ?? 0,
        flakes: updated?.flakes ?? 0,
        timings: updated?.timings ?? [],
        placeChange: updated ? member.place - updated.place : 0,
        flakeChange: updated ? updated.flakes - member.flakes : 0,
        starChange: updated ? updated.stars - member.stars : 0
      })
    }
  }
  return changes.sort((a, b) => a.place - b.place)
}
