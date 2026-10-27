# 🇰🇭 ABA PayWay OBS Live Stream Donation Alert Overlay

> A real-time Telegram ABA PayWay donation alert system built specifically for OBS Studio live streamers with **Khmer Voice TTS Synthesis**, customizable visuals (Neon, Minimal, Glassmorphism), sound alerts, and automatic page reload on speech completion.

![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)
![Node: >=18](https://img.shields.io/badge/Node->=18-green.svg)
![OBS Studio](https://img.shields.io/badge/OBS_Studio-Ready-purple.svg)

---

## 🌟 Features

- **Exact Visual Design**: Glowing radiant emerald `$ 1.00`, clean Khmer font (*Kantumruy Pro* / *Battambang*), customizable subtitle.
- **Khmer TTS Voice Synthesis**:
  - Automatically reads: `អរគុណ មេ [Donor] បានឧបត្ថម្ភ [Amount] ដុល្លារ [Remark]`.
  - If no remark is provided in the transaction, it defaults to `អរគុណច្រើនមេ`.
- **Automatic Browser Refresh**: OBS Browser Source automatically calls `window.location.reload()` the instant Khmer TTS finishes speaking.
- **Sound Alert Engine**: 6 built-in synthesized Web Audio presets (Chime, Cash Register, Coin, Level Up, Ping, Marimba) + custom audio URL support with volume controls.
- **Queue Management**: When multiple donations arrive rapidly, alerts play sequentially without overlapping or interrupting each other.
- **Theme & Animation Selector**: Easily toggle between **Neon**, **Minimal**, and **Glassmorphism**, plus entrance animations (**Slide**, **Bounce**, **Fade**, **Zoom**).
- **1-Click Cloud Hosting**: Pre-configured for **Render.com**, **Railway.app**, **Docker**, or any Node.js VPS.

---

## 🚀 Quick Start (Local Run)

1. **Clone or download this repository**:
   ```bash
   git clone <your-github-repo-url>
   cd aba-obs-donation-alert
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Telegram credentials:
   ```env
   TELEGRAM_BOT_TOKEN="your_botfather_token"
   TELEGRAM_CHAT_ID="-5214008501"
   PORT=3000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🌐 Deploy to Free Cloud (Render / Railway / Docker)

### Option 1: Deploy to Render.com (Recommended Free Hosting)
1. Push your code to your GitHub account (see [Pushing to GitHub](#-pushing-to-github)).
2. Go to [Render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect `render.yaml` or you can select:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `TELEGRAM_BOT_TOKEN`: `your_bot_token_from_botfather`
   - `TELEGRAM_CHAT_ID`: `-5214008501` (or your group ID)
6. Click **Deploy Web Service**. You will get a free HTTPS URL like `https://my-aba-alert.onrender.com`.

### Option 2: Deploy to Railway.app
1. Go to [Railway.app](https://railway.app) $\rightarrow$ **New Project** $\rightarrow$ **Deploy from GitHub repo**.
2. Railway detects `railway.json` and builds the production bundle automatically.
3. Add `TELEGRAM_BOT_TOKEN` in the Railway Variables tab.

### Option 3: Run with Docker
```bash
docker build -t aba-obs-alert .
docker run -p 3000:3000 -e TELEGRAM_BOT_TOKEN="your_token" -e TELEGRAM_CHAT_ID="-5214008501" aba-obs-alert
```

---

## 🎥 Adding to OBS Studio

1. In OBS Studio, go to your **Sources** panel $\rightarrow$ click **+** $\rightarrow$ select **Browser**.
2. Name it `ABA Donation Alert`.
3. In the Browser Source Properties:
   - **URL**: `http://localhost:3000/?view=overlay` (or your hosted Render URL `https://your-app.onrender.com/?view=overlay`)
   - **Width**: `1920`
   - **Height**: `1080`
   - Check ✅ **Control audio via OBS**
   - Check ✅ **Refresh browser when scene becomes active**
   - **Custom CSS**: Leave blank or set `body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }`
4. Click **OK**.
5. Test an alert from the Dashboard (`http://localhost:3000`) and watch the alert pop up on your stream with Khmer voice!

---

## 🤖 Why Doesn't Telegram Bot Read Other Bots in Normal Groups?

Telegram has a strict platform rule: **Bots cannot receive messages from other bots inside normal groups** (to prevent accidental infinite loops). Since `@PayWayByABA_bot` is a bot, your alert bot cannot see its group messages directly via standard Bot API `getUpdates`.

### 3 Easy Ways to Fix This:

### Solution 1: Use a Telegram Channel (Zero Code - Recommended)
1. Create a private **Telegram Channel** instead of a regular group.
2. Link your ABA PayWay notifications to this channel, or forward notifications into it.
3. Add your Alert Bot as an **Administrator** in the Channel.
4. Bots **can read all posts in channels** (`channel_post`). The applet automatically parses `channel_post` events!

### Solution 2: Forwarding Script using Telegram API (App API ID & Hash)
In your `my.telegram.org` account, you created:
- `api_id`: `36414234`
- `api_hash`: `ce2196bb071d9fa4efaf16b75e3c318f`

You can run the included lightweight Telegram client forwarder `telegram_forwarder.py` on your computer or VPS. It logs in as your user account and forwards ABA bot messages straight to your server webhook:
```bash
pip install telethon requests
python telegram_forwarder.py
```

### Solution 3: Direct Webhook / Simulator
You can also trigger alerts via HTTP POST from any device, shortcut, or phone banking automation (e.g., Tasker, MacroDroid, or Bank SMS parser):
```bash
curl -X POST http://localhost:3000/api/test-alert \
  -H "Content-Type: application/json" \
  -d '{"donorName": "zaion", "amount": 1.00, "remark": "អរគុណច្រើនមេ"}'
```

---

## 💻 Pushing to GitHub

To put this project on your GitHub:

```bash
# 1. Initialize git
git init
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 2. Stage all files and commit
git add .
git commit -m "feat: complete ABA PayWay OBS donation overlay system"

# 3. Create a new repository on https://github.com/new
# 4. Link your remote and push
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## 🛠️ Testing & Verification

Run the automated test suite:
```bash
npm test
```
Runs 13 unit tests covering:
- ABA PayWay message parsing regex (USD and KHR formats).
- Donor name card mask cleaning (`HUN CHHING CHHING (*280)` $\rightarrow$ `HUN CHHING CHHING`).
- Default remark fallback to `អរគុណច្រើនមេ`.
- Sound volume clamping and preset synthesis.
- Sequential alert queue management.

---

## 📄 License
Apache-2.0
