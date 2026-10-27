import React, { useState } from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Users, 
  Monitor, 
  Volume2, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink, 
  Sparkles,
  KeyRound,
  Tv,
  ChevronRight
} from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bot' | 'userbot' | 'obs'>('bot');
  const [lang, setLang] = useState<'en' | 'km'>('en');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            {lang === 'en' ? 'Step-by-Step Setup Guide' : 'សៀវភៅណែនាំតម្លើងមួយជំហានៗ'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {lang === 'en' 
              ? 'Connect your Telegram ABA bot alerts directly to OBS Studio with Khmer TTS voice.'
              : 'តភ្ជាប់ការជូនដំណឹងពី ABA Bot ក្នុង Telegram ទៅ OBS Studio ជាមួយសម្លេងអានជាភាសាខ្មែរ'}
          </p>
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              lang === 'en' ? 'bg-emerald-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('km')}
            className={`px-3 py-1.5 rounded-md transition-all font-khmer ${
              lang === 'km' ? 'bg-emerald-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ភាសាខ្មែរ
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={() => setActiveTab('bot')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
            activeTab === 'bot'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>{lang === 'en' ? '1. Telegram Bot (Standard)' : '១. Telegram Bot (ស្តង់ដារ)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('userbot')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
            activeTab === 'userbot'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{lang === 'en' ? '2. Telegram API Credentials' : '២. Telegram API Credentials'}</span>
        </button>

        <button
          onClick={() => setActiveTab('obs')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
            activeTab === 'obs'
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>{lang === 'en' ? '3. OBS Studio Overlay' : '៣. OBS Studio Overlay'}</span>
        </button>
      </div>

      {/* Tab 1: Telegram Bot Method */}
      {activeTab === 'bot' && (
        <div className="space-y-4 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">
                {lang === 'en' ? 'Important: Telegram Bot Privacy Rule' : 'ចំណុចសំខាន់៖ ច្បាប់ Privacy របស់ Telegram Bot'}
              </p>
              <p className="text-xs text-amber-200/80 mt-1">
                {lang === 'en'
                  ? 'By default, Telegram bots cannot see other bots (like PayWay by ABA). You MUST disable Privacy Mode in BotFather and make your bot an Admin in your group!'
                  : 'ជាធម្មតា Telegram មិនអនុញ្ញាតឲ្យ Bot មួយមើលឃើញសាររបស់ Bot មួយទៀត (ដូចជា PayWay by ABA) នោះទេ។ លោកអ្នកត្រូវតែបិទ Privacy Mode ក្នុង @BotFather និងតម្លើង Bot ជា Admin ក្នុង Group!'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0">
                1
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-white">
                  {lang === 'en' ? 'Get your Bot Token from @BotFather' : 'យក Bot Token ពី @BotFather'}
                </h4>
                <p className="text-slate-400 text-xs">
                  {lang === 'en'
                    ? 'Open Telegram and search for @BotFather. Send /newbot, give it a name (e.g. "My Stream Alert"), and copy the HTTP API token.'
                    : 'បើក Telegram រួចស្វែងរក @BotFather។ ផ្ញើ /newbot ដាក់ឈ្មោះ (ឧ. "My Stream Alert") រួចចម្លងយក HTTP API Token។'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0">
                2
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {lang === 'en' ? 'Disable Privacy Mode (Crucial!)' : 'បិទ Privacy Mode (ចាំបាច់បំផុត!)'}
                </h4>
                <p className="text-slate-400 text-xs">
                  {lang === 'en'
                    ? 'In @BotFather, send: /setprivacy -> Select your bot -> Choose "Disable". This allows the bot to receive all group messages!'
                    : 'ក្នុង @BotFather ផ្ញើពាក្យបញ្ជា៖ /setprivacy -> ជ្រើសរើស Bot របស់អ្នក -> ចុចលើ "Disable"។'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0">
                3
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  {lang === 'en' ? 'Add Bot to your ABA Group & Promote to Admin' : 'បញ្ចូល Bot ទៅក្នុង ABA Group & ដាក់ជា Admin'}
                </h4>
                <p className="text-slate-400 text-xs">
                  {lang === 'en'
                    ? 'Go to your "ABA alert" Telegram group (Group ID: -5214008501 shown in your screenshot). Add your bot and promote it to Admin with "Read Messages" permission.'
                    : 'ចូលទៅក្នុង Telegram Group "ABA alert" របស់អ្នក (ID: -5214008501 ដូចក្នុងរូបភាពទី១)។ បញ្ចូល Bot របស់អ្នក រួចតម្លើងវាជា Admin!'}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex gap-4">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs shrink-0">
                4
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-white">
                  {lang === 'en' ? 'Paste Token in the Settings Tab Below' : 'ដាក់ Token ក្នុងប្រអប់ Settings ខាងក្រោម'}
                </h4>
                <p className="text-slate-400 text-xs">
                  {lang === 'en'
                    ? 'Paste your bot token and click "Start Listener". Whenever ABA sends "$1.00 paid by..." the alert will instantly pop up on OBS!'
                    : 'Paste Bot Token របស់អ្នក រួចចុច "Start Listener"។ ពេល ABA ផ្ញើសារ "$1.00 paid by..." ផ្ទាំង Alert នឹងបង្ហាញលើ OBS ភ្លាម!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Telegram Userbot / API Credentials */}
      {activeTab === 'userbot' && (
        <div className="space-y-4 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
            <h4 className="font-bold text-white flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {lang === 'en' ? 'Your Telegram Developer App' : 'Telegram Developer App របស់អ្នក'}
            </h4>
            <p className="text-xs text-slate-300">
              {lang === 'en'
                ? 'From your second screenshot (my.telegram.org/apps), you already created your App credentials:'
                : 'ពីក្នុងរូបភាពទី២ (my.telegram.org) អ្នកបានបង្កើតរួចជាស្រេចនូវ៖'}
            </p>
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div><span className="text-slate-500">App api_id:</span> <span className="text-emerald-400 font-bold">36414234</span></div>
              <div><span className="text-slate-500">App api_hash:</span> <span className="text-emerald-400 font-bold">ce2196bb071d9fa4efaf16b75e3c318f</span></div>
              <div><span className="text-slate-500">App title:</span> <span className="text-slate-300">Donate Bot</span></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-white">
              {lang === 'en' ? 'Why this is great for ABA PayWay:' : 'ហេតុអ្វីវិធីនេះល្អបំផុតសម្រាប់ ABA PayWay៖'}
            </h4>
            <p className="text-slate-400 text-xs">
              {lang === 'en'
                ? 'A Telegram User Client (MTProto) acts like a real Telegram user, meaning it can read messages from ANY bot (including @PayWayByABA_bot) without any privacy restrictions or group admin requirements!'
                : 'Telegram User Client ដើរតួដូចជាគណនីអ្នកប្រើប្រាស់ពិតប្រាកដ ដូច្នេះវាអាចអានសារពី Bot ទាំងអស់ (រួមទាំង @PayWayByABA_bot) ដោយគ្មានជាប់របាំង Privacy ឡើយ!'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: OBS Studio Setup */}
      {activeTab === 'obs' && (
        <div className="space-y-4 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-400" />
              {lang === 'en' ? 'How to Add Overlay to OBS Studio:' : 'របៀបដាក់ Overlay ក្នុង OBS Studio៖'}
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300">
              <li>
                {lang === 'en' ? 'In OBS Studio, find the ' : 'ក្នុង OBS Studio ចូលទៅកាន់ប្រអប់ '}
                <strong className="text-white">Sources</strong>
                {lang === 'en' ? ' dock and click ' : ' រួចចុចសញ្ញា '}
                <strong className="text-emerald-400">+</strong>
              </li>
              <li>
                {lang === 'en' ? 'Select ' : 'ជ្រើសរើសយក '}
                <strong className="text-white">Browser</strong>
                {lang === 'en' ? ' and name it ' : ' រួចដាក់ឈ្មោះ '}
                <span className="text-emerald-400 font-semibold">"ABA Donation Alert"</span>
              </li>
              <li>
                {lang === 'en' ? 'Paste the Overlay URL: ' : 'ដាក់ Overlay URL៖ '}
                <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono">
                  {window.location.origin}/?view=overlay
                </code>
              </li>
              <li>
                {lang === 'en' ? 'Set Width: ' : 'កំណត់ Width៖ '}
                <strong className="text-white">1920</strong>
                {lang === 'en' ? ', Height: ' : ', Height៖ '}
                <strong className="text-white">1080</strong>
              </li>
              <li>
                <span className="text-emerald-400 font-bold">✓ </span>
                {lang === 'en' ? 'Check the box: ' : 'គូសធីកលើប្រអប់៖ '}
                <strong className="text-white">"Control audio via OBS"</strong>
                {lang === 'en' ? ' (so the Khmer voice audio plays through your stream mixer!)' : ' (ដើម្បីឲ្យសម្លេងអានជាភាសាខ្មែរបន្លឺឡើងក្នុង Stream!)'}
              </li>
              <li>
                {lang === 'en' ? 'Click ' : 'ចុច '}
                <strong className="text-white">OK</strong>
                {lang === 'en' ? '! Then click "Trigger Test Alert" on this dashboard to see it live!' : '! រួចចុចប៊ូតុង "Trigger Test Alert" លើផ្ទាំងនេះដើម្បីតេស្តមើល!'}
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
