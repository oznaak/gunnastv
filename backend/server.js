const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const authRoutes = require('./auth')
const xtreamRoutes = require('./xtream')

const app = express()

// Trust proxy (required for Cloudflare + Caddy - proper IP detection for rate limiting)
// Set to true to trust all proxies in the chain (Cloudflare → Caddy → Node.js)
app.set('trust proxy', true)

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (onclick, etc.)
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      mediaSrc: ["'self'", "https:", "http:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      workerSrc: ["'self'", "blob:"], // Allow HLS.js web workers
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: null // Don't force HTTPS - Xtream servers use HTTP
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: false // Disable HSTS - allows HTTP connections to Xtream servers
}))

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window (increased for EPG bulk loading)
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})

// Validate JWT_SECRET at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET must be set in .env and be at least 32 characters long');
  process.exit(1);
}

// CORS - configure for your domain in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN, // MUST set ALLOWED_ORIGIN in .env
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Body parser with size limit
app.use(express.json({ limit: '10kb' }))

// Apply rate limiting
app.use('/api/auth/login', loginLimiter)
app.use('/api/', apiLimiter)

// API routes using Express Router
app.use('/api/auth', authRoutes)
app.use('/api/xtream', xtreamRoutes)

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// SPA fallback - serve index.html for all routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})


app.listen(3000, () => console.log('Backend running on port 3000'))
