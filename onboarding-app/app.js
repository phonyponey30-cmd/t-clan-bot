'use strict';
const INVITE = 'https://discord.gg/KG4b6n8ZdC';
const STEPS = ['get', 'join', 'rules', 'verify', 'safety', 'tour', 'hello', 'done'];
const $main = document.getElementById('main');
const $top = document.getElementById('top');
const $bar = document.getElementById('bar');
const $progress = document.querySelector('.progress');

// ---- state (localStorage is optional; app works without it) ----
let state = { screen: 'welcome', mode: null, checks: {} };
try { Object.assign(state, JSON.parse(localStorage.getItem('tclan-onboarding') || '{}')); } catch (e) {}
const history = [];
function save() { try { localStorage.setItem('tclan-onboarding', JSON.stringify(state)); } catch (e) {} }
function go(screen, push = true) {
  if (push && state.screen !== screen) history.push(state.screen);
  state.screen = screen; save(); render();
  $main.focus({ preventScroll: true }); window.scrollTo(0, 0);
}
function back() { go(history.pop() || 'welcome', false); }
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.append(t); setTimeout(() => t.remove(), 2200);
}
const isTeen = () => state.mode === 'teen';
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---- content that differs by audience ----
const RULES = {
  common: [
    'Be kind. No bullying, hate, or harassment, ever.',
    'No spam, scams, or sketchy links. Auto-mod removes them and may time you out.',
    'Never share personal info (yours or anyone\'s): address, school, phone, passwords.',
    'Only post content you made or have permission to share.'
  ],
  teen: [
    'Keep it age-appropriate. If something makes you uncomfortable, leave and tell a trusted adult or a mod.',
    'If someone asks to move to a private chat, asks for photos, or asks you to keep a secret, stop and report it.'
  ],
  adult: [
    'Adults: keep chats appropriate for a community with younger members. Do not DM minors for private chats.',
    'Be a good example. Report problems instead of arguing with rule breakers.'
  ]
};
const TOUR = [
  ['📋 Welcome', 'Start here: <code>#welcome</code>, <code>#rules</code>, <code>#verify</code>, <code>#faq</code>.'],
  ['💬 Community', '<code>#general-chat</code>, <code>#introduce-yourself</code>, <code>#memes</code>, <code>#clip-of-the-day</code> and more.'],
  ['🎬 TikTok Hub', 'Share videos in <code>#post-your-tiktok</code>, get kind feedback in <code>#feedback-and-critique</code>, find collabs, and register for live pings in <code>#tiktok-live</code>.'],
  ['🎨 Creator Resources', '<code>#editing-help</code>, <code>#tools-and-apps</code>, <code>#growth-tips</code> for learning and leveling up.'],
  ['🏆 Levels', 'Chat to earn XP. Check your level with <code>/rank</code> in <code>#rank-check</code>; reach level 1000 for VIP.'],
  ['🎫 Support', 'Use <code>#help-support</code>, <code>#report-a-user</code> or <code>#create-a-ticket</code> for a private chat with staff. <code>#warning-appeals</code> if a warning seems unfair.']
];
const INTRO = {
  teen: 'Hi everyone! 👋 I\'m [nickname]. I make [type of videos] and I\'m into [hobby]. Excited to be here!',
  adult: 'Hi all! 👋 I\'m [name/nickname]. I create [type of content] and I\'m here to [learn / collab / share]. Nice to meet you!'
};

// ---- screens ----
const S = {};
S.welcome = () => `
  <div class="hero" aria-hidden="true">🎉</div>
  <h1>Welcome to The T Clan!</h1>
  <p class="muted">A friendly TikTok creator community on Discord. This 5-minute guide gets you set up safely, whether you are a teen, an adult, or a parent.</p>
  <button class="btn" data-go="who">Let's go</button>
  <p class="muted" style="font-size:.9rem">We don't ask for your name or email here. Your progress is saved only on this device.</p>`;

S.who = () => `
  <h2>Who is joining?</h2>
  <p class="muted">This helps us show the right safety tips. You are not asked for a birthday.</p>
  <button class="choice" data-mode="adult"><span class="em">🧑</span><span><b>I'm 18 or older</b><small>Adult member</small></span></button>
  <button class="choice" data-mode="teen"><span class="em">🧒</span><span><b>I'm 13 to 17</b><small>Teen member, with extra safety tips</small></span></button>
  <button class="choice" data-mode="under13"><span class="em">🐥</span><span><b>I'm under 13</b><small>Let's get a grown-up</small></span></button>
  <button class="choice" data-mode="parent"><span class="em">👪</span><span><b>I'm a parent or guardian</b><small>See how we keep the server safe</small></span></button>`;

