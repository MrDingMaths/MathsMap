const KEY = 'mathsmap.theme.v1';

function saved() {
  try { return localStorage.getItem(KEY) || 'dark'; } catch { return 'dark'; }
}

class ThemeStore {
  current = $state(saved());

  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, this.current); } catch {}
    document.documentElement.setAttribute('data-theme', this.current);
  }
}

export const theme = new ThemeStore();

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', theme.current);
}
