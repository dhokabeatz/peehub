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
  const host = url.hostname
  const normalizedHost = normalizeHost(host)
  const database = url.pathname.replace(/^\//, '')
  const schema = url.searchParams.get('schema') || 'public(default)'
  const fullIdentity = JSON.stringify({
    protocol: url.protocol,
    host,
    port: url.port || '',
    database,
    schema,
  })
  const logicalIdentity = JSON.stringify({
    host: normalizedHost,
    database,
    schema,
  })

  return {
    host,
    normalizedHost,
    database,
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
          host: connA.host,
          normalizedHost: connA.normalizedHost,
          database: connA.database,
          logicalFingerprint: connA.logicalFingerprint,
        },
        [labelB]: {
          host: connB.host,
          normalizedHost: connB.normalizedHost,
          database: connB.database,
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

function assertLogicalSeparation(preview, production) {
  console.log(
    JSON.stringify(
      {
        kind: 'LOGICAL_SEPARATION',
        preview: {
          normalizedHost: preview.normalizedHost,
          database: preview.database,
          logicalFingerprint: preview.logicalFingerprint,
        },
        production: {
          normalizedHost: production.normalizedHost,
          database: production.database,
          logicalFingerprint: production.logicalFingerprint,
        },
      },
      null,
      2,
    ),
  )

  if (preview.logicalFingerprint === production.logicalFingerprint) {
    throw new Error('Preview and production logical databases are identical')
  }
}

const preview = parseEnvFile(previewEnvFile)
const production = parseEnvFile(productionEnvFile)

const previewDatabase = describeConnection('Preview DATABASE_URL', preview.DATABASE_URL)
const previewDirect = describeConnection('Preview DIRECT_URL', preview.DIRECT_URL)
const productionDatabase = describeConnection('Production DATABASE_URL', production.DATABASE_URL)
const productionDirect = describeConnection('Production DIRECT_URL', production.DIRECT_URL)

assertSharedLogicalDatabase('previewDatabase', previewDatabase, 'previewDirect', previewDirect)
assertSharedLogicalDatabase('productionDatabase', productionDatabase, 'productionDirect', productionDirect)
assertLogicalSeparation(previewDatabase, productionDatabase)

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
