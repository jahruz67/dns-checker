# Local DNS Tester

A lightweight DNS testing page that runs on a user's local device.

## What it does

- Queries DNS-over-HTTPS resolvers directly from the browser.
- Compares answers and latency across Cloudflare, Google, and Quad9.
- Works as static files (no build step required).

## Run locally

```bash
python3 -m http.server 8080
```

Then open: <http://localhost:8080>

## Share on your local network (optional)

Start the same command on your machine and open from another device on the same network:

`http://<your-local-ip>:8080`

Example local IP lookup:

```bash
hostname -I
```

> Note: Some networks block custom DNS calls or restrict CORS; if a resolver fails, the UI will show an error in the result table.
