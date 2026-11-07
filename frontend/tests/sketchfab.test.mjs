import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/sketchfab.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { sketchfabAutoUrl, sketchfabModelId, connectSketchfabViewer } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const url = 'https://sketchfab.com/models/3c5b7197d73342bbb333b24be23ba850/embed';
assert.equal(sketchfabModelId(url), '3c5b7197d73342bbb333b24be23ba850');
assert.equal(new URL(sketchfabAutoUrl(url)).searchParams.get('autostart'), '1');
for (const bad of ['https://evil.example/models/3c5b7197d73342bbb333b24be23ba850/embed', url.replace('https:', 'http:'), url.replace('sketchfab.com', 'sketchfab.com@evil.example'), null]) assert.equal(sketchfabModelId(bad), null);

let options, starts = 0, stops = 0, ready = 0, failed = 0, loads = 0;
const listeners = {};
const progress = [];
const frame = { src: '' };
class MockViewer {
  init(uid, value) { options = value; assert.equal(uid, sketchfabModelId(url)); }
}
const disconnect = connectSketchfabViewer({ frame, uid: sketchfabModelId(url), load: async () => MockViewer, onReady: () => ready++, onProgress: (...values) => progress.push(values), onError: () => failed++ });
await new Promise(resolve => setImmediate(resolve));
assert.equal(options.autostart, 1);
options.success({ load: () => loads++, start: () => starts++, stop: () => stops++, addEventListener: (name, callback) => { listeners[name] = callback; } });
assert.equal(loads, 1, 'request model resources before waiting for the user to open the viewer');
assert.equal(starts, 1, 'explicit start without a second user click');
assert.equal(ready, 0, 'initialization does not imply the model is ready');
listeners.modelLoadProgress(.6); assert.deepEqual(progress[0], ['model', .6]);
listeners.viewerready(); assert.equal(ready, 1);
listeners.textureLoadProgress(.9); assert.equal(progress.length, 1, 'hide progress after readiness');
disconnect(); assert.equal(stops, 1); assert.equal(frame.src, 'about:blank');
listeners.viewerready(); assert.equal(ready, 1, 'ignore callbacks after close');

let resolveLoader, initialized = 0;
const closeBeforeLoad = connectSketchfabViewer({ frame: {}, uid: sketchfabModelId(url), load: () => new Promise(resolve => { resolveLoader = resolve; }), onReady: () => {}, onProgress: () => {}, onError: () => {} });
closeBeforeLoad(); resolveLoader(class { init() { initialized++; } });
await new Promise(resolve => setImmediate(resolve)); assert.equal(initialized, 0, 'do not initialize a closed dialog');
connectSketchfabViewer({ frame: {}, uid: sketchfabModelId(url), load: async () => { throw new Error('offline'); }, onReady: () => {}, onProgress: () => {}, onError: () => failed++ });
await new Promise(resolve => setImmediate(resolve)); assert.equal(failed, 1);
console.log('PASS: auto-start command, real readiness, progress, close/switch safety, loading failure and URL validation.');
