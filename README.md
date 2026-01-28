# Simple Calculator with History

A minimal, accessible calculator built with HTML, CSS and JavaScript. Features a history panel (persistent via `localStorage`), input validation, percent support, sign toggle (±), and per-entry history deletion.

Files
- `index.html` — UI and layout
- `styles.css` — Styling and responsive layout
- `script.js` — Input validation, evaluation, history management

Quick start
1. Save `index.html`, `styles.css`, and `script.js` in the same folder.
2. Open `index.html` in any modern browser.

Features
- Basic arithmetic: `+`, `-`, `*`, `/`
- Parentheses for grouping
- Percent operator `%` — treated as multiply-by-0.01 (e.g. `50%` → `0.5`)
- Toggle-sign (±) button — flips sign of a number or entire expression
- Keyboard support (numbers, operators, Enter, Backspace, Escape)
- Input validation to prevent common invalid sequences
- History panel showing recent calculations (most recent first)
  - Click a history entry to load it into the calculator
  - Delete an individual history entry with its ✕ button
  - Clear all history with the "Clear" button
- History persists in browser `localStorage` under key `calc_history_v1` (max 50 entries)

How to use

Calculator controls (buttons)
- Numbers: 0–9
- Decimal: `.`
- Operators: `+`, `−` (minus), `×` (multiply), `÷` (divide)
- Percent: `%`
- Toggle sign: `±` (flips the sign of the current number or expression)
- Delete: `⌫` (backspace — removes last character)
- All clear: `AC` (clears the expression)
- Evaluate: `=` (computes the result)

Keyboard shortcuts
- Type digits `0-9` and operators `+ - * /`
- `.` to enter decimal
- `%` to insert percent
- `Enter` or `=` to evaluate
- `Backspace` to delete last character
- `Esc` to clear all

History behavior
- Each successful evaluation is saved to the history as `expression = result`.
- Click a history row to load its expression into the input for editing or re-evaluation.
- Click the small ✕ button on a history row to delete only that entry.
- Click "Clear" in the history header to remove all saved entries.
- History is stored in `localStorage` (so it remains across browser reloads).

Percent operator details
- `%` is interpreted as multiplication by 0.01 when evaluating.
  - `50%` → `0.5`
  - `50% * 200` → `100`
  - `(20+30)%` → `0.5`
- Validation prevents invalid placements of `%` (it must follow a number or `)`).

Input validation highlights
- Prevents consecutive operators (except unary minus where allowed)
- Only one `.` per numeric token
- Balanced parentheses enforced before evaluation
- No implicit multiplication — type `*` explicitly (e.g. `2*(`)
- Max expression length enforced to avoid accidental huge inputs
- Brief on-screen feedback ("Invalid", "Incomplete", etc.) appears when an invalid entry is attempted

Examples
- 12 + 7 → press `=` → `19`
- 50% → press `=` → `0.5`
- 50% * 200 → press `=` → `100`
- Press `±` while `25` is shown → becomes `-25`
- Enter `2+3`, click history entry `2+3=5` to load `2+3` again

Customization ideas
- Change history max entries: edit `HISTORY_MAX` in `script.js`
- Change storage key (to avoid conflicts): edit `HISTORY_KEY` in `script.js`
- Add implicit multiplication behavior (auto-insert `*` before `(`) — modify `canAppend()` in `script.js`
- Add more math functions (sqrt, pow, etc.) — extend evaluation logic carefully and update UI

Security note
The calculator evaluates user-entered arithmetic using a restricted `Function` call. The code limits allowed characters and validates the expression before evaluation to reduce risk. Do not add arbitrary identifiers or function names to the evaluated expression unless you carefully extend the validation and evaluation strategy.

Troubleshooting
- If a calculation doesn't evaluate, check for:
  - Unbalanced parentheses
  - Trailing operator or incomplete token (e.g. ends with `.`)
  - Invalid characters (only digits, operators, `%`, parentheses and `.` are allowed)
- To reset history manually, clear site storage for the page in your browser or run:
  - In browser console: `localStorage.removeItem('calc_history_v1')`

License
Use and modify as you like.
