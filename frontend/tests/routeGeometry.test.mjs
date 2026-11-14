import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/routeGeometry.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const {
  haversineMeters,
  chaikinSmooth,
  solveLegPath,
  buildRouteGeometry,
  optimizeStopOrder,
} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const stops = {
  colosseum: { slug: 'colosseum', name: 'Đấu trường La Mã', latitude: 41.89021, longitude: 12.492231, stayMinutes: 90 },
  constantine: { slug: 'arch-of-constantine', name: 'Khải hoàn môn Constantine', latitude: 41.88976, longitude: 12.490598, stayMinutes: 20 },
  vittoriano: { slug: 'vittoriano', name: 'Đài tưởng niệm Vittorio Emanuele II', latitude: 41.89465, longitude: 12.48312, stayMinutes: 60 },
  pantheon: { slug: 'pantheon', name: 'Đền Pantheon', latitude: 41.8986, longitude: 12.4769, stayMinutes: 55 },
};

// 1. Chaikin smoothing keeps exact endpoints and adds intermediate points
const raw = [[12.49, 41.89], [12.488, 41.892], [12.483, 41.895]];
const smoothed = chaikinSmooth(raw, 2);
assert.deepEqual(smoothed[0], raw[0]);
assert.deepEqual(smoothed[smoothed.length - 1], raw[raw.length - 1]);
assert(smoothed.length > raw.length);

// 2. Leg solver routes along Via dei Fori Imperiali, Via dei Cestari without cutting through Vittoriano interior when skipping Vittoriano
const directLeg = solveLegPath(stops.constantine, stops.pantheon);
assert(directLeg.distanceMeters > 1500 && directLeg.distanceMeters < 2600);
assert(directLeg.streetNames.some((s) => s.includes('Via dei Fori Imperiali')));
assert(directLeg.streetNames.some((s) => s.includes('Via dei Cestari')));
assert(!directLeg.streetNames.some((s) => s.includes('Altare della Patria')));

// 3. Full 4-stop curated route calculates distance, walking minutes, and total minutes cleanly
const fullRoute = buildRouteGeometry([stops.colosseum, stops.constantine, stops.vittoriano, stops.pantheon]);
assert.equal(fullRoute.legs.length, 3);
assert(fullRoute.totalDistanceKm > 1.8 && fullRoute.totalDistanceKm < 3.0);
assert.equal(fullRoute.totalStayMinutes, 225);
assert.equal(fullRoute.totalEstimatedMinutes, fullRoute.totalWalkingMinutes + 225);
assert(fullRoute.combinedPath.length > 15);
assert(fullRoute.legs[2].streetNames.some((s) => s.includes('Via dei Cestari')));

// 4. Stop optimizer turns out-of-order stops [colosseum, pantheon, constantine] into [colosseum, constantine, pantheon]
const scrambled = [stops.colosseum, stops.pantheon, stops.constantine];
const optimized = optimizeStopOrder(scrambled);
assert.deepEqual(
  optimized.map((s) => s.slug),
  ['colosseum', 'arch-of-constantine', 'pantheon']
);

// 5. Fallback works for custom/unmapped coordinates
const customA = { slug: 'unknown-a', name: 'A', latitude: 41.90, longitude: 12.48 };
const customB = { slug: 'unknown-b', name: 'B', latitude: 41.905, longitude: 12.485 };
const fallbackLeg = solveLegPath(customA, customB);
assert.equal(Math.round(haversineMeters([customA.longitude, customA.latitude], [customB.longitude, customB.latitude])), fallbackLeg.distanceMeters);

// 6. Tuyệt đối không có điểm nào trong toàn bộ tuyến đâm vào khối hình học 3D của các công trình
function insideColosseum(lon, lat) {
  const cLon = 12.49235546, cLat = 41.89025632, heading = 19.95;
  const a = 189.53 / 2, b = 141.53 / 2;
  const dLon = (lon - cLon) * 111320 * Math.cos(cLat * Math.PI / 180);
  const dLat = (lat - cLat) * 110574;
  const rad = heading * Math.PI / 180;
  const x = dLon * Math.cos(rad) - dLat * Math.sin(rad);
  const y = dLon * Math.sin(rad) + dLat * Math.cos(rad);
  return (x*x)/(a*a) + (y*y)/(b*b) <= 1.0;
}

function insideVittoriano(lon, lat) {
  const cLon = 12.48312, cLat = 41.89465, heading = 343.0;
  const dLon = (lon - cLon) * 111320 * Math.cos(cLat * Math.PI / 180);
  const dLat = (lat - cLat) * 110574;
  const rad = heading * Math.PI / 180;
  const u = dLon * Math.cos(rad) - dLat * Math.sin(rad);
  const v = dLon * Math.sin(rad) + dLat * Math.cos(rad);
  // Khối thân chính (colonnade & back terrace): x <= 65m, y <= 31m
  if (v >= -65 && v <= 31 && Math.abs(u) <= 65) return true;
  // Bậc thềm trung gian: x <= 40m, y <= 55m
  if (v > 31 && v <= 55 && Math.abs(u) <= 40) return true;
  // Bậc thềm chính phía trước hướng ra Quảng trường Venezia: x <= 20m, y <= 86m
  if (v > 55 && v <= 86 && Math.abs(u) <= 20) return true;
  return false;
}

function insidePantheon(lon, lat) {
  const cLon = 12.47683457, cLat = 41.89855333;
  const dLon = (lon - cLon) * 111320 * Math.cos(cLat * Math.PI / 180);
  const dLat = (lat - cLat) * 110574;
  const rotundaDist = Math.sqrt(dLon * dLon + dLat * dLat);
  const insideRotunda = rotundaDist <= 27.65;
  const insidePortico = dLat >= 20 && dLat <= 49.5 && Math.abs(dLon) <= 18;
  return insideRotunda || insidePortico;
}

function insideMetroCFence(lon, lat) {
  return lon >= 12.48240 && lon <= 12.48340 && lat >= 41.89565 && lat <= 41.89620;
}

for (const pt of fullRoute.combinedPath) {
  assert(!insideColosseum(pt[0], pt[1]), `Point [${pt}] must not penetrate Colosseum`);
  assert(!insideVittoriano(pt[0], pt[1]), `Point [${pt}] must not penetrate Vittoriano`);
  assert(!insidePantheon(pt[0], pt[1]), `Point [${pt}] must not penetrate Pantheon`);
  assert(!insideMetroCFence(pt[0], pt[1]), `Point [${pt}] must not enter Metro C construction zone`);
}

console.log(`PASS: routeGeometry verified (${fullRoute.totalDistanceKm} km, ${fullRoute.legs.length} legs, optimizer & fallback OK, 0 building penetration).`);
