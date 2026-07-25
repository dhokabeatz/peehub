import crypto from 'node:crypto'

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

  return {
    label,
    host,
    normalizedHost,
    database,
    fingerprint: fingerprint(
      JSON.stringify({
        protocol: url.protocol,
        host,
        port: url.port || '',
        database,
        schema,
      }),
    ),
    logicalFingerprint: fingerprint(
      JSON.stringify({
        host: normalizedHost,
        database,
        schema,
      }),
    ),
  }
}

const pooled = describeConnection('DATABASE_URL', process.env.DATABASE_URL)
const direct = describeConnection('DIRECT_URL', process.env.DIRECT_URL)

console.log(
  JSON.stringify(
    {
      pooled,
      direct,
    },
    null,
    2,
  ),
)

if (pooled.logicalFingerprint !== direct.logicalFingerprint) {
  throw new Error('Production pooled and direct connections do not point to the same logical database')
}
