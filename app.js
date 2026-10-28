import { SessionClock, validEstimate, readRecords, saveRecords, nextTarget, STORAGE_KEY } from './core.js';

const panel = document.getElementById('panel');
const announcer = document.getElementById('announcer');
const cards = [...document.querySelectorAll('[data-exp]')];
const historyList = document.getElementById('history-list');
const clearButton = document.getElementById('clear-history');
let storage;
try { storage = window.localStorage; } catch { /* Private/blocked storage: session only. */ }
let records = storage ? readRecords(storage) : [];
let experiment = 'wait';
let phase = 'idle';
let clock = null;
let timer = null;
let actual = 0;
let score = 0;
let target = 0;
let clearPending = false;
const names = { wait: 'WAIT', flow: 'FLOW', count: 'COUNT' };
const descriptions = {
  wait: '何もせず、白い点を見つめてください。時計は表示されません。60秒後、感じた長さを答えます。',
  flow: '白く光る数字を押してください。正解すると、別の数字が光ります。60秒後、感じた長さを答えます。',
  count: '時計を見ずに、60秒経ったと思った瞬間に止めてください。60秒を過ぎても、自動では止まりません。'
};
const fmt = value => Number(value.toFixed(1)).toLocaleString('ja-JP', { maximumFractionDigits: 1 });
const signed = value => `${value > 0 ? '+' : value < 0 ? '−' : '±'}${fmt(Math.abs(value))}`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function announce(message) { announcer.textContent = message; }
function cleanup() {
  clearTimeout(timer);
  timer = null;
  if (clock?.status === 'running') clock.cancel();
  clock = null;
  cards.forEach(card => { card.disabled = false; });
  document.body.classList.remove('experiment-running');
}
function render(markup, focus = true) {
  panel.innerHTML = markup;
  const heading = panel.querySelector('h2');
  if (focus && heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}
function button(label, action, className = 'primary') {
  const element = document.createElement('button');
  element.type = 'button'; element.className = className; element.textContent = label;
  element.addEventListener('click', action);
  panel.appendChild(element);
  return element;
}
function select(kind, scroll = true) {
  if (!Object.hasOwn(names, kind)) return;
  cleanup(); experiment = kind; phase = 'ready';
  render(`<div class="eyebrow">EXPERIMENT / ${names[kind]}</div><h2>${names[kind]}.</h2><p>${descriptions[kind]}</p><p class="fineprint">画面の切替・ロック・大きな動作遅延で中断します。中断した結果は記録しません。${kind === 'count' ? '最大5分で終了します。' : ''}</p>`);
  button('実験をはじめる', begin);
  if (scroll) panel.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'center' });
}
function begin() {
  if (phase !== 'ready' || document.hidden) return;
  phase = 'running'; score = 0;
  cards.forEach(card => { card.disabled = true; });
  document.body.classList.add('experiment-running');
  if (experiment === 'wait') {
    render('<h2 class="sr-only">WAIT 実験中</h2><div class="dot" aria-hidden="true"></div>', false);
  } else if (experiment === 'count') {
    render('<div class="eyebrow">LISTEN TO YOUR INNER CLOCK</div><h2>今だ、と思ったら。</h2>', false);
    button('60秒経った', stopCount).id = 'stop-count';
  } else {
    render('<div class="eyebrow">TAP THE LIT NUMBER</div><h2><span class="sr-only">正解タップ数 </span><span id="score">0</span></h2><div id="game" class="game" role="group" aria-label="白い数字を押してください"></div>', false);
    const game = document.getElementById('game');
    target = Math.floor(Math.random() * 8);
    for (let index = 0; index < 8; index++) {
      const tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'tile'; tile.textContent = index + 1;
      tile.addEventListener('click', () => {
        if (phase !== 'running' || !checkClock() || index !== target) return;
        score += 1;
        target = nextTarget(target);
        document.getElementById('score').textContent = score;
        paint();
      });
      game.appendChild(tile);
    }
    function paint() {
      [...game.children].forEach((tile, index) => {
        tile.classList.toggle('active', index === target);
        tile.setAttribute('aria-label', `${index + 1}${index === target ? '、今のターゲット' : ''}`);
      });
    }
    paint();
  }
  const abort = button('実験を中断', () => interrupt('cancel'), 'abort');
  clock = new SessionClock(experiment);
  (document.getElementById('stop-count') || panel.querySelector('.tile.active') || abort).focus({ preventScroll: true });
  announce(`${names[experiment]} の実験を開始しました。`);
  schedule();
}
function schedule() { timer = setTimeout(() => { if (checkClock()) schedule(); }, 50); }
function checkClock() {
  if (phase !== 'running' || !clock) return false;
  const sample = clock.sample(document.hidden);
  if (sample.status === 'interrupted') { interrupt(sample.reason); return false; }
  if (sample.status === 'complete') { actual = sample.elapsedMs / 1000; cleanup(); estimate(); return false; }
  return true;
}
function stopCount() {
  if (phase !== 'running' || experiment !== 'count' || !clock) return;
  const sample = clock.stop(document.hidden);
  if (sample.status !== 'complete') { interrupt(sample.reason); return; }
  actual = sample.elapsedMs / 1000;
  if (actual < 0.1) { interrupt('cancel'); return; }
  cleanup(); result(60);
}
function interrupt(reason) {
  cleanup(); phase = 'interrupted';
  const message = reason === 'cancel' ? '実験を中断しました。' : reason === 'limit' ? '5分の上限に達したため、実験を終了しました。' : reason === 'hidden' ? '画面を離れたため、計測を終了しました。' : '端末の休止や動作の遅れを検出したため、計測を終了しました。';
  render(`<div class="eyebrow">EXPERIMENT INTERRUPTED</div><h2>時間が途切れました。</h2><p>${message}<br>この回の結果は記録されていません。</p>`);
  button('もう一度', () => select(experiment, false));
  announce(message);
}
function estimate() {
  phase = 'estimate';
  render('<div class="eyebrow">THE MINUTE HAS PASSED</div><h2>何秒に感じましたか。</h2><form id="estimate-form" novalidate><label for="estimate">感じた時間（秒）</label><div class="estimate-field"><input id="estimate" type="number" inputmode="decimal" min="0.1" max="3600" step="0.1" placeholder="秒数を入力" required aria-describedby="estimate-help estimate-error"><span aria-hidden="true">秒</span></div><p id="estimate-help" class="fineprint">0.1〜3,600秒の間で、直感で答えてください。</p><p id="estimate-error" class="error" role="alert"></p><button class="primary" type="submit">結果を見る</button></form>');
  document.getElementById('estimate-form').addEventListener('submit', event => {
    event.preventDefault();
    if (phase !== 'estimate') return;
    const input = document.getElementById('estimate');
    const felt = validEstimate(input.value);
    if (felt === null) {
      document.getElementById('estimate-error').textContent = '0.1〜3,600の数値を秒単位で入力してください。';
      input.setAttribute('aria-invalid', 'true'); input.focus(); return;
    }
    result(felt);
  });
  button('記録せず展示へ戻る', () => select(experiment, false), 'secondary');
  announce('60秒が過ぎました。感じた秒数を入力してください。');
}
function result(felt) {
  if (!['running', 'estimate'].includes(phase)) return;
  phase = 'result';
  const isCount = experiment === 'count';
  const delta = isCount ? actual - 60 : felt - actual;
  const second = isCount ? actual : felt;
  const scale = Math.max(60, actual, felt);
  const message = Math.abs(delta) < 0.05 ? 'ほぼ同じ長さでした。' : isCount
    ? (delta > 0 ? '60秒より遅く止めました。' : '60秒より早く止めました。')
    : (delta > 0 ? '実際より長く感じました。' : '実際より短く感じました。');
  render(`<div class="eyebrow">YOUR SUBJECTIVE TIME / ${names[experiment]}</div><h2>あなたの60秒。</h2><div class="stats"><div><b>${fmt(isCount ? 60 : actual)}</b><small>${isCount ? '目標の秒数' : '実際の計測（秒）'}</small></div><div><b>${fmt(second)}</b><small>${isCount ? 'あなたが止めた時間（秒）' : 'あなたが感じた時間（秒）'}</small></div></div><div class="comparison" role="img" aria-label="${isCount ? '目標60秒と停止時間' : '実時間と体感時間'}の差 ${signed(delta)}秒"><div style="width:${(isCount ? 60 : actual) / scale * 100}%"></div><div style="width:${second / scale * 100}%"></div></div><p class="result-delta">${signed(delta)}<span> 秒</span></p><p>${message}</p><p class="fineprint">${experiment === 'flow' ? `正解タップ ${score}回。<br>` : ''}これは一度の体験結果であり、性格や能力を示すものではありません。<br>ブラウザでの計測には、描画や操作の遅れが含まれます。</p>`);
  const record = { experiment, felt, actual, score, at: new Date().toISOString() };
  records = [...records, record].slice(-100);
  const saved = storage && saveRecords(storage, records);
  const note = document.createElement('p'); note.className = 'fineprint';
  note.textContent = saved ? 'このブラウザに保存しました。' : '保存機能を利用できないため、このページを開いている間だけ記録します。';
  panel.appendChild(note);
  renderHistory();
  button('もう一度体験する', () => select(experiment, false));
  button('別の展示を選ぶ', () => {
    cleanup(); phase = 'idle';
    render('<div class="eyebrow">NEXT EXPERIMENT</div><h2>次の60秒へ。</h2><p>上の展示から選んでください。</p>');
    cards[0].focus({ preventScroll: true }); cards[0].scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'center' });
  }, 'secondary');
  announce(`${names[experiment]} の結果。${message} 差は ${signed(delta)} 秒です。`);
}
function renderHistory() {
  historyList.replaceChildren();
  clearButton.hidden = records.length === 0;
  document.getElementById('history-empty').hidden = records.length > 0;
  for (const record of records.slice(-12).reverse()) {
    const row = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = names[record.experiment];
    const value = document.createElement('span');
    value.textContent = record.experiment === 'count' ? `目標 60秒 → 停止 ${fmt(record.actual)}秒` : `実際 ${fmt(record.actual)}秒 → 体感 ${fmt(record.felt)}秒`;
    row.append(title, value); historyList.appendChild(row);
  }
}
clearButton.addEventListener('click', () => {
  if (!clearPending) { clearPending = true; clearButton.textContent = '本当にすべて削除する'; return; }
  records = []; clearPending = false;
  let failed = false;
  try { storage?.removeItem(STORAGE_KEY); storage?.removeItem('1minutes-results'); } catch { failed = true; }
  clearButton.textContent = '記録をすべて削除'; renderHistory();
  announce(failed ? 'このページの記録を削除しました。保存済みデータの削除はブラウザ設定から行ってください。' : 'このブラウザの記録を削除しました。');
});
clearButton.addEventListener('blur', () => { clearPending = false; clearButton.textContent = '記録をすべて削除'; });
cards.forEach(card => card.addEventListener('click', () => select(card.dataset.exp)));
document.addEventListener('visibilitychange', () => { if (document.hidden && phase === 'running') interrupt('hidden'); });
window.addEventListener('pagehide', () => { if (phase === 'running') interrupt('hidden'); });
window.addEventListener('popstate', () => { if (phase === 'running') interrupt('hidden'); });
renderHistory();
