// Share only fixed public exhibition URLs. Never inspect location, history or storage.
export const SHARE_PAGES = Object.freeze({
  index: { title: '1minutes — ONE MINUTE FOREVER', url: 'https://djnaoyaman.github.io/1minutes/' },
  frequency: { title: 'FREQUENCY — 1minutes', url: 'https://djnaoyaman.github.io/1minutes/frequency.html' },
  breath: { title: 'BREATH — 1minutes', url: 'https://djnaoyaman.github.io/1minutes/breath.html' },
  sensory: { title: 'SENSORY LAB — 1minutes', url: 'https://djnaoyaman.github.io/1minutes/sensory.html' }
});

export function mountSharePanel(root, { nav = navigator, lifecycle = window } = {}) {
  const page = Object.hasOwn(SHARE_PAGES, root.dataset.sharePage) ? SHARE_PAGES[root.dataset.sharePage] : null;
  if (!page) return null;
  const share = root.querySelector('[data-share-native]');
  const copy = root.querySelector('[data-share-copy]');
  const status = root.querySelector('[data-share-status]');
  const manual = root.querySelector('[data-share-manual]');
  const input = root.querySelector('[data-share-url]');
  const actions = root.querySelector('[data-share-actions]');
  const buttons = [share, copy];
  let busy = false, operation = 0;
  input.value = page.url;
  for (const button of buttons) button.disabled = false;
  function setBusy(value) {
    busy = value;
    actions.setAttribute('aria-busy', String(value));
    for (const button of buttons) button.setAttribute('aria-disabled', String(value));
  }
  function fallback(message) {
    status.textContent = message;
    manual.open = true;
    input.focus({ preventScroll: true });
    input.select();
  }
  async function run(kind) {
    if (busy) return;
    const id = ++operation;
    manual.open = false;
    setBusy(true);
    status.textContent = kind === 'share' ? '共有メニューを開いています…' : 'URLをコピーしています…';
    try {
      if (kind === 'share') {
        if (typeof nav.share !== 'function') {
          fallback('この端末では共有メニューを利用できません。URLをコピーするか、下のURLを選択してください。');
          return;
        }
        await nav.share({ title: page.title, url: page.url });
        if (id === operation) status.textContent = '共有操作が完了しました。';
      } else {
        if (typeof nav.clipboard?.writeText !== 'function') {
          fallback('自動コピーを利用できません。下のURLを選択してコピーしてください。');
          return;
        }
        await nav.clipboard.writeText(page.url);
        if (id === operation) status.textContent = 'URLをコピーしました。';
      }
    } catch (error) {
      if (id !== operation) return;
      if (kind === 'share' && error?.name === 'AbortError') {
        status.textContent = '共有をキャンセルしました。';
      } else {
        fallback(kind === 'share'
          ? '共有メニューを開けませんでした。URLをコピーするか、下のURLを選択してください。'
          : 'コピーできませんでした。下のURLを選択してコピーしてください。');
      }
    } finally {
      if (id === operation) setBusy(false);
    }
  }
  const onShare = () => run('share'), onCopy = () => run('copy');
  const reset = () => { operation++; setBusy(false); manual.open = false; status.textContent = ''; };
  share.addEventListener('click', onShare);
  copy.addEventListener('click', onCopy);
  // A restored page must not retain a stale busy flag or announce an old operation.
  lifecycle.addEventListener('pagehide', reset);
  return { reset, destroy() { reset(); share.removeEventListener('click', onShare); copy.removeEventListener('click', onCopy); lifecycle.removeEventListener('pagehide', reset); } };
}
if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-share-page]')) mountSharePanel(root);
}
