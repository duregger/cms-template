import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = '/Users/samduregger/Sites/cafe-rio-cms/Vertex'
const OUT = join(__dirname, '../scratch/vertex.tokens.json')

function load(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'))
}

function toHex(val) {
  if (typeof val === 'string') return val
  if (typeof val === 'number') return val
  if (!val || typeof val !== 'object') return String(val)
  if (typeof val.hex === 'string') {
    const hex = val.hex.startsWith('#') ? val.hex : `#${val.hex}`
    if (val.alpha != null && val.alpha < 1) {
      return hex + Math.round(val.alpha * 255).toString(16).padStart(2, '0')
    }
    return hex
  }
  if (Array.isArray(val.components)) {
    const [r, g, b] = val.components
    const hex =
      '#' +
      [r, g, b]
        .map((c) => Math.round(Number(c) * 255).toString(16).padStart(2, '0'))
        .join('')
    if (val.alpha != null && val.alpha < 1) {
      return hex + Math.round(val.alpha * 255).toString(16).padStart(2, '0')
    }
    return hex
  }
  return String(val)
}

function flatten(obj, prefix = '', out = {}) {
  if (!obj || typeof obj !== 'object') return out
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$extensions' || k === '$description') continue
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && '$value' in v) {
      out[key] = v.$value
    } else if (v && typeof v === 'object') {
      flatten(v, key, out)
    }
  }
  return out
}

function camelScale(name) {
  return name
    .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
}

