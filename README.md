# Netsyra IDE

Netsyra IDE is a Next.js web application paired with a local Node.js agent. The browser gives you the UI; the agent runs on your computer and unlocks the workspace, terminal, AI search, and git features.

## Project stack

- **Framework**: Next.js 16 with App Router
- **UI**: React 19, Tailwind CSS v4, Radix UI, Framer Motion
- **Auth & DB**: Supabase (Auth + PostgreSQL)
- **Local agent**: Node.js + `ws` + `tsx`
- **AI**: OpenRouter, Gemini, Groq, DeepSeek, Cerebras, Manus
- **Tools**: Firecrawl, Tavily, Sentry

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

3. Start the Next.js dev server:

   ```bash
   npm run dev
   ```

4. In a separate terminal, start the local agent:

   ```powershell
   cd d:\netsyra
   npm run agent
   ```

   The agent prints a token. Paste it into the IDE when prompted.

5. Open [http://localhost:3000](http://localhost:3000) and log in.

## TLS certificates for remote use

If you use the IDE from a remote `https` origin, the local agent must use `wss://`. Install `mkcert` and generate a certificate:

```powershell
winget install mkcert
mkcert -install
mkcert localhost
```

Then run the agent with:

```powershell
$env:AGENT_TLS_CERT="localhost.pem"
$env:AGENT_TLS_KEY="localhost-key.pem"
npm run agent
```

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — build the app for production
- `npm run start` — start the production server
- `npm run agent` — start the local agent
- `npm run lint` — run ESLint

## Security

See [SECURITY.md](SECURITY.md) for:

- Required environment variables
- Supabase Row Level Security policies
- Local agent hardening
- Web application security headers

## Important deployment notes

- Keep `.env.local` out of version control. It is already ignored by `.gitignore`.
- Rotate any API keys that have been shared or exposed.
- Set `ADMIN_EMAIL` to the admin user's email.
- Enable RLS on all Supabase tables and use the policies in `SECURITY.md` as a starting point.
- The local agent should only be exposed to the public internet if you fully understand the security implications.

