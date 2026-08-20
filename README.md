# The T Clan Discord Bot

A full working bot that builds and moderates your server: [discord.gg/KG4b6n8ZdC](https://discord.gg/KG4b6n8ZdC)

## What it does
- **`npm run setup-server`** — one-time script that creates all roles, categories, and channels automatically.
- **Welcome messages** — new members get an embed welcome in `#welcome` and are put in `👋 Unverified`.
- **Verification gate** — `/setup-verify` posts a reaction message in `#verify`; reacting ✅ grants the `🐣 Member` role and removes `Unverified`.
- **Auto-mod** — deletes invite spam, scam keywords, non-whitelisted links, mass mentions, caps spam, and duplicate/flood spam. Escalates: warn → 1hr timeout → 24hr timeout → kick → ban. Every action logs to `#mod-logs` and `#automod-dashboard`.
- **Mod commands** — `/warn`, `/warnings`, `/clearwarnings`, `/mute`, `/automod-dashboard`.

## Setup (do this yourself — I can't hold your bot token)

### 1. Create the bot application
1. Go to https://discord.com/developers/applications → **New Application** → name it "The T Clan".
2. Go to **Bot** tab → **Add Bot** → click **Reset Token** → copy the token (keep it secret).
3. Under **Privileged Gateway Intents**, enable:
   - `SERVER MEMBERS INTENT`
   - `MESSAGE CONTENT INTENT`
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (simplest for setup — you can scope it down later)
   - Copy the generated URL, open it, and invite the bot into your server at the invite above.

### 2. Get your IDs
- Enable Developer Mode in Discord (User Settings → Advanced).
- Right-click your server icon → **Copy Server ID** → this is `GUILD_ID`.
- In the Developer Portal, **General Information** tab → copy **Application ID** → this is `CLIENT_ID`.

### 3. Configure
```bash
cd t-clan-bot
cp .env.example .env
```
Edit `.env` and fill in `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`.

### 4. Install and build the server
```bash
npm install
npm run setup-server
```
This creates every role/category/channel from the blueprint. Safe to re-run.

### 5. Deploy slash commands
```bash
npm run deploy-commands
```

### 6. Run the bot
```bash
npm start
```
Keep this running (use a process manager like `pm2`, or host it on a VPS/Railway/Render for 24/7 uptime).

### 7. Finish setup in Discord
- Run `/setup-verify` inside `#verify`.
- Move the bot's own role above `👋 Unverified`/`🐣 Member` in Server Settings → Roles (Discord requires a bot's role to be higher than roles it assigns/removes).
- Optionally also enable Discord's **native AutoMod** (Server Settings → Safety Setup) as a second layer — see `the-t-clan-discord-blueprint.md` for exact filter settings.

## Files
- `setup-server.js` — builds roles/categories/channels
- `index.js` — main bot process (welcome, automod, verification, commands)
- `automod.js` — auto-mod filter logic + warning escalation
- `welcome.js` — join handler
- `commands/index.js` — slash commands
- `data/warnings.json` — persisted warning counts (auto-created)

## Customizing filters
Edit `CONFIG` at the top of `automod.js`: mention limits, caps threshold, banned keywords, allowed link domains, duplicate-spam thresholds.