function tokenName(path) {
  return path
    .replace(/[()]/g, '')
    .replace(/%/g, '')
    .replace(/\s+/g, '-')
    .replace(/\./g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function px(n) {
  if (typeof n === 'string' && n.endsWith('px')) return n
  return `${n}px`
}

function colorScales(raw) {
  const scales = {}
  for (const [name, ramp] of Object.entries(raw)) {
    if (name === '$extensions' || !ramp || typeof ramp !== 'object') continue
    const out = {}
    for (const [step, token] of Object.entries(ramp)) {
      if (step === '$extensions') continue
      if (token && typeof token === 'object' && '$value' in token) {
        out[String(step).replace(/%/g, '')] = toHex(token.$value)
      }
    }
    if (Object.keys(out).length) scales[camelScale(name)] = out
  }
  return scales
}

function resolveAliases(map) {
  const resolved = { ...map }
  let changed = true
  let guard = 0
  while (changed && guard++ < 12) {
    changed = false
    for (const [k, v] of Object.entries(resolved)) {
      if (typeof v !== 'string') continue
      const m = v.match(/^\{(.+)\}$/)
      if (!m) continue
      const target = resolved[m[1]]
      if (typeof target === 'string' && !target.startsWith('{')) {
        resolved[k] = target
        changed = true
      }
    }
  }
  return resolved
}

function semanticFromMapped(raw, prefix = '') {
  const flat = flatten(raw)
  const hexed = {}
  for (const [k, v] of Object.entries(flat)) {
    hexed[k] = typeof v === 'string' && v.startsWith('{') ? v : toHex(v)
  }
  const resolved = resolveAliases(hexed)
  const semantic = {}
  for (const [k, v] of Object.entries(resolved)) {
    if (typeof v !== 'string') continue
    const name = tokenName(`${prefix}${k}`)
    if (v.startsWith('{')) {
      semantic[name] = { type: 'ref', ref: tokenName(`${prefix}${v.slice(1, -1)}`) }
    } else {
      semantic[name] = { type: 'value', value: v }
    }
  }
  return semantic
}

const primitives = colorScales(load('Mode 1.tokens.json'))
const lightPalette = colorScales(load('Light mode.tokens.json'))
const scales = { ...primitives, ...lightPalette }

const semantic = {
  ...semanticFromMapped(load('color - mapped/Light mode.tokens.json')),
  ...semanticFromMapped(load('color - mapped/Dark mode.tokens.json'), 'dark.'),
  primary: { type: 'ref', ref: 'primary.500' },
  background: { type: 'ref', ref: 'surface-page' },
  fontColor: { type: 'ref', ref: 'text-title' },
  white: { type: 'value', value: '#FFFFFF' },
  black: { type: 'value', value: '#000000' },
}

const spaceRaw = flatten(load('Mode 1.tokens 2.json'))
const spaceNamed = flatten(load('Mode 1.tokens 4.json'))
const spacing = {}
for (const [k, v] of Object.entries(spaceRaw)) spacing[k] = px(v)
for (const [k, v] of Object.entries(spaceNamed)) spacing[k] = px(v)

const radiusRaw = flatten(load('Mode 1.tokens 3.json'))
const borderRadius = {}
for (const [k, v] of Object.entries(radiusRaw)) borderRadius[k] = px(v)

const strokeFile = flatten(load('Mode 1.tokens 5.json'))
const stroke = {}
const icons = {}
for (const [k, v] of Object.entries(strokeFile)) {
  if (k.startsWith('icons.')) {
    const size = k.replace('icons.', '')
    icons[`icon-${size.replace('px', '')}`] = { fontSize: size.endsWith('px') ? size : px(size) }
    stroke[`icon-${size.replace('px', '')}`] = px(v)
  } else {
    stroke[tokenName(k.replace(/^border\./, ''))] = px(v)
  }
}

const typeRaw = flatten(load('Mode 1.tokens 6.json'))
const sizeMap = {
  'Display - 1': 'display1',
  'Display - 2': 'display2',
  'Display - 3': 'display3',
  'Headline - 1': 'headline1',
  'Headline - 2': 'headline2',
  'Headline - 3': 'headline3',
  'Text - xl': 'textXl',
  'Text - lg': 'textLg',
  'Text - md': 'textMd',
  'Text - sm': 'textSm',
  'Text - xs': 'textXs',
  'Text - xxs': 'textXxs',
}
const familyFor = (name) => {
  if (name.startsWith('display')) return 'display'
  if (name.startsWith('headline')) return 'heading'
  return 'regular'
}

const scale = {}
for (const [label, key] of Object.entries(sizeMap)) {
  const size = typeRaw[`Size.${label}`]
  const lh = typeRaw[`Line Height.${label}`]
  if (size == null) continue
  scale[key] = {
    fontFamily: familyFor(key),
    fontSize: px(size),
    fontWeight: key.startsWith('text') ? 400 : 700,
    lineHeight: lh != null ? px(lh) : '120%',
    letterSpacing: '0',
    textDecoration: 'none',
  }
}

const desktop = flatten(load('scale - grid _ frame /Desktop.tokens.json'))
const tablet = flatten(load('scale - grid _ frame /Tablet.tokens.json'))
const mobile = flatten(load('scale - grid _ frame /Mobile.tokens.json'))

const layout = {
  'grid-min': px(desktop.min),
  'grid-max': px(desktop.max),
  'grid-margin': px(desktop.margin),
  'grid-gutter': px(desktop.gutter),
  'grid-columns': String(desktop.columns),
  'grid-min-md': px(tablet.min),
  'grid-max-md': px(tablet.max),
  'grid-margin-md': px(tablet.margin),
  'grid-gutter-md': px(tablet.gutter),
  'grid-columns-md': String(tablet.columns),
  'grid-min-sm': px(mobile.min),
  'grid-max-sm': px(mobile.max),
  'grid-margin-sm': px(mobile.margin),
  'grid-gutter-sm': px(mobile.gutter),
  'grid-columns-sm': String(mobile.columns),
}

const tokens = {
  colors: { ...scales, semantic },
  sizing: {
    layout,
    spacing,
    'border-radius': borderRadius,
    stroke,
  },
  typography: {
    fontFamilies: {
      regular: "'Inter', sans-serif",
      heading: "'Inter', sans-serif",
      display: "'Outfit', sans-serif",
      sans: "'Inter', sans-serif",
    },
    scale,
    icons,
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(tokens, null, 2) + '\n')
console.log('wrote', OUT)
console.log('scales', Object.keys(scales).length, Object.keys(scales).join(', '))
console.log('semantic', Object.keys(semantic).length)
console.log('spacing', Object.keys(spacing).length)
console.log('type', Object.keys(scale).join(', '))
