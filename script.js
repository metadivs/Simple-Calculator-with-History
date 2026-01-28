// Improved input validation + percent operator + per-entry history delete
// + Toggle-sign (±) button to flip sign of expression or number

const display = document.querySelector('.display');
const keys = document.querySelector('.keys');

const historyListEl = document.querySelector('.history-list');
const historyEmptyEl = document.querySelector('.history-empty');
const clearHistoryBtn = document.querySelector('.btn-clear-history');

const HISTORY_KEY = 'calc_history_v1';
const HISTORY_MAX = 50;
const MAX_EXPRESSION_LENGTH = 120; // prevent excessively long input

let expression = '';
let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function updateDisplay() {
  display.value = expression === '' ? '0' : expression;
}

function flashMessage(msg = 'Invalid', ms = 700) {
  display.classList.add('flash');
  const prev = display.value;
  display.value = msg;
  setTimeout(() => {
    display.classList.remove('flash');
    updateDisplay();
  }, ms);
}

function isOperator(ch) {
  return ['+', '-', '*', '/'].includes(ch);
}

function lastChar() {
  return expression.slice(-1);
}

function unmatchedOpenParensCount(expr) {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  return open - close;
}

// Decide whether a character/value can be appended given current expression
function canAppend(v) {
  if (expression.length >= MAX_EXPRESSION_LENGTH) {
    flashMessage('Too long');
    return false;
  }

  // digits always allowed
  if (/^[0-9]$/.test(v)) {
    return true;
  }

  // decimal point rules: only one dot per numeric token
  if (v === '.') {
    // scan backward to start or last operator/paren
    let i = expression.length - 1;
    let token = '';
    while (i >= 0) {
      const c = expression[i];
      if (isOperator(c) || c === '(' || c === ')' || c === ' ') break;
      token = c + token;
      i--;
    }
    if (token.includes('.')) {
      flashMessage('Invalid');
      return false;
    }
    // If token is empty and previous is ')', don't allow '.' directly after ')'
    const last = lastChar();
    if (last === ')') {
      flashMessage('Invalid');
      return false;
    }
    return true;
  }

  // percent '%' rules:
  if (v === '%') {
    const last = lastChar();
    // must follow a digit or ')', and not follow another '%'
    if (!last || last === '(' || last === '.' || isOperator(last) || last === '%') {
      flashMessage('% invalid');
      return false;
    }
    return true;
  }

  // open parenthesis '(' rules:
  if (v === '(') {
    const last = lastChar();
    // Allow at start, after operator, or another '('
    if (expression === '' || isOperator(last) || last === '(') return true;
    // don't allow implicit multiplication: require explicit '*'
    flashMessage('Use * for ×');
    return false;
  }

  // close parenthesis ')' rules:
  if (v === ')') {
    // must have unmatched open '('
    if (unmatchedOpenParensCount(expression) <= 0) {
      flashMessage('No matching (');
      return false;
    }
    // last char must be a number, ')', or '%' (percent acts like a number token)
    const last = lastChar();
    if (last === '' || isOperator(last) || last === '(' || last === '.') {
      flashMessage('Invalid )');
      return false;
    }
    return true;
  }

  // operators (+ - * /)
  if (isOperator(v)) {
    const last = lastChar();

    // if empty expression, only allow unary minus
    if (expression === '') {
      if (v === '-') return true;
      flashMessage('Start with number');
      return false;
    }

    // if last is operator
    if (isOperator(last)) {
      // allow unary minus after operator (e.g. "5 * -3")
      if (v === '-' && last !== '-') return true;
      flashMessage('Invalid operator');
      return false;
    }

    // if last is '(', only allow unary minus
    if (last === '(') {
      if (v === '-') return true;
      flashMessage('Invalid after (');
      return false;
    }

    // if last is '.', disallow operator directly after dot
    if (last === '.') {
      flashMessage('Invalid');
      return false;
    }

    // if last is '%', that's fine -- percent acts like a numeric token
    return true;
  }

  // anything else is not allowed
  flashMessage('Invalid');
  return false;
}

function appendValue(v){
  // Map visible operators to JS equivalents (in case button uses symbols)
  const normalizedInput = v.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');

  if (!canAppend(normalizedInput)) return;

  // If starting a decimal token like ".5", prepend '0' for clarity
  if (normalizedInput === '.' && (expression === '' || lastChar() === '(')) {
    expression += '0.';
  } else {
    expression += normalizedInput;
  }
  updateDisplay();
}

function toggleSign() {
  // If empty, start a negative number
  if (expression === '') {
    expression = '-';
    updateDisplay();
    return;
  }

  // If expression already wrapped by the toggle wrapper "(-1)*(...)", unwrap it
  const WRAPPER_PREFIX = '(-1)*(';
  if (expression.startsWith(WRAPPER_PREFIX) && expression.endsWith(')')) {
    expression = expression.slice(WRAPPER_PREFIX.length, -1);
    updateDisplay();
    return;
  }

  // If expression is a simple number (possibly with a trailing percent), toggle its sign directly
  // Match optional leading -, digits, optional decimal, optional %, and nothing else
  if (/^-?\d+(\.\d+)?%?$/.test(expression)) {
    if (expression.startsWith('-')) {
      expression = expression.slice(1);
    } else {
      expression = '-' + expression;
    }
    updateDisplay();
    return;
  }

  // For complex expressions, wrap the whole expression so its sign flips
  expression = '(-1)*(' + expression + ')';
  updateDisplay();
}

