import fs from 'node:fs'
import crypto from 'node:crypto'

const [previewEnvFile, productionEnvFile] = process.argv.slice(2)

if (!previewEnvFile || !productionEnvFile) {
  console.error('Usage: node scripts/ci/check-db-separation.mjs <preview-env-file> <production-env-file>')
  process.exit(1)
}

function parseEnvFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const vars = {}

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex < 0) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    vars[key] = value
  }

  return vars
}

function describeConnection(label, value) {
  if (!value) {
    throw new Error(`${label} is missing`)
  }

  const url = new URL(value)
  const normalized = JSON.stringify({
    protocol: url.protocol,
    host: url.hostname,
    port: url.port || '',
    database: url.pathname.replace(/^\//, ''),
    schema: url.searchParams.get('schema') || 'public(default)',
  })

  return {
    host: url.hostname,
    database: url.pathname.replace(/^\//, ''),
    schema: url.searchParams.get('schema') || 'public(default)',
    fingerprint: crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 12),
  }
}

function compareConnections(kind, preview, production) {
  console.log(
    JSON.stringify(
      {
        kind,
        preview,
        production,
      },
      null,
      2,
    ),
  )

  if (preview.fingerprint === production.fingerprint) {
    throw new Error(`${kind} preview and production fingerprints are identical`)
  }
}

const preview = parseEnvFile(previewEnvFile)
const production = parseEnvFile(productionEnvFile)

compareConnections(
  'DATABASE_URL',
  describeConnection('Preview DATABASE_URL', preview.DATABASE_URL),
  describeConnection('Production DATABASE_URL', production.DATABASE_URL),
)

compareConnections(
  'DIRECT_URL',
  describeConnection('Preview DIRECT_URL', preview.DIRECT_URL),
  describeConnection('Production DIRECT_URL', production.DIRECT_URL),
)
