"""
ABA PayWay Telegram MTProto Forwarder
-------------------------------------
Connects to Telegram using MTProto user client (api_id & api_hash)
to read messages from @PayWayByABA_bot in groups or private chats
and forwards them to your OBS Alert Server.

Requires:
  pip install telethon requests
"""

import os
import requests
from telethon import TelegramClient, events

# Configuration (defaults to credentials from your Telegram app)
API_ID = int(os.getenv("TELEGRAM_API_ID", "36414234"))
API_HASH = os.getenv("TELEGRAM_API_HASH", "ce2196bb071d9fa4efaf16b75e3c318f")
SERVER_URL = os.getenv("SERVER_URL", "http://localhost:3000/api/parse-text")
GROUP_ID = os.getenv("TELEGRAM_CHAT_ID", "-5214008501")

client = TelegramClient("aba_session", API_ID, API_HASH)

@client.on(events.NewMessage)
async def handle_new_message(event):
    chat = await event.get_chat()
    text = event.raw_text or ""
    
    # Filter for ABA PayWay messages
    if "paid by" in text and ("via ABA PAY" in text or "Trx. ID:" in text):
        print(f"\n[+] Detected ABA Payment in {getattr(chat, 'title', 'Chat')}:")
        print(text)
        
        # Forward to OBS Alert Server
        try:
            res = requests.post(SERVER_URL, json={
                "text": text,
                "triggerAlert": True
            }, timeout=5)
            if res.status_code == 200:
                print("  -> Successfully forwarded to OBS Alert Overlay!")
            else:
                print(f"  -> Server responded with status {res.status_code}")
        except Exception as e:
            print(f"  -> Error posting to OBS server: {e}")

async def main():
    print("==================================================")
    print("🚀 ABA PayWay Telegram Forwarder Started!")
    print(f"Listening for payments and forwarding to: {SERVER_URL}")
    print("Press Ctrl+C to stop.")
    print("==================================================")

with client:
    client.loop.run_until_complete(main())
    client.run_until_disconnected()
