/* Modern Calculator logic (script.js) */
(function(){
  const exprEl = document.getElementById('expr');
  const valueEl = document.getElementById('value');
  const themeBtn = document.getElementById('themeBtn');
  const keys = document.querySelector('.keys');

  let expression = '';
  let justEvaluated = false;

  function formatNumber(n){
    if(!isFinite(n)) return '∞';
    const s = n.toString();
    if(/e\+|e\-/.test(s)) return n.toPrecision(10).replace(/\.?0+$/,'');
    const [i,d] = s.split('.');
    const iFmt = Number(i).toLocaleString(undefined);
    return d ? `${iFmt}.${d}` : iFmt;
  }

  function lastNumberSegment(str){
    const match = str.match(/([\d.]+)(?!.*[\d.])/);
    return match ? match[1] : '';
  }

  function applyPercent(str){
    const seg = lastNumberSegment(str);
    if(!seg) return str;
    const start = str.lastIndexOf(seg);
    const num = parseFloat(seg);
    if(isNaN(num)) return str;
    const repl = (num/100).toString();
    return str.slice(0,start) + repl + str.slice(start + seg.length);
  }

  function sanitize(expr){
    return expr.replace(/[^0-9+\-*/().]/g,'');
  }

  function evaluate(expr){
    if(!expr) return 0;
    try{
      const safe = sanitize(expr);
      if(/^[*/)]/.test(safe)) return NaN;
      if(/([+*/.-])\1/.test(safe.replace(/--/g,''))) return NaN;
      const result = Function("\"use strict\"; return ("+safe+")")();
      return result;
    }catch(e){
      return NaN;
    }
  }

  function updateDisplay(){
    exprEl.textContent = expression || '\u00A0';
    const val = evaluate(expression);
    valueEl.textContent = Number.isFinite(val) ? formatNumber(val) : 'Error';
  }

  function appendValue(v){
    if(justEvaluated && /[0-9.]/.test(v)) expression = '';
    justEvaluated = false;
    expression += v;
    updateDisplay();
  }

  function handleAction(action){
    switch(action){
      case 'clear': expression=''; justEvaluated=false; updateDisplay(); break;
      case 'back': expression = expression.slice(0,-1); updateDisplay(); break;
      case 'equals': {
        const val = evaluate(expression);
        if(!Number.isFinite(val)){ valueEl.textContent = 'Error'; return }
        expression = String(val); justEvaluated = true; updateDisplay(); break;
      }
      case 'sign': {
        const seg = lastNumberSegment(expression);
        if(!seg) return;
        const start = expression.lastIndexOf(seg);
        const num = parseFloat(seg); if(isNaN(num)) return;
        const toggled = (-num).toString();
        expression = expression.slice(0,start) + toggled + expression.slice(start + seg.length);
        updateDisplay(); break;
      }
      case 'square': {
        const seg = lastNumberSegment(expression) || valueEl.textContent;
        const start = expression.lastIndexOf(seg);
        const num = parseFloat(seg); if(isNaN(num)) return;
        const sq = (num * num).toString();
        if(start >= 0) expression = expression.slice(0,start) + sq + expression.slice(start + seg.length); else expression = sq;
        updateDisplay(); break;
      }
      case 'sqrt': {
        const seg = lastNumberSegment(expression) || valueEl.textContent;
        const start = expression.lastIndexOf(seg);
        const num = parseFloat(seg); if(isNaN(num) || num < 0){ valueEl.textContent='Error'; return }
        const sqr = Math.sqrt(num).toString();
        if(start >= 0) expression = expression.slice(0,start) + sqr + expression.slice(start + seg.length); else expression = sqr;
        updateDisplay(); break;
      }
      case 'paren': {
        const open = (expression.match(/\(/g) || []).length;
        const close = (expression.match(/\)/g) || []).length;
        if(open <= close || /[+\-*/(]$/.test(expression) || expression === '') expression += '('; else expression += ')';
        updateDisplay(); break;
      }
    }
  }

  keys.addEventListener('click',(e)=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const val = btn.dataset.value; const action = btn.dataset.action;
    if(val === '%'){ expression = applyPercent(expression); updateDisplay(); return }
    if(action){ handleAction(action); return }
    if(val){ if(val === '.'){ const seg = lastNumberSegment(expression); if(seg.includes('.')) return; } appendValue(val); }
  });

  window.addEventListener('keydown',(e)=>{
    const k = e.key; if(/^[0-9]$/.test(k)) return appendValue(k);
    if(k === '.') return appendValue('.');
    if(k === '+') return appendValue('+');
    if(k === '-') return appendValue('-');
    if(k === '*') return appendValue('*');
    if(k === '/') return appendValue('/');
    if(k === 'Enter' || k === '=') return handleAction('equals');
    if(k === 'Backspace') return handleAction('back');
    if(k === 'Escape') return handleAction('clear');
    if(k === '%'){ expression = applyPercent(expression); updateDisplay(); }
  });

  function setTheme(dark){ const root = document.documentElement; if(dark){ root.classList.add('dark'); themeBtn.textContent='Dark'; themeBtn.setAttribute('aria-pressed','true'); } else { root.classList.remove('dark'); themeBtn.textContent='Light'; themeBtn.setAttribute('aria-pressed','false'); } localStorage.setItem('calc_theme_dark', dark ? '1':'0'); }

  themeBtn.addEventListener('click', ()=> setTheme(!document.documentElement.classList.contains('dark')));
  const saved = localStorage.getItem('calc_theme_dark'); const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved ? saved === '1' : prefersDark);
  updateDisplay();
})();
