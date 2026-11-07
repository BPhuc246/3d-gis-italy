import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/lib/explore.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
async function loadWithEnv(env) {
  return import('data:text/javascript;base64,' + Buffer.from(code.replaceAll('import.meta.env', JSON.stringify(env))).toString('base64'));
}
const root = new URL('../../', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('_local/tours.json', root), 'utf8'));
const metadata = JSON.parse(await readFile(new URL('_local/sources.json', root), 'utf8'));
const fixtures = {};
for (const entry of catalog) fixtures[entry.slug] = JSON.parse(await readFile(new URL(`_local/${entry.slug}-tour.json`, root), 'utf8'));
const dev = await loadWithEnv({ DEV: true, VITE_LOCAL_DEMO: 'false' });
assert.equal(catalog.length, 3);
assert.equal(dev.localDemoAvailable, false);
let totalScenes = 0, links = 0, info = 0, questions = 0;
const photos = new Set();
for (const { slug, sceneCount } of catalog) {
  const tour = dev.validatePhotoTour(fixtures[slug], slug);
  assert(tour.scenes.length >= (slug === 'arch-of-constantine' ? 7 : slug === 'pantheon' ? 12 : 8));
  assert.equal(tour.scenes.length, sceneCount);
  assert(tour.questions.length >= 3);
  totalScenes += tour.scenes.length; questions += tour.questions.length;
  for (const scene of tour.scenes) {
    assert(scene.image.startsWith('/_local/images/'));
    assert(!photos.has(scene.image), 'each scene has a distinct photo'); photos.add(scene.image);
    const meta = metadata.find(m => '/_local/' + m.file === scene.image);
    assert(meta && meta.author && meta.license && meta.licenseUrl);
    assert.equal(scene.author, meta.author); assert.equal(scene.licenseUrl, meta.licenseUrl);
    assert.match(meta.licenseUrl, /^https:\/\/creativecommons.org\/(licenses|publicdomain)\//);
    const image = await readFile(new URL(scene.image.slice(1), root));
    assert.equal(image.subarray(0, 2).toString('hex'), 'ffd8');
    assert(image.length < 4_000_000);
    assert.equal(createHash('sha256').update(image).digest('hex'), meta.sha256);
    assert.equal(scene.width, meta.width); assert.equal(scene.height, meta.height);
    assert(meta.width >= 1920);
    assert(scene.thumbnail.startsWith('/_local/images/thumbs/'));
    assert((await stat(new URL(scene.thumbnail.slice(1), root))).size < 100_000);
    assert(scene.hotspots.filter(h => !h.target).length >= 2);
    for (const hotspot of scene.hotspots) {
      if (hotspot.target) {
        links++;
        assert(['left','right','forward','up','down','return','view'].includes(hotspot.direction));
        assert(!hotspot.title.startsWith('Xem ảnh:'), 'navigation has an explicit action, not scene order');
        if (hotspot.target === 'aerial') assert.equal(hotspot.direction, 'view', 'aerial imagery is not a walking direction');
        if (slug === 'arch-of-constantine' && hotspot.target === 'north') {
          assert.equal(hotspot.direction, 'view');
          assert.match(hotspot.title, /từ trên cao/);
        }
        assert(tour.scenes.find(s => s.id === hotspot.target).hotspots.some(back => back.target === scene.id));
      } else { info++; assert.match(hotspot.sourceUrl, /^https:\/\//); }
    }
  }
  // Every scene must reach every other using image hotspots, independently of history/sidebar.
  for (const start of tour.scenes) {
    const seen = new Set(); const pending = [start.id];
    while (pending.length) { const id = pending.pop(); if (seen.has(id)) continue; seen.add(id); tour.scenes.find(s => s.id === id).hotspots.forEach(h => { if (h.target) pending.push(h.target); }); }
    assert.equal(seen.size, tour.scenes.length);
  }
}
assert.equal(totalScenes, 27); assert.equal(photos.size, 27);
const pantheon = fixtures.pantheon;
for (const id of ['entrance','side','chapel','floor']) assert(pantheon.scenes.some(s => s.id === id));
assert(pantheon.scenes.every(s => !/về đêm|chạng vạng/.test(s.title)));
for (const id of ['exterior','oblique','portico','capitals','oculus','altar']) {
  assert.match(pantheon.scenes.find(s => s.id === id).captureDate, /^2016-10-09 10:/);
}
const original = fixtures.colosseum;
const firstNav = original.scenes[0].hotspots.find(h => h.target);
const oneWay = structuredClone(original);
const target = oneWay.scenes.find(s => s.id === firstNav.target);
target.hotspots = target.hotspots.filter(h => h.target !== oneWay.scenes[0].id);
assert.throws(() => dev.validatePhotoTour(oneWay, 'colosseum'), /chưa sẵn sàng/);
const badTarget = structuredClone(original); badTarget.scenes[0].hotspots[0].target = 'missing';
assert.throws(() => dev.validatePhotoTour(badTarget, 'colosseum'));
const badDirection = structuredClone(original); badDirection.scenes[0].hotspots.find(h => h.target).direction = 'back';
assert.throws(() => dev.validatePhotoTour(badDirection, 'colosseum'));
const badAnswer = structuredClone(original); badAnswer.questions[0].answer = 999;
assert.throws(() => dev.validatePhotoTour(badAnswer, 'colosseum'));
const orphan = structuredClone(original); orphan.scenes.push({ ...orphan.scenes[0], id: 'orphan', hotspots: [] });
assert.throws(() => dev.validatePhotoTour(orphan, 'colosseum'));
const originalFetch = globalThis.fetch;
try {
  let requested;
  globalThis.fetch = async url => { requested = url; const slug = catalog.find(t => url.includes(t.slug))?.slug ?? 'colosseum'; return Response.json(fixtures[slug]); };
  for (const { slug } of catalog) assert.equal((await dev.loadLocalTour(slug)).destinationSlug, slug);
  assert.equal(requested, '/_local/pantheon-tour.json');
  const deployed = await loadWithEnv({ DEV: false, VITE_PHOTO_TOUR_BASE_URL: 'https://assets.example/tours/' });
  await deployed.loadLocalTour('pantheon'); assert.equal(requested, 'https://assets.example/tours/pantheon-tour.json');
  const legacy = await loadWithEnv({ DEV: false, VITE_PHOTO_TOUR_URL: 'https://assets.example/colosseum.json' });
  await legacy.loadLocalTour(); assert.equal(requested, 'https://assets.example/colosseum.json');
  globalThis.fetch = async () => new Response('Not found', { status: 404 });
  await assert.rejects(dev.loadLocalTour('colosseum', true));
  globalThis.fetch = async () => Response.json({});
  await assert.rejects(dev.loadLocalTour('colosseum', true), /chưa sẵn sàng/);
  globalThis.fetch = async () => new Response('<html>SPA fallback</html>');
  await assert.rejects(dev.loadLocalTour('colosseum', true));
} finally { globalThis.fetch = originalFetch; }
console.log(`PASS: 3 tours, ${totalScenes} licensed photos, ${links} reciprocal links, ${info} information points, ${questions} questions; files, thumbnails, hashes, graph reachability and loader errors.`);

const navigationSource = await readFile(new URL('../src/lib/photoNavigation.ts', import.meta.url), 'utf8');
const navigationCode = ts.transpileModule(navigationSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { navigationPresentation, pointerMarker } = await import('data:text/javascript;base64,' + Buffer.from(navigationCode).toString('base64'));
assert.equal(navigationPresentation({ target: 'north', direction: 'view', title: 'Đổi góc' }, 'south').direction, 'view');
assert.deepEqual(navigationPresentation({ target: 'south', direction: 'left', title: 'Mặt Nam' }, 'south', '02 · Mặt phía Nam'), { direction: 'return', label: 'Quay lại: Mặt phía Nam' });
assert.deepEqual(pointerMarker(84,65,128,100), { x:20, y:15 });
assert.deepEqual(pointerMarker(-999,999,128,100), { x:-64, y:50 });
console.log('PASS: explicit directional/viewpoint links, real previous-scene return and pointer tracking bounds.');
