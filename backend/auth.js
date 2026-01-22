const express = require('express')
const axios = require('axios')
const jwt = require('jsonwebtoken')
const { createSession } = require('./sessionStore')
const { validateDnsUrl, sanitizeInput } = require('./security')

const router = express.Router()

router.post('/login', async (req, res) => {
  const { dns, username, password } = req.body

  // Input validation
  if (!dns || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const sanitizedUsername = sanitizeInput(username, 100)
  const sanitizedPassword = sanitizeInput(password, 100)

  if (!sanitizedUsername || !sanitizedPassword) {
    return res.status(400).json({ error: 'Invalid credentials format' })
  }

  try {
    // Validate DNS URL (SSRF protection)
    const validatedDns = await validateDnsUrl(dns)

    const url = `${validatedDns}/player_api.php`
    const { data } = await axios.get(url, {
      params: { username: sanitizedUsername, password: sanitizedPassword },
      timeout: 15000, // 15 second timeout
      maxRedirects: 0 // Prevent redirect attacks
    })
    if (!data || data.user_info?.status !== 'Active') {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const { sid } = createSession({ dns: validatedDns, username: sanitizedUsername, password: sanitizedPassword })

    const token = jwt.sign(
      { sid },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    )

    res.json({
      token,
      user: {
        username: data.user_info.username,
        status: data.user_info.status,
        exp_date: data.user_info.exp_date,
        active_cons: data.user_info.active_cons,
        max_connections: data.user_info.max_connections
      }

    })

  } catch (err) {
    console.error('Login error:', err.message)
    if (err.message.includes('Private') || err.message.includes('Invalid URL')) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Xtream API unreachable' })
  }
})

module.exports = router
