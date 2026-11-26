const COPIED = [
  'box-sizing',
  'width',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border-top-width',
  'border-left-width',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'tab-size',
];

// Measures where a character sits inside a textarea by laying the same text out in a hidden mirror.
export function caretPoint(field: HTMLTextAreaElement, index: number): { top: number; left: number; height: number } {
  const style = getComputedStyle(field);
  const mirror = document.createElement('div');
  for (const property of COPIED) mirror.style.setProperty(property, style.getPropertyValue(property));
  Object.assign(mirror.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word' });
  mirror.textContent = field.value.slice(0, index);
  const marker = document.createElement('span');
  marker.textContent = '​';
  mirror.append(marker);
  document.body.append(mirror);
  const point = { top: marker.offsetTop - field.scrollTop, left: marker.offsetLeft, height: parseFloat(style.lineHeight) || 20 };
  mirror.remove();
  return point;
}