S.under13 = () => `
  <div class="hero" aria-hidden="true">🐥</div>
  <h2>Thanks for stopping by!</h2>
  <p>Discord is only for people <b>13 and older</b>, so we can't help you join yet. That rule keeps kids safe, and it's a good one.</p>
  <div class="tip">👉 Show this screen to a parent or guardian. They can read how our server works and decide what's best for your family.</div>
  <button class="btn" data-mode="parent">Open the grown-up guide</button>
  <button class="btn alt" data-go="who">Back</button>`;

S.parent = () => `
  <h2>Guide for parents and guardians</h2>
  <p>The T Clan is a community for TikTok creators. Members range from teens to adults, so we built in protections.</p>
  <h3>What the server does</h3>
  <ul class="plain">
    <li>New members land in a locked <b>Unverified</b> role and must read the rules and verify.</li>
    <li><b>Auto-mod</b> removes invite spam, scams, risky links, and mass pinging, then escalates: warning, timeout, kick, ban.</li>
    <li>Moderators review actions in private staff channels.</li>
    <li>Anyone can open a <b>private ticket</b> to report a user.</li>
  </ul>
  <h3>Do this on your teen's account</h3>
  <ul class="plain">
    <li>Turn on <b>Family Center</b> in Discord to see who they chat with (not message contents).</li>
    <li>Settings → Privacy &amp; Safety → set the safe-direct-messaging filter to <b>Keep me safe</b>.</li>
    <li>Turn off <b>Allow direct messages from server members</b> for this server.</li>
    <li>Set who can send friend requests to <b>Friends of friends</b> or <b>Server members</b> only if needed.</li>
  </ul>
  <div class="note">No automated system is perfect. Talk with your teen about never sharing personal info and always telling you if something feels off.</div>
  <a class="btn alt" href="https://discord.com/safety/family-center" target="_blank" rel="noopener">Discord Family Center info ↗</a>
  <button class="btn alt" data-go="welcome">Back to start</button>`;

S.get = () => `
  <h2>1. Get Discord</h2>
  <p>You need a free Discord account. Pick a nickname that is <b>not your real full name</b>${isTeen() ? ' and doesn\'t reveal your school or town' : ''}.</p>
  <a class="btn" href="https://discord.com/download" target="_blank" rel="noopener">Download Discord ↗</a>
  <label class="check"><input type="checkbox" data-check="hasDiscord"><span>I have Discord installed and I'm logged in</span></label>
  ${isTeen() ? '<div class="tip">💡 Use a strong password you don\'t use anywhere else, and turn on two-factor login if a parent can help.</div>' : ''}
  ${next('get', 'hasDiscord')}`;

S.join = () => `
  <h2>2. Join the server</h2>
  <p>Tap the button. Discord opens and asks you to accept the invite.</p>
  <a class="btn" href="${INVITE}" target="_blank" rel="noopener">Join The T Clan ↗</a>
  <p class="muted">Invite link: <code>discord.gg/KG4b6n8ZdC</code>. Only trust this exact link. Staff will never DM you a different one.</p>
  <label class="check"><input type="checkbox" data-check="joined"><span>I joined and can see the server</span></label>
  ${next('join', 'joined')}`;

S.rules = () => {
  const list = [...RULES.common, ...RULES[isTeen() ? 'teen' : 'adult']];
  return `
  <h2>3. House rules</h2>
  <p>The full rules live in <code>#rules</code>. These are the big ones:</p>
  ${list.map((r, i) => `<label class="check"><input type="checkbox" data-check="rule${i}"><span>${esc(r)}</span></label>`).join('')}
  ${next('rules', list.map((_, i) => 'rule' + i))}`;
};

S.verify = () => `
  <h2>4. Verify yourself</h2>
  <p>Right now you're in the <span class="tag">👋 Unverified</span> role. To unlock the server:</p>
  <ol class="plain"><li>Open <code>#verify</code></li><li>Tap the ✅ reaction on the message</li><li>You become a <span class="tag">🐣 Member</span> and the other channels appear</li></ol>
  <div class="tip">Don't see it? Pull to refresh Discord, or open a ticket in <code>#help-support</code>.</div>
  <label class="check"><input type="checkbox" data-check="verified"><span>I'm verified and can see all channels</span></label>
  ${next('verify', 'verified')}`;

S.safety = () => {
  const items = isTeen() ? [
    ['dm', 'I turned off DMs from server members (Server name → Privacy Settings)'],
    ['filter', 'I set Settings → Privacy &amp; Safety → Safe direct messaging to "Keep me safe"'],
    ['know', 'I know how to report: tell a mod, use <code>#report-a-user</code>, or tap Report on any message'],
    ['adult', 'I\'ll tell a parent or trusted adult if anyone makes me uncomfortable']
  ] : [
    ['dm', 'I reviewed my DM and friend request settings (Server name → Privacy Settings)'],
    ['filter', 'I enabled Settings → Privacy &amp; Safety → Safe direct messaging'],
    ['know', 'I know how to report: use <code>#report-a-user</code> or tap Report on any message'],
    ['adult', 'I understand that interacting privately with minors is not allowed here']
  ];
  return `
  <h2>5. Stay safe</h2>
  <p>Two minutes now saves headaches later.</p>
  ${items.map(([k, t]) => `<label class="check"><input type="checkbox" data-check="safe_${k}"><span>${t}</span></label>`).join('')}
  <div class="note">🚩 Red flags: asking for personal info, moving to another app, gifts or money, "don't tell anyone". Stop, screenshot, and report.</div>
  ${next('safety', items.map(([k]) => 'safe_' + k))}`;
};

