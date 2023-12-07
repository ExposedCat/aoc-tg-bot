import { formatItem } from './ascii.js'
import type { Member } from './member.js'

const DAY = 24 * 60 * 60 * 1_000

export function getCompletionStars(timings: Member['timings']) {
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

export function buildProgressString(members: Member[]) {
  let result = ''
  for (const member of members) {
    const progress = getCompletionStars(member.timings)
    const maxName = members.reduce(
      (maxName, member) =>
        Math.max(
          maxName,
          member.name?.length ?? 5 + member.id.toString().length
        ),
      0
    )
    const name = formatItem(
      member.name ?? `Anon ${member.id}`,
      maxName,
      false,
      false
    )
    result += `${name} ${progress}\n`
  }
  return `<pre><code class="language-progress">${result}</code></pre>`
}
