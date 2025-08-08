(function(){
  const cfg = window.TICKER_CONFIG || {};
  const storeKey = 'offTickerData';

  function formatDateStr(date) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date(date);
    const dayName = days[d.getDay()];
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return { label: `${dayName} ${m}/${day}`, dayName, m, day };
  }

  async function fetchNetlifyNames() {
    const res = await fetch('/.netlify/functions/get-names', { cache: 'no-store' });
    if (!res.ok) throw new Error(`get-names failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.names) ? data.names : [];
  }

  async function fetchGoogleSheetNames() {
    if (!cfg.GOOGLE_SHEET_CSV_URL) return [];
    const res = await fetch(cfg.GOOGLE_SHEET_CSV_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    const text = await res.text();
    // Simple CSV: one name per row, ignore header if present
    return text
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter((s, i) => s && s.toLowerCase() !== 'names');
  }

  function readLocalNames() {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.names) ? parsed.names : [];
    } catch { return []; }
  }

  function setTickerContent(labelText, names) {
    const a = document.getElementById('tickerTextA');
    const b = document.getElementById('tickerTextB');
    const hasFixedLabel = Boolean(document.getElementById('tickerDateLabel'));

    function buildNode() {
      const frag = document.createDocumentFragment();
      if (!hasFixedLabel) {
        const prefix = document.createElement('span');
        prefix.textContent = `Off ${labelText}:`;
        frag.appendChild(prefix);
      }

      if (!names || names.length === 0) {
        const none = document.createElement('span');
        none.textContent = hasFixedLabel ? '(none)' : ' (none)';
        frag.appendChild(hasFixedLabel ? document.createTextNode(' ') : document.createTextNode(''));
        frag.appendChild(none);
      } else {
        names.forEach((n, idx) => {
          const pill = document.createElement('span');
          pill.className = `name-pill c${idx % 8}`;
          pill.textContent = n;
          // leading space before each pill
          frag.appendChild(document.createTextNode(' '));
          frag.appendChild(pill);
        });
        // spacer at end to separate loops
        frag.appendChild(document.createTextNode(' \u2022\u00A0'));
      }
      return frag;
    }

    a.replaceChildren(buildNode());
    b.replaceChildren(buildNode());

    const root = document.documentElement;
    const speed = Number(cfg.TICKER_SPEED_S || 25);
    root.style.setProperty('--ticker-speed-s', String(speed));
  }

  function status(msg, type) {
    const el = document.getElementById('status');
    if (!msg) {
      el.textContent = '';
      el.className = 'status';
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    el.textContent = msg;
    el.className = `status ${type||''}`;
  }

  async function init() {
    const todayStr = cfg.DATE_OVERRIDE ? cfg.DATE_OVERRIDE : new Date();
    const { label } = formatDateStr(todayStr);

    try {
      let names = [];
      if (cfg.USE_NETLIFY_FUNCTIONS) {
        names = await fetchNetlifyNames();
      } else if (cfg.USE_GOOGLE_SHEET) {
        names = await fetchGoogleSheetNames();
      } else {
        names = readLocalNames();
      }

      setTickerContent(label, names);
      // Clear any previous status on success
      status('', '');
    } catch (e) {
      console.error(e);
      status('Failed to load names. Check configuration or network.', 'alert');
      setTickerContent(label + ' (error)', []);
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
