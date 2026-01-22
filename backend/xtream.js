const express = require('express')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const { getSession } = require('./sessionStore')
const { validateStreamId } = require('./security')

const router = express.Router()

// Request timeout for external API calls
const AXIOS_CONFIG = {
  timeout: 15000,
  maxRedirects: 0
}

// ==================== EPG CACHE ====================
// Cache EPG data per user+stream combination for 6 hours
const EPG_CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours
const EPG_CACHE_CLEANUP_INTERVAL_MS = 30 * 60 * 1000 // Clean every 30 minutes
const epgCache = new Map()

function getEpgCacheKey(dns, streamId) {
  // Use DNS + streamId as cache key (credentials not needed - EPG is same for all users on same server)
  return `${dns}:${streamId}`
}

function getCachedEpg(key) {
  const cached = epgCache.get(key)
  if (!cached) return null
  
  if (Date.now() > cached.expiresAt) {
    epgCache.delete(key)
    return null
  }
  
  return cached.data
}

function setCachedEpg(key, data) {
  epgCache.set(key, {
    data,
    expiresAt: Date.now() + EPG_CACHE_TTL_MS,
    cachedAt: Date.now()
  })
}

// Periodic cleanup of expired EPG cache entries
function cleanupExpiredEpgCache() {
  const now = Date.now()
  let cleanedCount = 0
  for (const [key, value] of epgCache.entries()) {
    if (value.expiresAt <= now) {
      epgCache.delete(key)
      cleanedCount++
    }
  }
  if (cleanedCount > 0) {
    console.log(`EPG cache cleanup: removed ${cleanedCount} expired entries. Active: ${epgCache.size}`)
  }
}

// Start EPG cache cleanup interval
setInterval(cleanupExpiredEpgCache, EPG_CACHE_CLEANUP_INTERVAL_MS)

// ==================== AUTH MIDDLEWARE ====================
function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.sendStatus(401)
  }
  
  const token = authHeader.split(' ')[1]
  if (!token) return res.sendStatus(401)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const session = getSession(payload.sid)
    if (!session) return res.sendStatus(401)
    req.user = session
    next()
  } catch {
    res.sendStatus(403)
  }
}

// ==================== ROUTES ====================

// Get live streams list
router.get('/live', auth, async (req, res) => {
  const { dns, username, password } = req.user

  try {
    const url = `${dns}/player_api.php`
    const { data } = await axios.get(url, {
      params: {
        username,
        password,
        action: 'get_live_streams'
      },
      ...AXIOS_CONFIG
    })

    res.json(data)
  } catch (err) {
    console.error('Failed to fetch live streams:', err.message)
    res.status(500).json({ error: 'Failed to fetch streams' })
  }
})

