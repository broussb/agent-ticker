(function(){
  const cfg = window.TICKER_CONFIG || {};
  const storeKey = 'offTickerData';

  function qs(id){ return document.getElementById(id); }

  function parseNames(input){
    return input
      .split(/[,\n\r]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  function joinNames(arr){ return arr.join(', '); }

  function formatDateStr(date) {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date(date);
    const dayName = days[d.getDay()];
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${dayName} ${m}/${day}`;
  }

  function loadStore(){
    try {
      const raw = localStorage.getItem(storeKey);
      return raw ? JSON.parse(raw) : { names: [] };
    } catch { return { names: [] }; }
  }

  function saveStore(data){
    localStorage.setItem(storeKey, JSON.stringify({
      names: data.names || [],
      updatedAt: new Date().toISOString(),
    }));
  }

  function setPreview(labelText, names){
    const a = qs('previewA');
    const b = qs('previewB');

    function buildNode(){
      const frag = document.createDocumentFragment();
      const prefix = document.createElement('span');
      prefix.textContent = `Off ${labelText}:`;
      frag.appendChild(prefix);

      if (!names || names.length === 0) {
        const none = document.createElement('span');
        none.textContent = ' (none)';
        frag.appendChild(none);
      } else {
        names.forEach((n, idx) => {
          const pill = document.createElement('span');
          pill.className = `name-pill c${idx % 8}`;
          pill.textContent = n;
          frag.appendChild(document.createTextNode(' '));
          frag.appendChild(pill);
        });
        frag.appendChild(document.createTextNode(' \u2022\u00A0'));
      }
      return frag;
    }

    a.replaceChildren(buildNode());
    b.replaceChildren(buildNode());
  }

  function initAuth(){
    const authCard = qs('authCard');
    const editorCard = qs('editorCard');
    const authMsg = qs('authMsg');

    qs('loginBtn').addEventListener('click', () => {
      const pin = qs('pin').value.trim();
      if (cfg.USE_NETLIFY_FUNCTIONS) {
        // For server mode we can't validate without a request; optimistically proceed and show errors on save/load
        authCard.style.display = 'none';
        editorCard.style.display = '';
        initEditor(pin);
      } else {
        if (pin === String(cfg.ADMIN_PIN || '1234')) {
          authCard.style.display = 'none';
          editorCard.style.display = '';
          initEditor(pin);
        } else {
          authMsg.textContent = 'Incorrect PIN.';
          authMsg.className = 'helper alert';
        }
      }
    });
  }

  async function initEditor(currentPin){
    const namesEl = qs('names');
    const saveMsg = qs('saveMsg');

    if (cfg.USE_NETLIFY_FUNCTIONS) {
      // Load from server
      try {
        const res = await fetch('/.netlify/functions/get-names', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        namesEl.value = joinNames(Array.isArray(data.names) ? data.names : []);
      } catch (e) {
        saveMsg.textContent = 'Failed to load names from server.';
        saveMsg.className = 'helper alert';
        namesEl.value = '';
      }
    } else {
      const stored = loadStore();
      namesEl.value = joinNames(stored.names);
    }

    const today = cfg.DATE_OVERRIDE ? cfg.DATE_OVERRIDE : new Date();
    const dateLabel = formatDateStr(today);

    function updatePreview(){
      const names = parseNames(namesEl.value);
      setPreview(dateLabel, names);
    }

    updatePreview();
    namesEl.addEventListener('input', updatePreview);

    qs('saveBtn').addEventListener('click', async () => {
      const names = parseNames(namesEl.value);
      if (cfg.USE_NETLIFY_FUNCTIONS) {
        try {
          const res = await fetch('/.netlify/functions/set-names', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Pin': currentPin || '',
            },
            body: JSON.stringify({ names }),
          });
          if (!res.ok) throw new Error(String(res.status));
          const data = await res.json();
          saveMsg.textContent = 'Saved to server! The ticker updates on next refresh.';
          saveMsg.className = 'helper success';
        } catch (e) {
          saveMsg.textContent = 'Save failed. Check PIN or network.';
          saveMsg.className = 'helper alert';
        }
      } else {
        saveStore({ names });
        saveMsg.textContent = 'Saved! The ticker will reflect updates on next refresh.';
        saveMsg.className = 'helper success';
      }
    });

    qs('clearBtn').addEventListener('click', () => {
      namesEl.value = '';
      updatePreview();
    });
  }

  window.addEventListener('DOMContentLoaded', initAuth);
})();
