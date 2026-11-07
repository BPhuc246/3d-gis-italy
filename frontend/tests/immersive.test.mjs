import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
async function moduleFile(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/from (['"])(react(?:\/jsx-runtime)?)\1/g, (_, quote, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const { photoSize, limitPhotoPan, INITIAL_PHOTO_ZOOM } = await moduleFile('../src/lib/photoViewport.ts');
for (const [width, height] of [[1920, 1080], [390, 844], [1024, 768]]) {
  for (const ratio of [1280 / 751, 1280 / 897, 1280 / 500]) {
    const initial = photoSize(width, height, ratio, INITIAL_PHOTO_ZOOM);
    assert(initial.width > width && initial.height > height, 'initial centered image has room to drag in all four directions');
    const cover = photoSize(width, height, ratio, 1);
    assert(cover.width + 1e-8 >= width && cover.height + 1e-8 >= height, 'cover mode fills the whole viewport');
    const contain = photoSize(width, height, ratio, 1, 'contain');
    assert(contain.width <= width + 1e-8 && contain.height <= height + 1e-8, 'whole-image mode does not crop');
    const zoomed = photoSize(width, height, ratio, 2);
    const pan = limitPhotoPan(1e6, -1e6, zoomed.width, zoomed.height, width, height);
    assert.equal(pan.x, (zoomed.width - width) / 2);
    assert.equal(pan.y, -(zoomed.height - height) / 2);
    const unpanned = limitPhotoPan(1, 1, contain.width, contain.height, width, height);
    assert(Math.abs(unpanned.x) < 1e-8 && Math.abs(unpanned.y) < 1e-8);
  }
}
const { default: Modal } = await moduleFile('../src/components/Modal.tsx');
const markup = renderToStaticMarkup(createElement(Modal, { title: 'Prepared model', open: false, preload: true, onClose() {} }, createElement('iframe', { title: 'Persistent viewer' })));
assert(markup.includes('<iframe'), 'closing a prepared modal keeps its iframe in the DOM');
assert(markup.includes('preload-dialog'));
assert(markup.includes('aria-hidden="true"') && markup.includes('inert=""'), 'the warming frame is not interactive or exposed as an open dialog');
console.log('PASS: viewport cover/contain, bounded dragging at desktop/mobile sizes, retained inactive preload iframe.');