// Get stream URL (obfuscated)
router.get('/play/:streamId', auth, (req, res) => {
  const { dns, username, password } = req.user
  const { streamId } = req.params

  try {
    const validStreamId = validateStreamId(streamId)
    
    // Return obfuscated stream URL to make casual inspection harder
    // Note: This is obfuscation, not encryption - determined users can still decode
    const streamUrl = `${dns}/live/${username}/${password}/${validStreamId}.m3u8`
    const obfuscated = Buffer.from(streamUrl).toString('base64')
    res.json({ u: obfuscated, t: Date.now() })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Get EPG data for a stream (with caching)
router.get('/epg/:streamId', auth, async (req, res) => {
  const { dns, username, password } = req.user
  const { streamId } = req.params
  const forceRefresh = req.query.refresh === 'true'

  try {
    const validStreamId = validateStreamId(streamId)
    const cacheKey = getEpgCacheKey(dns, validStreamId)
    
    // Check cache first (unless force refresh requested)
    if (!forceRefresh) {
      const cached = getCachedEpg(cacheKey)
      if (cached) {
        // Add cache info to response
        return res.json({ 
          ...cached, 
          _cached: true,
          _cacheKey: cacheKey
        })
      }
    }
    
    // Fetch fresh EPG data
    const url = `${dns}/player_api.php`
    const { data } = await axios.get(url, {
      params: {
        username,
        password,
        action: 'get_simple_data_table',
        stream_id: validStreamId
      },
      ...AXIOS_CONFIG
    })

    // Decode base64 encoded fields in EPG listings
    if (data.epg_listings && Array.isArray(data.epg_listings)) {
      data.epg_listings = data.epg_listings.map(epg => ({
        ...epg,
        title: epg.title ? Buffer.from(epg.title, 'base64').toString('utf-8') : '',
        description: epg.description ? Buffer.from(epg.description, 'base64').toString('utf-8') : '',
        // Convert string timestamps to Unix timestamps
        start: epg.start ? Math.floor(new Date(epg.start).getTime() / 1000) : 0,
        end: epg.end ? Math.floor(new Date(epg.end).getTime() / 1000) : 0
      }))
    }

    // Cache the processed EPG data
    setCachedEpg(cacheKey, data)
    
    res.json({ 
      ...data, 
      _cached: false 
    })
  } catch (err) {
    console.error('Failed to fetch EPG data:', err.message)
    res.json({ epg_listings: [] })
  }
})

// Get account info
router.get('/account', auth, async (req, res) => {
  const { dns, username, password } = req.user

  try {
    const url = `${dns}/player_api.php`
    const { data } = await axios.get(url, {
      params: { username, password },
      ...AXIOS_CONFIG
    })

    // Only return the relevant fields (no sensitive data)
    const user = {
      username: data.user_info.username,
      status: data.user_info.status,
      exp_date: data.user_info.exp_date,
      active_cons: data.user_info.active_cons,
      max_connections: data.user_info.max_connections,
      // Obfuscate server info slightly
      url: data.server_info.url ? new URL(`http://${data.server_info.url}`).hostname : '',
      port: data.server_info.port
    }

    res.json(user)
  } catch (err) {
    console.error('Failed to fetch account info', err)
    res.status(500).json({ error: 'Failed to fetch account info' })
  }
})

// Get EPG cache stats (for debugging/monitoring)
router.get('/cache-stats', auth, (req, res) => {
  const stats = {
    epgCacheSize: epgCache.size,
    epgCacheTTL: EPG_CACHE_TTL_MS / 1000 / 60 + ' minutes',
    entries: []
  }
  
  for (const [key, value] of epgCache.entries()) {
    stats.entries.push({
      key,
      cachedAt: new Date(value.cachedAt).toISOString(),
      expiresAt: new Date(value.expiresAt).toISOString(),
      listingsCount: value.data?.epg_listings?.length || 0
    })
  }
  
  res.json(stats)
})

// Batch EPG endpoint - fetch EPG for multiple streams in one request
// POST /api/xtream/epg-batch with body { streamIds: [123, 456, 789] }
router.post('/epg-batch', auth, async (req, res) => {
  const { dns, username, password } = req.user
  const { streamIds } = req.body
  const forceRefresh = req.query.refresh === 'true'
  
  if (!Array.isArray(streamIds) || streamIds.length === 0) {
    return res.status(400).json({ error: 'streamIds must be a non-empty array' })
  }
  
  // Limit batch size to prevent abuse
  const MAX_BATCH_SIZE = 50
  const limitedIds = streamIds.slice(0, MAX_BATCH_SIZE)
  
  const results = {}
  const uncachedIds = []
  
  // Check cache first for all streams
  for (const streamId of limitedIds) {
    try {
      const validStreamId = validateStreamId(streamId)
      const cacheKey = getEpgCacheKey(dns, validStreamId)
      
      if (!forceRefresh) {
        const cached = getCachedEpg(cacheKey)
        if (cached) {
          results[validStreamId] = {
            epg_listings: cached.epg_listings || [],
            _cached: true
          }
          continue
        }
      }
      uncachedIds.push(validStreamId)
    } catch (err) {
      // Invalid stream ID, skip
      results[streamId] = { epg_listings: [], error: 'Invalid stream ID' }
    }
  }
  
  // Fetch uncached EPG data in parallel (with concurrency limit)
  const CONCURRENCY_LIMIT = 10
  const chunks = []
  for (let i = 0; i < uncachedIds.length; i += CONCURRENCY_LIMIT) {
    chunks.push(uncachedIds.slice(i, i + CONCURRENCY_LIMIT))
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (validStreamId) => {
      try {
        const url = `${dns}/player_api.php`
        const { data } = await axios.get(url, {
          params: {
            username,
            password,
            action: 'get_simple_data_table',
            stream_id: validStreamId
          },
          ...AXIOS_CONFIG
        })
        
        // Decode base64 encoded fields
        if (data.epg_listings && Array.isArray(data.epg_listings)) {
          data.epg_listings = data.epg_listings.map(epg => ({
            ...epg,
            title: epg.title ? Buffer.from(epg.title, 'base64').toString('utf-8') : '',
            description: epg.description ? Buffer.from(epg.description, 'base64').toString('utf-8') : '',
            start: epg.start ? Math.floor(new Date(epg.start).getTime() / 1000) : 0,
            end: epg.end ? Math.floor(new Date(epg.end).getTime() / 1000) : 0
          }))
        }
        
        // Cache the result
        const cacheKey = getEpgCacheKey(dns, validStreamId)
        setCachedEpg(cacheKey, data)
        
        results[validStreamId] = {
          epg_listings: data.epg_listings || [],
          _cached: false
        }
      } catch (err) {
        // Silently handle - many streams don't have EPG data, this is expected
        results[validStreamId] = { epg_listings: [] }
      }
    }))
  }
  
  res.json({
    results,
    totalRequested: streamIds.length,
    totalReturned: Object.keys(results).length,
    fromCache: Object.values(results).filter(r => r._cached).length,
    fromApi: Object.values(results).filter(r => r._cached === false).length
  })
})

module.exports = router
