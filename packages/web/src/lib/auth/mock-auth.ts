export function isLocalAuthHost(hostname: string | null | undefined) {
  if (!hostname) {
    return false
  }

  const rawHost = hostname.split(',')[0]?.trim().toLowerCase()

  if (!rawHost) {
    return false
  }

  const normalizedHostname = rawHost.startsWith('[')
    ? rawHost.slice(1, rawHost.indexOf(']'))
    : rawHost.split(':')[0]

  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1'
  )
}
