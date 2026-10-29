type Theme = 'system' | 'light' | 'dark';
const modes: Theme[] = ['system', 'light', 'dark'];
const labels = { system: '시스템', light: '라이트', dark: '다크' };
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const button = document.querySelector<HTMLButtonElement>('#theme-toggle');
let preference: Theme = 'system';
try {
  const saved = localStorage.getItem('happypite:theme');
  if (saved === 'light' || saved === 'dark') preference = saved;
} catch {}

function applyTheme(announce = false) {
  const dark = preference === 'dark' || (preference === 'system' && systemTheme.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const next = modes[(modes.indexOf(preference) + 1) % modes.length];
  const description = `현재 ${labels[preference]} 모드 · 클릭하면 ${labels[next]} 모드`;
  button?.setAttribute('aria-label', description);
  button?.setAttribute('title', description);
  document.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach(icon => { icon.hidden = icon.dataset.themeIcon !== preference; });
  const status = document.querySelector('#theme-status');
  if (announce && status) status.textContent = `${labels[preference]} 모드로 변경했습니다.`;
}
button?.addEventListener('click', () => {
  preference = modes[(modes.indexOf(preference) + 1) % modes.length];
  try { localStorage.setItem('happypite:theme', preference); } catch {}
  applyTheme(true);
});
systemTheme.addEventListener('change', () => { if (preference === 'system') applyTheme(); });
window.addEventListener('storage', event => {
  if (event.key !== null && event.key !== 'happypite:theme') return;
  const saved = event.key === null ? null : event.newValue;
  preference = saved === 'light' || saved === 'dark' ? saved : 'system';
  applyTheme();
});
document.querySelector('[data-to-top]')?.addEventListener('click', event => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
applyTheme();
