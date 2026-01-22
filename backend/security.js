const dns = require('dns').promises
const { URL } = require('url')

// Private IP ranges to block (SSRF protection)
const PRIVATE_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
  /^192\.168\./,               // Class C private
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^224\./,                    // Multicast
  /^240\./,                    // Reserved
  /^::1$/,                     // IPv6 loopback
  /^fc00:/i,                   // IPv6 private
  /^fe80:/i,                   // IPv6 link-local
  /^localhost$/i               // localhost hostname
]

/**
 * Check if an IP address is private/internal
 */
function isPrivateIP(ip) {
  return PRIVATE_RANGES.some(range => range.test(ip))
}

/**
 * Validate and sanitize a DNS URL for Xtream Codes API
 * Returns sanitized URL or throws an error
 */
async function validateDnsUrl(inputUrl) {
  // Ensure URL has protocol
  let urlStr = inputUrl.trim()
  if (!urlStr.match(/^https?:\/\//i)) {
    urlStr = 'http://' + urlStr
  }

  let parsed
  try {
    parsed = new URL(urlStr)
  } catch (e) {
    throw new Error('Invalid URL format')
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS protocols allowed')
  }

  // Block obviously bad hostnames
  if (isPrivateIP(parsed.hostname)) {
    throw new Error('Private/internal addresses not allowed')
  }

  // Resolve hostname to IP and check if private
  try {
    const addresses = await dns.resolve4(parsed.hostname).catch(() => [])
    const addresses6 = await dns.resolve6(parsed.hostname).catch(() => [])
    const allAddresses = [...addresses, ...addresses6]
    
    for (const addr of allAddresses) {
      if (isPrivateIP(addr)) {
        throw new Error('Private/internal addresses not allowed')
      }
    }
  } catch (err) {
    if (err.message.includes('Private')) throw err
    // DNS resolution might fail for valid external hosts, allow to continue
  }

  // Return normalized URL (without trailing slash)
  return parsed.origin
}

/**
 * Sanitize string input to prevent injection attacks
 */
function sanitizeInput(str, maxLength = 255) {
  if (typeof str !== 'string') return ''
  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"]/g, '') // Remove potential XSS chars
}

/**
 * Validate stream ID (should be numeric)
 */
function validateStreamId(streamId) {
  const id = String(streamId).trim()
  if (!/^\d+$/.test(id)) {
    throw new Error('Invalid stream ID')
  }
  return id
}

module.exports = {
  validateDnsUrl,
  sanitizeInput,
  validateStreamId,
  isPrivateIP
}