S.tour = () => `
  <h2>6. Quick tour</h2>
  <p>Tap a section to peek inside.</p>
  ${TOUR.map(([t, d]) => `<details><summary>${t}</summary><p>${d}</p></details>`).join('')}
  <button class="btn" data-next="tour">Continue</button>`;

S.hello = () => `
  <h2>7. Say hi 👋</h2>
  <p>Introduce yourself in <code>#introduce-yourself</code>. Copy this and fill in the brackets (no personal details needed!):</p>
  <div class="tpl" id="tpl">${esc(INTRO[isTeen() ? 'teen' : 'adult'])}</div>
  <button class="btn alt" id="copy">Copy message</button>
  <button class="btn" data-next="hello">I said hi!</button>
  <button class="btn alt" data-next="hello">Skip for now</button>`;

S.done = () => `
  <div class="badge card">
    <div class="hero" aria-hidden="true">🏅</div>
    <h1>You're all set!</h1>
    <p>Welcome to the clan. You've earned the <b>Onboarding Complete</b> badge.</p>
  </div>
  <h3>What next?</h3>
  <ul class="plain">
    <li>Post your first video in <code>#post-your-tiktok</code></li>
    <li>Register for live pings in <code>#tiktok-live</code></li>
    <li>Chat to earn XP and check <code>/rank</code></li>
  </ul>
  <a class="btn" href="${INVITE}" target="_blank" rel="noopener">Open Discord ↗</a>
  <button class="btn alt" id="share">Invite a friend</button>
  <button class="btn alt" data-go="parent">Share the parent guide</button>`;

// "Continue" button helper: disabled until all required checks are ticked
function next(step, req) {
  const keys = [].concat(req);
  const ok = keys.every(k => state.checks[k]);
  return `<button class="btn" data-next="${step}" ${ok ? '' : 'disabled aria-disabled="true"'}>Continue</button>`;
}

// ---- render + events ----
function render() {
  const fn = S[state.screen] || S.welcome;
  document.body.dataset.audience = state.mode || "";
  $main.innerHTML = fn();
  const i = STEPS.indexOf(state.screen);
  $top.hidden = i < 0;
  const pct = i < 0 ? 0 : Math.round((i / (STEPS.length - 1)) * 100);
  $bar.style.width = pct + '%'; $progress.setAttribute('aria-valuenow', pct);
  $main.querySelectorAll('input[data-check]').forEach(el => { el.checked = !!state.checks[el.dataset.check]; });
}

$main.addEventListener('change', e => {
  const k = e.target.dataset && e.target.dataset.check;
  if (!k) return;
  state.checks[k] = e.target.checked; save();
  const btn = $main.querySelector('[data-next]');
  if (btn && STEPS.includes(btn.dataset.next)) {
    const keys = [...$main.querySelectorAll('input[data-check]')].map(i => i.dataset.check);
    const ok = keys.every(x => state.checks[x]);
    btn.disabled = !ok; btn.setAttribute('aria-disabled', String(!ok));
  }
});

$main.addEventListener('click', async e => {
  const t = e.target.closest('[data-go],[data-mode],[data-next],#copy,#share');
  if (!t) return;
  if (t.dataset.go) return go(t.dataset.go);
  if (t.dataset.mode) {
    const m = t.dataset.mode;
    if (m === 'under13') { state.mode = null; return go('under13'); }
    if (m === 'parent') { state.mode = null; return go('parent'); }
    state.mode = m; return go('get');
  }
  if (t.dataset.next) { const i = STEPS.indexOf(t.dataset.next); return go(STEPS[i + 1]); }
  if (t.id === 'copy') {
    const text = document.getElementById('tpl').textContent;
    try { await navigator.clipboard.writeText(text); toast('Copied!'); } catch (err) { toast('Press and hold the text to copy'); }
  }
  if (t.id === 'share') {
    const data = { title: 'The T Clan', text: 'Join The T Clan on Discord!', url: INVITE };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(INVITE); toast('Invite link copied!'); } } catch (err) {}
  }
});
document.getElementById('back').addEventListener('click', back);
document.getElementById('restart').addEventListener('click', () => {
  if (!confirm('Start over? This clears your progress on this device.')) return;
  state = { screen: 'welcome', mode: null, checks: {} }; history.length = 0; save(); render();
});

// Resume only if there's a valid mode for step screens
if (STEPS.includes(state.screen) && !state.mode) state.screen = 'welcome';
render();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
