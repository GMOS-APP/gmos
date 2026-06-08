import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(Boolean).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const KEY=env.VITE_SUPABASE_ANON_KEY, URL=env.VITE_SUPABASE_URL;
const TOK='6ae80f6f-bea3-495f-abba-c1036e55965b', MAP='7294f4de-0df1-4df3-8004-aa725045dcfe';
const PROD=`https://trisdenc.github.io/GM-OS/player-view/public?token=${TOK}`;
const FN=`${URL}/functions/v1/battle-map`;
const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const browser = await chromium.launch({ executablePath: EXE, headless:true });
const errs=[];
const mk = async (n)=>{ const p=await browser.newPage({viewport:{width:760,height:640},colorScheme:'dark'}); p.on('pageerror',e=>errs.push(`[${n}] `+e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(`[${n}c] `+m.text());}); await p.goto(PROD,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(2500); return p; };
const leftOf=(p,L)=>p.evaluate((L)=>{const s=[...document.querySelectorAll('span')].find(x=>x.textContent===L);if(!s)return null;const el=s.closest('div[style*="left"]');return el?parseFloat(el.style.left):null;},L);
const A=await mk('A'); const B=await mk('B');
console.log('A has Hero:', await A.evaluate(()=>[...document.querySelectorAll('span')].some(s=>s.textContent==='Hero')));
console.log('B Goblin left% before:', await leftOf(B,'Goblin'));
// external persisted move (postgres_changes path)
const r=await fetch(FN,{method:'POST',headers:{apikey:KEY,Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'},body:JSON.stringify({action:'move',token:TOK,mapId:MAP,tokenId:'tk2',x:15,y:20})});
console.log('edge move http', r.status);
await A.waitForTimeout(3000);
console.log('A Goblin left% after:', await leftOf(A,'Goblin'), '| B Goblin left% after:', await leftOf(B,'Goblin'));
// broadcast path: drag Hero in A, see B
const box=await A.evaluate(()=>{const s=[...document.querySelectorAll('span')].find(x=>x.textContent==='Hero');const el=s.closest('div[style*="left"]');const r=el.getBoundingClientRect();return {cx:r.x+r.width/2,cy:r.y+r.height/2};});
const bHeroBefore=await leftOf(B,'Hero');
await A.mouse.move(box.cx,box.cy); await A.mouse.down(); await A.mouse.move(box.cx+150,box.cy,{steps:12}); await A.mouse.up();
await A.waitForTimeout(1500);
console.log('B Hero left% before:', bHeroBefore, '-> after:', await leftOf(B,'Hero'));
console.log('ERRORS:', errs.length?JSON.stringify(errs.slice(0,8),null,1):'none');
await browser.close();
