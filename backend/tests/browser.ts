import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pool } from '../src/db/pool';
import { env } from '../src/config/env';

const delay=(ms: number)=>new Promise(resolve=>setTimeout(resolve,ms));
async function main() {
  assert(env.NODE_ENV !== 'production' && ['localhost','127.0.0.1','::1','[::1]'].includes(new URL(env.DB_POSTGRES).hostname));
  const email=`qa-browser-${randomUUID()}@example.test`, name='QA Browser User', password='Roma-QA-2026!';
  const profile=await mkdtemp(path.join(tmpdir(),'roma-account-qa-'));
  const base=process.env.ACCOUNT_QA_URL ?? 'http://127.0.0.1:5173';
  const executable=process.env.ACCOUNT_QA_BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  await access(executable);
  let browser: ChildProcess | undefined, socket: WebSocket | undefined;
  let closeBrowser: (() => Promise<unknown>) | undefined;
  try {
    browser=spawn(executable,['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--window-size=1440,1000',base+'/#/auth'],{windowsHide:true,stdio:'ignore'});
    let port='';
    for(let i=0;i<100;i++) { try { port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]; break; } catch { await delay(150); } }
    assert(port,'test browser started');
    const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json() as any[];
    socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
    await new Promise<void>((resolve,reject)=>{ socket!.onopen=()=>resolve(); socket!.onerror=reject; });
    let serial=0; const pending=new Map<number,{resolve:(value:any)=>void;reject:(error:Error)=>void}>();
    const cdp=(method:string,params:object={})=>new Promise<any>((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket!.send(JSON.stringify({id,method,params}));});
    closeBrowser=()=>cdp('Browser.close');
    socket.onmessage=event=>{const result=JSON.parse(String(event.data));if(result.method==='Page.javascriptDialogOpening') void cdp('Page.handleJavaScriptDialog',{accept:true}); const task=pending.get(result.id);if(task){pending.delete(result.id);result.error?task.reject(new Error(result.error.message)):task.resolve(result.result);}};
    const evaluate=async(expression:string)=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
    const wait=async(expression:string,label:string)=>{for(let i=0;i<200;i++){if(await evaluate(`Boolean(${expression})`))return;await delay(100);}console.error(await evaluate(`({hash:location.hash,text:document.body.innerText.slice(-1800),fields:Array.from(document.querySelectorAll('input')).map(i=>({type:i.type,valid:i.checkValidity(),message:i.validationMessage}))})`));throw new Error('Timed out: '+label);};
    const click=async(text:string)=>{await evaluate(`(()=>{const match=b=>b.textContent.trim()===${JSON.stringify(text)};const b=Array.from(document.querySelectorAll('form button[type="submit"]')).find(match)??Array.from(document.querySelectorAll('button')).find(match);if(!b)throw new Error('Missing button: '+${JSON.stringify(text)});b.click()})()`);};
    const fill=async(selector:string,value:string)=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);};
    await cdp('Page.enable');
    await wait(`document.querySelector('input[type="email"]')`,'auth page');
    await evaluate(`sessionStorage.setItem('roma-return','#/d/colosseum')`);
    await click('Đăng ký');
    await fill('[aria-label="Họ và tên"]',name); await fill('[aria-label="Email"]',email); await fill('[aria-label="Mật khẩu"]',password);
    await click('Tạo tài khoản');
    await wait(`location.hash==='#/d/colosseum' && document.querySelector('textarea') && document.querySelector('.account-dropdown strong')?.textContent===${JSON.stringify(name)}`,'register and return to destination');
    assert(await evaluate(`!!localStorage.getItem('token')`),'registered session persisted');
    await click('♡ Yêu thích'); await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='♥ Đã yêu thích')`,'favorite saved');
    await fill('#rating','4'); await fill('textarea','QA browser review'); await click('Gửi đánh giá');
    await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Cập nhật đánh giá') && document.querySelector('ul')?.textContent.includes('QA browser review')`,'review saved');
    await cdp('Page.reload');
    await wait(`document.querySelector('textarea')?.value==='QA browser review' && Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='♥ Đã yêu thích')`,'reload restored auth, favorite and own review');
    await fill('#rating','5');await fill('textarea','QA browser edited');await click('Cập nhật đánh giá');
    await wait(`document.querySelector('ul')?.textContent.includes('QA browser edited')`,'review edited');
    await evaluate(`location.hash='#/favorites'`);
    await wait(`document.querySelector('h1')?.textContent==='Yêu thích' && document.querySelector('a[href="#/d/colosseum"]')`,'favorites page persisted entry');
    await evaluate(`document.querySelector('a[href="#/d/colosseum"]').click()`);
    await wait(`document.querySelector('textarea')?.value==='QA browser edited'`,'back to saved review');
    await click('Xóa đánh giá'); await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='Gửi đánh giá')`,'own review deleted');
    await click('♥ Đã yêu thích');await wait(`Array.from(document.querySelectorAll('button')).some(b=>b.textContent.trim()==='♡ Yêu thích')`,'favorite removed');
    await evaluate(`document.querySelector('.account-menu summary').click()`);await click('Đăng xuất');
    await wait(`!document.querySelector('textarea') && !localStorage.getItem('token')`,'logout cleared user form and session');
    await evaluate(`Array.from(document.querySelectorAll('a')).find(a=>a.textContent.trim()==='Đăng nhập').click()`);
    await wait(`document.querySelector('input[type="email"]')`,'login form');
    await fill('[aria-label="Email"]',email);await fill('[aria-label="Mật khẩu"]','Wrong-Password-2026!');await click('Đăng nhập');
    await wait(`document.body.textContent.includes('Email hoặc mật khẩu không đúng')`,'wrong password feedback');
    await fill('[aria-label="Mật khẩu"]',password);await click('Đăng nhập');
    await wait(`location.hash==='#/d/colosseum' && document.querySelector('textarea')`,'login restored correct page');
    // Local POI fixtures still use the real APIs for account activity.
    await evaluate(`sessionStorage.setItem('roma-data-mode','local');location.hash='#/map/pantheon'`);
    await wait(`document.querySelector('.favorite-button:not(:disabled)')`,'local map account actions');
    await evaluate(`document.querySelector('.favorite-button').click()`);
    await wait(`document.querySelector('.favorite-button')?.textContent.includes('Đã lưu yêu thích')`,'favorite from local map');
    await click('Bình luận & đánh giá');await wait(`document.querySelector('textarea')`,'reviews from local map');
    await fill('textarea','QA browser local map');await click('Gửi đánh giá');
    await wait(`document.querySelector('ul')?.textContent.includes('QA browser local map')`,'review from local map');
    await cdp('Page.reload');
    await wait(`document.querySelector('.favorite-button')?.textContent.includes('Đã lưu yêu thích')`,'local map reload favorite persistence');
    await click('Bình luận & đánh giá');await wait(`document.querySelector('textarea')?.value==='QA browser local map'`,'local map reload review persistence');
    const rows=await pool.query(`SELECT u.user_id,(SELECT COUNT(*) FROM review WHERE user_id=u.user_id)::int AS reviews,(SELECT COUNT(*) FROM favorite WHERE user_id=u.user_id)::int AS favorites FROM users u WHERE email=$1`,[email]);
    assert.equal(rows.rows[0].reviews,1);assert.equal(rows.rows[0].favorites,1);
    const output=path.resolve(process.cwd(),'../_local/qa');await mkdir(output,{recursive:true});
    const screenshot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(path.join(output,'account-review-browser.png'),Buffer.from(screenshot.data,'base64'));
    console.log('PASS browser: register, redirect, login/wrong password, favorite/list/unfavorite, review create/edit/delete, logout, full-page reload persistence; real account actions also work in local-map mode.');
    await cdp('Browser.close').catch(()=>{});
  } finally {
    if (socket?.readyState===WebSocket.OPEN && closeBrowser) await Promise.race([closeBrowser().catch(()=>{}),delay(1500)]);
    socket?.close();browser?.kill();
    await pool.query('DELETE FROM users WHERE email=$1 AND full_name=$2',[email,name]);
    // This exact path was freshly created by mkdtemp under the OS temp directory.
    assert(path.resolve(profile).startsWith(path.resolve(tmpdir())+path.sep));
    await delay(500);await rm(profile,{recursive:true,force:true,maxRetries:2,retryDelay:200}).catch(()=>{});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>pool.end());
