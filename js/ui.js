/* ============================================================
   All2App — shared UI feedback helpers (toast + confirm).
   Self-contained so it works on the main page and on the
   generated download pages (which do not load css/style.css).
   Exposes window.A2AUI = { toast, confirm }.
   ============================================================ */
(function () {
  'use strict';
  if (window.A2AUI) return;

  var STYLE_ID = 'a2a-ui-style';
  var CSS = [
    '.a2a-toast-stack{position:fixed;left:50%;bottom:max(20px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:1000;display:flex;flex-direction:column;align-items:center;gap:8px;width:min(92vw,420px);pointer-events:none}',
    '.a2a-toast{pointer-events:auto;display:flex;align-items:center;gap:10px;width:100%;padding:10px 10px 10px 14px;border-radius:12px;border:1px solid var(--line-strong,rgba(30,25,20,.12));background:var(--paper-strong,#fbf8f3);color:var(--ink,#1e1914);font:400 .92rem/1.45 var(--font-sans,-apple-system,BlinkMacSystemFont,sans-serif);box-shadow:var(--shadow-pop,0 8px 28px -12px rgba(30,25,20,.18));opacity:0;transform:translateY(6px);transition:opacity .16s ease,transform .16s ease}',
    '.a2a-toast.is-in{opacity:1;transform:none}',
    '.a2a-toast::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:var(--accent,#c97953)}',
    '.a2a-toast[data-type=success]::before{background:var(--success,#4f715a)}',
    '.a2a-toast[data-type=error]{border-color:rgba(var(--danger-rgb,160,83,61),.35)}',
    '.a2a-toast[data-type=error]::before{background:var(--danger,#a0533d)}',
    '.a2a-toast-msg{flex:1;min-width:0;overflow-wrap:anywhere}',
    '.a2a-toast-close{flex:none;display:grid;place-items:center;width:28px;height:28px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--ink-faint,rgba(30,25,20,.5));font-size:1.1rem;line-height:1;cursor:pointer;transition:background .16s ease,color .16s ease}',
    '.a2a-toast-close:hover{background:var(--paper-deep,rgba(30,25,20,.06));color:var(--ink,#1e1914)}',
    '.a2a-confirm{position:fixed;inset:0;z-index:1001;display:flex;align-items:center;justify-content:center;padding:20px;background:var(--scrim,rgba(30,25,20,.32))}',
    '.a2a-confirm-card{width:min(400px,100%);padding:24px;border-radius:16px;border:1px solid var(--line,rgba(30,25,20,.1));background:var(--paper-strong,#fbf8f3);color:var(--ink,#1e1914);box-shadow:var(--shadow-pop,0 8px 28px -12px rgba(30,25,20,.18));font:400 .95rem/1.55 var(--font-sans,-apple-system,BlinkMacSystemFont,sans-serif)}',
    '.a2a-confirm-msg{margin:0 0 20px;overflow-wrap:anywhere}',
    '.a2a-confirm-actions{display:flex;justify-content:flex-end;gap:8px}',
    '.a2a-confirm-actions button{min-height:36px;padding:0 14px;border-radius:8px;border:1px solid var(--line-strong,rgba(30,25,20,.16));background:transparent;color:var(--ink,#1e1914);font:500 .9rem var(--font-sans,-apple-system,BlinkMacSystemFont,sans-serif);cursor:pointer;transition:background .16s ease,border-color .16s ease}',
    '.a2a-confirm-actions button:hover{background:var(--paper-deep,rgba(30,25,20,.06))}',
    '.a2a-confirm-actions .a2a-confirm-ok{border-color:var(--ink,#1e1914);background:var(--ink,#1e1914);color:var(--on-ink,#fbf8f3)}',
    '.a2a-confirm-actions .a2a-confirm-ok:hover{border-color:var(--ink-hover,#2e2620);background:var(--ink-hover,#2e2620)}',
    '.a2a-confirm-actions .a2a-confirm-ok.is-danger,.a2a-confirm-actions .a2a-confirm-ok.is-danger:hover{border-color:var(--danger,#a0533d);background:var(--danger,#a0533d)}',
    '.a2a-confirm-actions button:focus-visible,.a2a-toast-close:focus-visible{outline:2px solid var(--accent,#c97953);outline-offset:2px}',
    '@media (prefers-reduced-motion:reduce){.a2a-toast{transition:none}}'
  ].join('\n');

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function label(key, fallback) {
    if (window.I18n && typeof window.I18n.t === 'function') {
      var value = window.I18n.t(key);
      if (value && value !== key) return value;
    }
    return fallback;
  }

  var stack = null;
  function getStack() {
    if (stack && document.body.contains(stack)) return stack;
    ensureStyle();
    stack = document.createElement('div');
    stack.className = 'a2a-toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
    return stack;
  }

  function toast(message, options) {
    var opts = options || {};
    var type = opts.type || 'info';
    var duration = typeof opts.duration === 'number' ? opts.duration : (type === 'error' ? 6000 : 3200);
    var host = getStack();
    while (host.children.length >= 3) host.removeChild(host.firstChild);

    var el = document.createElement('div');
    el.className = 'a2a-toast';
    el.setAttribute('data-type', type);
    if (type === 'error') el.setAttribute('role', 'alert');
    var msg = document.createElement('span');
    msg.className = 'a2a-toast-msg';
    msg.textContent = String(message == null ? '' : message);
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'a2a-toast-close';
    close.setAttribute('aria-label', label('ui.close', 'Close'));
    close.textContent = '\u00d7';
    el.appendChild(msg);
    el.appendChild(close);
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-in'); });

    var timer = null;
    function dismiss() {
      if (timer) clearTimeout(timer);
      el.classList.remove('is-in');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 200);
    }
    function arm() { if (duration > 0) timer = setTimeout(dismiss, duration); }
    close.addEventListener('click', dismiss);
    el.addEventListener('mouseenter', function () { if (timer) clearTimeout(timer); });
    el.addEventListener('mouseleave', arm);
    arm();
    return dismiss;
  }

  function confirmDialog(message, options) {
    var opts = options || {};
    ensureStyle();
    return new Promise(function (resolve) {
      var previous = document.activeElement;
      var overlay = document.createElement('div');
      overlay.className = 'a2a-confirm';
      var card = document.createElement('div');
      card.className = 'a2a-confirm-card';
      card.setAttribute('role', 'alertdialog');
      card.setAttribute('aria-modal', 'true');
      var msg = document.createElement('p');
      msg.className = 'a2a-confirm-msg';
      msg.id = 'a2a-confirm-msg-' + Date.now();
      msg.textContent = String(message == null ? '' : message);
      card.setAttribute('aria-describedby', msg.id);
      var actions = document.createElement('div');
      actions.className = 'a2a-confirm-actions';
      var cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'a2a-confirm-cancel';
      cancel.textContent = opts.cancelText || label('ui.cancel', 'Cancel');
      var ok = document.createElement('button');
      ok.type = 'button';
      ok.className = 'a2a-confirm-ok' + (opts.danger ? ' is-danger' : '');
      ok.textContent = opts.okText || label('ui.confirm', 'OK');
      actions.appendChild(cancel);
      actions.appendChild(ok);
      card.appendChild(msg);
      card.appendChild(actions);
      overlay.appendChild(card);
      document.body.appendChild(overlay);

      function finish(result) {
        document.removeEventListener('keydown', onKey, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (previous && typeof previous.focus === 'function') {
          try { previous.focus(); } catch (_e) { /* element gone */ }
        }
        resolve(result);
      }
      function onKey(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          finish(false);
        } else if (event.key === 'Tab') {
          event.preventDefault();
          (document.activeElement === ok ? cancel : ok).focus();
        }
      }
      cancel.addEventListener('click', function () { finish(false); });
      ok.addEventListener('click', function () { finish(true); });
      overlay.addEventListener('click', function (event) { if (event.target === overlay) finish(false); });
      document.addEventListener('keydown', onKey, true);
      (opts.danger ? cancel : ok).focus();
    });
  }

  window.A2AUI = { toast: toast, confirm: confirmDialog };
})();
