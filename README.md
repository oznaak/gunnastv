# 📺 Xtreamify Web Player

A modern, self-hosted IPTV web player that connects to Xtream Codes API providers. Stream live TV from your browser with a beautiful, responsive interface.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Features

- 🔐 **Secure Authentication** — JWT-based auth with credentials stored server-side only
- 📡 **Live TV Streaming** — HLS.js player with adaptive bitrate
- 📋 **EPG Guide** — Electronic Program Guide with timeline view
- ⭐ **Favorites** — Save channels and categories, import/export support
- 🌍 **Bilingual** — Portuguese and English interface
- 📱 **Responsive** — Works on desktop, tablet, and mobile (work in progress)
- 🐳 **Docker Ready** — One-command deployment

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express 5, JWT, Helmet.js |
| **Frontend** | Vanilla JS (ES Modules), Tailwind CSS |
| **Player** | HLS.js |
| **Deployment** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/oznaak/Xtreamify-Web-Player.git
cd xtreamify

# Install dependencies
cd backend && npm install

# Create environment file
cat > .env << 'EOF'
JWT_SECRET=your-secret-key-at-least-32-characters-long
ALLOWED_ORIGIN=http://localhost:3000
EOF

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

---

## 🐳 Docker Deployment

### 1. Clone and configure

```bash
git clone https://github.com/oznaak/Xtreamify-Web-Player.git
cd xtreamify

# Create production environment file
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -hex 32)
ALLOWED_ORIGIN=https://your-domain.com
EOF
```

### 2. Deploy

```bash
# Create network (if not exists)
docker network create web

# Build and run
docker compose up -d --build
```

### 3. Reverse Proxy (Caddy example)

```caddy
your-domain.com {
    reverse_proxy localhost:3000
}
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `openssl rand -hex 32` |
| `ALLOWED_ORIGIN` | Frontend URL for CORS | `https://your-domain.com` |

## 📁 Project Structure

```
xtreamify/
├── backend/
│   ├── server.js        # Express server entry
│   ├── auth.js          # Authentication routes
│   ├── xtream.js        # Xtream API proxy routes
│   ├── security.js      # SSRF protection, sanitization
│   └── sessionStore.js  # In-memory session storage
│
├── frontend/
│   ├── index.html       # Single-page application
│   └── js/
│       ├── app.js       # Main entry point
│       ├── config.js    # App configuration
│       ├── api.js       # API client
│       ├── auth.js      # Auth logic
│       ├── router.js    # SPA routing
│       ├── player.js    # HLS.js video player
│       ├── favorites.js # Favorites management
│       └── ui/          # View components
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security

- **SSRF Protection** — DNS validation blocks requests to private IPs
- **Input Sanitization** — All user inputs are sanitized
- **Rate Limiting** — Protects against brute force attacks
- **Helmet.js** — Secure HTTP headers with custom CSP
- **No Credential Exposure** — Xtream credentials never sent to frontend

---

## 📝 Usage

1. **Login** — Enter your Xtream provider URL, username, and password
2. **Browse** — Navigate channels by category or search
3. **Watch** — Click any channel to start streaming
4. **Favorites** — Star channels for quick access
5. **EPG** — View program guide for current and upcoming shows

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ for cord-cutters everywhere
</p>
