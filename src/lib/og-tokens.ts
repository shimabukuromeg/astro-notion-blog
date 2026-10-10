import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// Resolve the installed Primer Brand CSS, including its wide typography scale.
// OGP has a fixed 1200px canvas, independent of a reader's viewport or theme.
const require = createRequire(import.meta.url)
const css = readFileSync(
  join(dirname(require.resolve('@primer/react-brand')), 'css/main.css'),
  'utf8'
)
const values = new Map<string, string>()
const declarations = (source: string, overwrite = false) => {
  for (const [, name, value] of source.matchAll(
    /(--[\w-]+)\s*:\s*([^;{}]+);/g
  )) {
    if (overwrite || !values.has(name)) values.set(name, value.trim())
  }
}
declarations(css)
for (const [, width, body] of css.matchAll(
  /@media\s*\(min-width:\s*(\d+)px\)\s*\{\s*:root\s*\{([^}]+)\}/g
)) {
  if (Number(width) <= 1200) declarations(body, true)
}
const token = (name: string): string => {
  const value = values.get(name)
  if (!value) throw new Error(`Missing Primer OGP token: ${name}`)
  return value.replace(/var\((--[\w-]+)\)/g, (_, reference) => token(reference))
}
const number = (name: string) => {
  const value = token(name)
  const pixels = (part: string) =>
    parseFloat(part) * (part.trim().endsWith('rem') ? 16 : 1)
  const result = value.startsWith('max(')
    ? Math.max(...value.slice(4, -1).split(',').map(pixels))
    : pixels(value)
  if (!Number.isFinite(result))
    throw new Error(`Unsupported Primer OGP token: ${name}=${value}`)
  return result
}
export const ogTokens = {
  color: {
    canvas: token('--brand-color-canvas-default'),
    subtle: token('--brand-color-canvas-subtle'),
    text: token('--brand-color-text-default'),
    muted: token('--brand-color-text-muted'),
    border: token('--brand-color-border-subtle'),
  },
  space: Object.fromEntries(
    [8, 16, 24, 32, 48, 64].map((size) => [size, number(`--base-size-${size}`)])
  ) as Record<number, number>,
  radius: number('--brand-borderRadius-medium'),
  borderWidth: number('--brand-borderWidth-thin'),
  normalWeight: number('--base-text-weight-normal') as 450,
  semiboldWeight: number('--base-text-weight-semibold') as 600,
  text: (size: number) => number(`--brand-text-size-${size}`),
  heading: (size: number) => ({
    fontSize: number(`--brand-text-size-${size}`),
    fontWeight: number(`--brand-heading-weight-${size}`) as 600,
    lineHeight: number(
      `--brand-${size === 700 ? 'heading' : 'text'}-lineHeight-${size}`
    ),
    letterSpacing:
      number(`--brand-heading-letterSpacing-${size}`) *
      number(`--brand-text-size-${size}`),
  }),
}
