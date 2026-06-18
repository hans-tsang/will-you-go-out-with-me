// ---------- state ----------
const state = {
  date: null,
  when: null,
  noDodges: 0,
  submitted: false,
};

const SUBMIT_ENDPOINT = 'https://date-ask-tg.vercel.app/api/submit';

const noTaunts = [
  "the no button is shy 🥺",
  "it keeps running away here~",
  "are you sure? try again 👀",
  "wow rude. try harder 😤",
  "the no button has decided: no.",
  "ok now it's just bullying you 😅",
  "give up. say yes already 💕",
];

// ---------- screen navigation ----------
function showScreen(n) {
  document.querySelectorAll('.card').forEach(card => {
    const isTarget = card.dataset.screen === String(n);
    card.classList.toggle('hidden', !isTarget);
    card.setAttribute('aria-hidden', !isTarget);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- screen 1: yes / runaway no ----------
const yesBtn = document.getElementById('yesBtn');
const noBtn  = document.getElementById('noBtn');
const noHint = document.getElementById('noHint');

yesBtn.addEventListener('click', () => {
  burstHearts(14);
  showScreen(2);
});

// Grow yes / shrink no slightly each dodge for extra cuteness
function bumpYesNo() {
  state.noDodges++;
  const scale = Math.min(1 + state.noDodges * 0.08, 1.6);
  yesBtn.style.transform = `scale(${scale})`;
  const noScale = Math.max(1 - state.noDodges * 0.05, 0.6);
  noBtn.style.transform = `scale(${noScale})`;
  if (noHint) {
    noHint.textContent = noTaunts[Math.min(state.noDodges - 1, noTaunts.length - 1)];
  }
}

function dodgeNoButton(e) {
  const askRow = noBtn.parentElement;
  const rowRect = askRow.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  // pick a random offset within a safe area around the row
  const maxX = 140;
  const maxY = 90;
  const dx = (Math.random() * 2 - 1) * maxX;
  const dy = (Math.random() * 2 - 1) * maxY;

  noBtn.style.position = 'absolute';
  // base center of row
  const centerX = (rowRect.width / 2) - (btnRect.width / 2);
  const centerY = (rowRect.height / 2) - (btnRect.height / 2);
  noBtn.style.left = (centerX + dx) + 'px';
  noBtn.style.top  = (centerY + dy) + 'px';

  bumpYesNo();
}

// dodge on hover, focus, and tap (mobile)
noBtn.addEventListener('mouseenter', dodgeNoButton);
noBtn.addEventListener('focus', dodgeNoButton);
noBtn.addEventListener('touchstart', (e) => { e.preventDefault(); dodgeNoButton(e); }, { passive: false });
// if somehow clicked, still dodge
noBtn.addEventListener('click', (e) => { e.preventDefault(); dodgeNoButton(e); });

// ---------- screens 2 & 3: option selection ----------
function wireOptions(containerId, key, nextBtnSelector) {
  const container = document.getElementById(containerId);
  const nextBtn = container.parentElement.querySelector('.next-btn');

  container.querySelectorAll('.option').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
      btn.classList.add('selected');
      state[key] = btn.dataset.value;
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener('click', () => {
    const next = parseInt(nextBtn.dataset.next, 10);
    if (next === 4) {
      renderSummary();
      burstHearts(30);
      submitToTelegram();
    }
    showScreen(next);
  });
}

wireOptions('dateOptions', 'date');
wireOptions('whenOptions', 'when');

// ---------- screen 4: summary ----------
function renderSummary() {
  document.getElementById('sumDate').textContent = state.date || '—';
  document.getElementById('sumWhen').textContent = state.when || '—';
}

// Fire-and-forget submission to the Telegram proxy.
// Silent on failure so the celebration screen still feels magical.
function submitToTelegram() {
  if (state.submitted) return;
  state.submitted = true;
  try {
    fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: state.date,
        when: state.when,
        noDodges: state.noDodges,
        screen: `${screen.width}×${screen.height} @${window.devicePixelRatio || 1}x`,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        lang: navigator.language || '',
        referrer: document.referrer || '',
      }),
      keepalive: true,
    }).catch(() => { /* silent */ });
  } catch (_) { /* silent */ }
}

// ---------- restart ----------
document.getElementById('restartBtn').addEventListener('click', () => {
  state.date = null;
  state.when = null;
  state.noDodges = 0;
  state.submitted = false;
  // reset selections
  document.querySelectorAll('.option.selected').forEach(o => o.classList.remove('selected'));
  document.querySelectorAll('.next-btn').forEach(b => b.disabled = true);
  // reset no-button
  noBtn.style.position = '';
  noBtn.style.left = '';
  noBtn.style.top  = '';
  noBtn.style.transform = '';
  yesBtn.style.transform = '';
  noHint.textContent = '';
  showScreen(1);
});

// ---------- floating hearts ----------
const heartChars = ['💖','💕','💘','💝','✨','🌸','💗'];
function burstHearts(count = 20) {
  const container = document.querySelector('.floating-hearts');
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
    span.style.left = Math.random() * 100 + 'vw';
    span.style.fontSize = (16 + Math.random() * 18) + 'px';
    span.style.animationDuration = (2.5 + Math.random() * 2) + 's';
    span.style.animationDelay = (Math.random() * 0.5) + 's';
    container.appendChild(span);
    setTimeout(() => span.remove(), 5000);
  }
}
