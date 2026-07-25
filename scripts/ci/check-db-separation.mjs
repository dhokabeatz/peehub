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

function fingerprint(value) {
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 12)
}

function normalizeHost(hostname) {
  return hostname.replace(/-pooler(?=\.)/, '')
}

function describeConnection(label, value) {
  if (!value) {
    throw new Error(`${label} is missing`)
  }

  const url = new URL(value)
  const fullIdentity = JSON.stringify({
    protocol: url.protocol,
    host: url.hostname,
    port: url.port || '',
    database: url.pathname.replace(/^\//, ''),
    schema: url.searchParams.get('schema') || 'public(default)',
  })
  const logicalIdentity = JSON.stringify({
    host: normalizeHost(url.hostname),
    database: url.pathname.replace(/^\//, ''),
    schema: url.searchParams.get('schema') || 'public(default)',
  })

  return {
    fingerprint: fingerprint(fullIdentity),
    logicalFingerprint: fingerprint(logicalIdentity),
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

function assertSharedLogicalDatabase(labelA, connA, labelB, connB) {
  console.log(
    JSON.stringify(
      {
        kind: 'PREVIEW_LOGICAL_DATABASE',
        [labelA]: {
          logicalFingerprint: connA.logicalFingerprint,
        },
        [labelB]: {
          logicalFingerprint: connB.logicalFingerprint,
        },
      },
      null,
      2,
    ),
  )

  if (connA.logicalFingerprint !== connB.logicalFingerprint) {
    throw new Error(`${labelA} and ${labelB} do not point to the same logical database`)
  }
}

const preview = parseEnvFile(previewEnvFile)
const production = parseEnvFile(productionEnvFile)

const previewDatabase = describeConnection('Preview DATABASE_URL', preview.DATABASE_URL)
const previewDirect = describeConnection('Preview DIRECT_URL', preview.DIRECT_URL)
const productionDatabase = describeConnection('Production DATABASE_URL', production.DATABASE_URL)
const productionDirect = describeConnection('Production DIRECT_URL', production.DIRECT_URL)

assertSharedLogicalDatabase('previewDatabase', previewDatabase, 'previewDirect', previewDirect)

compareConnections(
  'DATABASE_URL',
  previewDatabase,
  productionDatabase,
)

compareConnections(
  'DIRECT_URL',
  previewDirect,
  productionDirect,
)
