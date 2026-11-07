import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);
const region = JSON.parse(await readFile(new URL('_local/region.json', root), 'utf8'));
const source = await readFile(new URL('../src/lib/buildingGeometry.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { makeBuildingMesh, modelMask } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const placementSource = await readFile(new URL('../src/lib/landmarkPlacement.ts', import.meta.url), 'utf8');
const placementCode = ts.transpileModule(placementSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { alignLandmark } = await import('data:text/javascript;base64,' + Buffer.from(placementCode).toString('base64'));

function area(ring) {
  // Subtract the first coordinate to avoid catastrophic cancellation at WGS84 scale.
  const [ox, oy] = ring[0];
  return ring.slice(1).reduce((sum, p, i) => sum + (ring[i][0] - ox) * (p[1] - oy) - (p[0] - ox) * (ring[i][1] - oy), 0) / 2;
}
let vertices = 0;
for (const original of region.destinations) {
  const place = alignLandmark(original);
  const mesh = makeBuildingMesh(place);
  assert(mesh.components.length <= 4, 'shared material budget');
  assert.equal(mesh.position.length, mesh.normal.length);
  assert(mesh.position.length > 0 && mesh.position.length % 9 === 0);
  for (let i = 0; i < mesh.position.length; i += 3) {
    const point = mesh.position.slice(i, i + 3);
    assert(point.every(Number.isFinite));
    assert(Math.abs(point[0]) < 170 && Math.abs(point[1]) < 170);
    assert(point[2] >= 0 && point[2] <= 100);
    assert(Math.abs(Math.hypot(...mesh.normal.slice(i, i + 3)) - 1) < 1e-6);
    vertices++;
  }
  for (const component of mesh.components) {
    assert.equal(component.faces.length % 3, 0);
    assert(component.faces.every(index => Number.isInteger(index) && index >= 0 && index < mesh.position.length / 3));
  }
  const mask = modelMask(place);
  assert.deepEqual(mask[0], mask.at(-1));
  assert(area(mask) < 0);
  console.log(`${place.slug}: ${mesh.position.length / 9} triangles, ${mesh.components.filter(c => c.faces.length).length} materials`);
  for (const embed of place.embeds) assert.match(embed.embedUrl, /^https:\/\/sketchfab\.com\/models\/[a-f0-9]{32}\/embed$/);
}
// Distinguish the model's measured origin from the POI coordinate. Applying this
// to API data with old seed coordinates must produce the same model placement.
const arch = alignLandmark({ ...region.destinations.find(p => p.slug === 'arch-of-constantine'), longitude: 0, latitude: 0, headingDeg: 0 });
assert(Math.abs(arch.longitude - 12.490666775) < 1e-10);
assert.equal(arch.headingDeg, 13);
assert(arch.footprintWidthM < 7.1);
const pantheon = alignLandmark(region.destinations.find(p => p.slug === 'pantheon'));
assert(pantheon.footprintWidthM > 55 && pantheon.porticoCenterNorthM > 35);
assert(vertices < 40000, 'combined vertex budget (no textures or model downloads)');
console.log(`PASS: 3 lightweight models (${vertices} vertices), calibrated placement and valid embed URLs.`);
