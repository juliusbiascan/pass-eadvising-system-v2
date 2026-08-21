export function printHtmlDocument(html: string) {
  const iframe = window.document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('title', 'Print grade submission');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '8.5in';
  iframe.style.height = '11in';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  window.document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = frameWindow?.document;

  if (!frameWindow || !frameDoc) {
    iframe.remove();
    window.print();
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  const triggerPrint = () => {
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 1000);
  };

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 50);
    return;
  }

  iframe.addEventListener('load', () => window.setTimeout(triggerPrint, 50), { once: true });
}