function clearAll(){
  expression = '';
  updateDisplay();
}

function deleteLast(){
  expression = expression.slice(0, -1);
  updateDisplay();
}

function addToHistory(expr, res){
  history.unshift({ expr, res: String(res), at: new Date().toISOString() });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  saveHistory();
  renderHistory();
}

function deleteHistoryEntry(index) {
  if (!Number.isFinite(index) || index < 0 || index >= history.length) return;
  history.splice(index, 1);
  saveHistory();
  renderHistory();
}

function clearHistory(){
  history = [];
  saveHistory();
  renderHistory();
}

function renderHistory(){
  historyListEl.innerHTML = '';
  if (!history || history.length === 0) {
    historyEmptyEl.style.display = 'block';
    return;
  }
  historyEmptyEl.style.display = 'none';

  history.forEach((h, idx) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('role', 'listitem');
    li.dataset.index = idx;

    const exprSpan = document.createElement('span');
    exprSpan.className = 'history-expression';
    exprSpan.title = h.expr;
    exprSpan.textContent = h.expr;

    // right-side group: result + delete
    const right = document.createElement('div');
    right.className = 'history-right';

    const resSpan = document.createElement('span');
    resSpan.className = 'history-result';
    resSpan.textContent = h.res;

    const delBtn = document.createElement('button');
    delBtn.className = 'history-delete';
    delBtn.type = 'button';
    delBtn.title = 'Delete entry';
    delBtn.setAttribute('aria-label', `Delete history entry ${idx + 1}`);
    delBtn.dataset.index = idx;
    delBtn.textContent = '✕';

    right.appendChild(resSpan);
    right.appendChild(delBtn);

    li.appendChild(exprSpan);
    li.appendChild(right);
    historyListEl.appendChild(li);
  });
}

// Final validation and evaluation
function evaluateExpression(){
  if (expression.trim() === '') return;

  // Normalize Unicode operators to JS operators
  // Also translate percent (%) into multiplication by 0.01 for semantics
  // e.g. "50%" -> "50*0.01", "(20+30)%" -> "(20+30)*0.01"
  let normalized = expression.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');

  // Convert "%" to "*0.01"
  normalized = normalized.replace(/%/g, '*0.01');

  // Basic allowed characters after normalization
  if (!/^[0-9+\-*/().\s]+$/.test(normalized)) {
    flashMessage('Error');
    return;
  }

  // Ensure parentheses are balanced (checking on original expression is fine too)
  if (unmatchedOpenParensCount(expression) !== 0) {
    flashMessage('Unbalanced ()');
    return;
  }

  // Expression should not end with an operator or '(' or '.'
  // Note: '%' is allowed at the end because it's converted above to '*0.01'
  const last = expression.trim().slice(-1);
  if (!last || isOperator(last) || last === '(' || last === '.') {
    flashMessage('Incomplete');
    return;
  }

  try {
    // Evaluate in a restricted Function scope
    const result = Function('"use strict"; return (' + normalized + ')')();
    if (result === undefined || Number.isNaN(result)) {
      flashMessage('Error');
      return;
    }

    // Format result
    let resultStr = String(result);
    if (Number.isFinite(result) && resultStr.indexOf('.') >= 0) {
      resultStr = parseFloat(result).toPrecision(12).replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
      if (!resultStr.includes('e')) {
        resultStr = resultStr.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1');
      }
    }

    addToHistory(expression, resultStr);
    expression = resultStr;
    updateDisplay();
  } catch (e) {
    flashMessage('Error');
  }
}

// Handle button clicks
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  if (action === 'clear') { clearAll(); return; }
  if (action === 'delete') { deleteLast(); return; }
  if (action === 'evaluate') { evaluateExpression(); return; }
  if (action === 'toggle-sign') { toggleSign(); return; }

  if (val) appendValue(val);
});

// History click handling: clicking the delete button removes an entry;
// clicking elsewhere on the item loads that expression into the calculator.
historyListEl.addEventListener('click', (e) => {
  const del = e.target.closest('.history-delete');
  if (del) {
    // delete requested
    const idx = Number(del.dataset.index);
    deleteHistoryEntry(idx);
    return;
  }

  // otherwise, load the entry
  const li = e.target.closest('.history-item');
  if (!li) return;
  const idx = Number(li.dataset.index);
  if (Number.isFinite(idx) && history[idx]) {
    expression = history[idx].expr;
    updateDisplay();
    display.focus();
  }
});

// Clear history button
clearHistoryBtn.addEventListener('click', (e) => {
  clearHistory();
});

// Keyboard support with validation
document.addEventListener('keydown', (e) => {
  const key = e.key;

  if ((/^[0-9]$/).test(key)) { appendValue(key); return; }
  if (key === 'Enter' || key === '=') { e.preventDefault(); evaluateExpression(); return; }
  if (key === 'Backspace') { deleteLast(); return; }
  if (key === 'Escape') { clearAll(); return; }

  // operators and punctuation allowed: + - * / . ( ) %
  if (['+','-','*','/','.','(',')','%'].includes(key)) { appendValue(key); return; }

  // allow using comma as decimal on some keyboards
  if (key === ',') { appendValue('.'); return; }
});

updateDisplay();
renderHistory();