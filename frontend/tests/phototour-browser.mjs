// Optional real-browser check. Uses installed Edge and the running Vite server.
// A separate temporary browser profile leaves the user's browser/session untouched.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const frontend = fileURLToPath(new URL('../', import.meta.url));
const root = path.dirname(frontend);
const harness = path.join(frontend, '__photo-tour-review.html');
const profile = await mkdtemp(path.join(tmpdir(), 'roma-tour-qa-'));
const base = process.env.TOUR_QA_URL ?? 'http://127.0.0.1:5173';
const executable = process.env.TOUR_QA_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, socket, createdHarness = false;
try {
  try { await access(harness); throw new Error('Review harness already exists; will not overwrite it.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await writeFile(harness, `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
import PhotoTour from '/src/components/PhotoTour.tsx';
import '/src/index.css';
const root=ReactDOM.createRoot(document.getElementById('root'));
window.review=(slug)=>root.render(React.createElement(PhotoTour,{key:slug,destinationSlug:slug,onClose(){window.closedTour=slug}}));
</script></body></html>`);
  createdHarness = true;
  browser = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--window-size=1440,1000', `${base}/__photo-tour-review.html`], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', e => console.error(e.message));
  let port;
  for (let n=0;n<100;n++) { try { port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]; break; } catch { await delay(150); } }
  assert(port, 'Edge started its test profile');
  const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = pages.find(p => p.type === 'page');
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject) => { socket.onopen=resolve; socket.onerror=reject; });
  let serial=0; const pending=new Map();
  socket.onmessage = event => { const data=JSON.parse(event.data); if(data.method==='Runtime.exceptionThrown') console.error(JSON.stringify(data.params.exceptionDetails)); const p=pending.get(data.id); if(p) { pending.delete(data.id); data.error ? p.reject(new Error(data.error.message)) : p.resolve(data.result); } };
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{ const id=++serial; pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate=async expression=> { const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  async function wait(expression, label) { for(let i=0;i<160;i++) { if(await evaluate(`Boolean(${expression})`)) return; await delay(100); } throw new Error(`Timed out: ${label}`); }
  async function mouse(x,y,click=false) { await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x,y}); if(click) { await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1}); await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1}); } }
  await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Runtime.enable');
  await cdp('Page.reload');
  await wait('typeof window.review === "function"','React harness');
  let scenes=0, links=0;
  for(const slug of ['colosseum','arch-of-constantine','pantheon']) {
    const tour=JSON.parse(await readFile(path.join(root,'_local',`${slug}-tour.json`),'utf8'));
    await evaluate(`window.review(${JSON.stringify(slug)})`);
    await wait('document.querySelector(".tour-scene-list > button") && document.querySelector(".photo-hotspot")','tour loaded');
    assert(await evaluate(`document.querySelector('.tour-current-scene').hidden && Array.from(document.querySelectorAll('.hotspot-caption')).every(c=>c.hidden)`),'both controls default off');
    await evaluate(`document.querySelector('.tour-tools button').click()`);
    assert(await evaluate(`document.querySelector('.tour-current-scene').hidden && !document.querySelector('.photo-viewport').classList.contains('hotspots-hidden')`),'eye shows icons without showing current area tag');
    await evaluate(`document.querySelectorAll('.tour-tools button')[1].click()`);
    assert(await evaluate(`!document.querySelector('.tour-current-scene').hidden`),'magnifier independently shows current area');
    await evaluate(`document.querySelector('.tour-tools button').click()`);
    assert(await evaluate(`!document.querySelector('.tour-current-scene').hidden && document.querySelector('.photo-viewport').classList.contains('hotspots-hidden')`),'eye hides icons while magnifier keeps area tag');
    await evaluate(`document.querySelectorAll('.tour-tools button')[1].click()`);
    assert.equal(await evaluate(`document.querySelectorAll('.tour-exit').length`),1,'one exit control');
    assert.equal(await evaluate(`document.querySelectorAll('[aria-label="Xem vị trí công trình trên bản đồ"]').length`),0,'duplicate locate/exit removed');
    // Every scene is rendered with the expected actions, independently of numbering.
    for(let i=0;i<tour.scenes.length;i++) {
      const scene=tour.scenes[i];
      await evaluate(`document.querySelectorAll('.tour-scene-list > button')[${i}].click()`);
      await wait(`document.querySelector('.tour-current-scene')?.textContent.includes(${JSON.stringify(scene.title)}) && document.querySelectorAll('.photo-hotspot').length === ${scene.hotspots.length}`,'scene and image');
      const actual=await evaluate(`Array.from(document.querySelectorAll('.photo-hotspot.navigation')).map(b=>({direction:b.dataset.direction,label:b.getAttribute('aria-label')}))`);
      const previous=i ? tour.scenes[i-1].id : undefined;
      for(const h of scene.hotspots.filter(h=>h.target)) {
        const direction=h.target === previous ? 'return' : h.direction;
        assert(actual.some(a=>a.direction===direction && (direction==='return' ? /Quay lại|Trở/.test(a.label) : a.label===h.title)), `${slug}/${scene.id}: ${h.title}`);
        links++;
      }
      scenes++;
    }
    // Exercise every outgoing link and its reciprocal return in the mounted UI.
    for(let i=0;i<tour.scenes.length;i++) {
      const scene=tour.scenes[i];
      await evaluate(`document.querySelectorAll('.tour-scene-list > button')[${i}].click()`);
      await wait(`document.querySelector('.tour-current-scene')?.textContent.includes(${JSON.stringify(scene.title)}) && document.querySelectorAll('.photo-hotspot').length === ${scene.hotspots.length}`,'source scene');
      const outgoing=scene.hotspots.filter(h=>h.target);
      for(let n=0;n<outgoing.length;n++) {
        const target=tour.scenes.find(s=>s.id===outgoing[n].target);
        await evaluate(`document.querySelectorAll('.photo-hotspot.navigation')[${n}].click()`);
        await wait(`document.querySelector('.tour-current-scene')?.textContent.includes(${JSON.stringify(target.title)}) && document.querySelectorAll('.photo-hotspot').length === ${target.hotspots.length}`,'linked scene');
        const back=target.hotspots.filter(h=>h.target).findIndex(h=>h.target===scene.id);
        assert.equal(await evaluate(`document.querySelectorAll('.photo-hotspot.navigation')[${back}].dataset.direction`),'return');
        await evaluate(`document.querySelectorAll('.photo-hotspot.navigation')[${back}].click()`);
        await wait(`document.querySelector('.tour-current-scene')?.textContent.includes(${JSON.stringify(scene.title)}) && document.querySelectorAll('.photo-hotspot').length === ${scene.hotspots.length}`,'reciprocal return');
      }
    }
    // A second press on the same info point must collapse the entire panel.
    await evaluate(`document.querySelector('.photo-hotspot:not(.navigation)').click()`);
    await wait(`document.querySelector('.tour-story').getAttribute('aria-hidden') === 'false'`,'info opens');
    await evaluate(`document.querySelector('.photo-hotspot:not(.navigation)').click()`);
    await wait(`document.querySelector('.tour-story').getAttribute('aria-hidden') === 'true'`,'second press collapses panel');
    console.log(`PASS browser: ${slug}, every scene rendered; repeated info press collapses panel.`);
  }
  // The user's reported south -> elevated north view, with real mouse events.
  await evaluate(`window.review('arch-of-constantine')`);
  await wait(`document.querySelector('.tour-scene-list > button')`,'arch remount');
  await evaluate(`document.querySelectorAll('.tour-scene-list > button')[1].click()`);
  await wait(`document.querySelector('.tour-current-scene')?.textContent.includes('Mặt phía Nam') && document.querySelectorAll('.photo-hotspot').length === 6`,'south view');
  await evaluate(`document.querySelector('.tour-tools button:last-child').click(); document.querySelector('.tour-panel-toggle').click()`);
  const navSelector='.photo-hotspot.navigation[data-direction="view"]';
  const bounds=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(navSelector)}).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`);
  const pointer={x:bounds.x+bounds.width/2+18,y:bounds.y+bounds.height/2+12};
  await mouse(pointer.x,pointer.y);
  await delay(220);
  const marker=await evaluate(`(()=>{const b=document.querySelector(${JSON.stringify(navSelector)}), m=b.querySelector('.hotspot-marker').getBoundingClientRect();return {x:m.x+m.width/2,y:m.y+m.height/2,opacity:getComputedStyle(b).opacity,label:b.querySelector('.hotspot-caption').textContent}})()`);
  assert(Math.abs(marker.x-pointer.x)<1 && Math.abs(marker.y-pointer.y)<1,'navigation marker follows the actual pointer');
  assert.equal(marker.opacity,'1'); assert.match(marker.label,/từ trên cao/);
  const qa=path.join(root,'_local','qa'); await mkdir(qa,{recursive:true});
  assert.equal(await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(navSelector)}).querySelector('.hotspot-caption')).display`),'none','hover reveals icon but not nameplate when eye is off');
  const discoveryShot=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(path.join(qa,'nameplate-discovery-browser.png'),Buffer.from(discoveryShot.data,'base64'));
  await evaluate(`document.querySelector('.tour-tools button').click()`);
  await mouse(pointer.x,pointer.y);
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector(${JSON.stringify(navSelector)}).querySelector('.hotspot-caption')).display`),'none','eye enables hover caption');
  const shot=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(path.join(qa,'navigation-pointer-browser.png'),Buffer.from(shot.data,'base64'));
  await mouse(pointer.x,pointer.y,true);
  await wait(`document.querySelector('.tour-current-scene')?.textContent.includes('Mặt phía Bắc') && document.querySelector('.photo-hotspot[data-direction="return"]')`,'north view and return marker');
  const returnLabel=await evaluate(`document.querySelector('.photo-hotspot[data-direction="return"]').getAttribute('aria-label')`);
  assert.match(returnLabel,/Quay lại: Mặt phía Nam/);
  await evaluate(`document.querySelector('.photo-hotspot[data-direction="return"]').click()`);
  await wait(`document.querySelector('.tour-current-scene')?.textContent.includes('Mặt phía Nam')`,'return to south');
  console.log(`PASS browser: ${scenes} scenes, ${links} links clicked with reciprocal returns, pointer tracking, independent eye/magnifier controls, one exit, elevated-view caption, south/north return.`);
  await cdp('Browser.close').catch(()=>{});
} finally {
  socket?.close(); browser?.kill();
  if(createdHarness) await rm(harness,{force:true});
  // Edge may still hold its temporary profile while exiting; let the OS clean it if locked.
  await delay(500); await rm(profile,{recursive:true,force:true,maxRetries:2,retryDelay:200}).catch(()=>{});
}
