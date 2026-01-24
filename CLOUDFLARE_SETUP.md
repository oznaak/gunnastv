# Cloudflare Stream Proxy Setup

## Option 1: Stream Proxy (Recommended)
The backend now automatically detects HTTPS environments and proxies HTTP streams through your HTTPS backend.

No Cloudflare configuration needed - it just works!

## Option 2: Cloudflare Page Rules (Alternative)
If you prefer direct connections, create a Page Rule in Cloudflare:

**Pattern:** `yourdomain.com/api/xtream/*`
**Settings:**
- SSL: Off (or Flexible)

This allows HTTP connections to Xtream providers while keeping the rest of your site secure.

## Option 3: Origin CA Certificate (Advanced)
1. Generate Origin CA certificate in Cloudflare dashboard
2. Install certificate on your server
3. Use Full (Strict) SSL/TLS mode
4. Configure your server to use the certificate

## Testing
After deployment, check that streams play in production:
- Open browser dev tools
- Look for network requests to `/api/xtream/stream/`
- Should see 200 responses for M3U8 files