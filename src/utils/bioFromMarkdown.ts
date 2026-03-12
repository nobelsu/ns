const markdownFiles = import.meta.glob('../content/bio.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function getBioThreeParts(): { intro: string; middle: string; tail: string } {
  const raw = (Object.values(markdownFiles)[0] ?? '').trim()

  if (!raw) {
    return { intro: '', middle: '', tail: '' }
  }

  const firstSep = raw.indexOf('\n---')
  if (firstSep === -1) {
    return { intro: raw, middle: '', tail: '' }
  }

  const secondSep = raw.indexOf('\n---', firstSep + 4)

  if (secondSep === -1) {
    return {
      intro: raw.slice(0, firstSep).trim(),
      middle: raw.slice(firstSep).replace(/^---+/, '').trim(),
      tail: '',
    }
  }

  const intro = raw.slice(0, firstSep).trim()
  const middle = raw
    .slice(firstSep + 4, secondSep)
    .replace(/^---+/, '')
    .trim()
  const tail = raw.slice(secondSep).replace(/^---+/, '').trim()

  return { intro, middle, tail }
}

export function getBioParts(): { intro: string; rest: string } {
  const { intro, middle, tail } = getBioThreeParts()
  const rest = [middle, tail].filter(Boolean).join('\n\n')
  return { intro, rest }
}

export function getBioMarkdown(): string {
  const first = Object.values(markdownFiles)[0]
  return (first ?? '').trim()
}

