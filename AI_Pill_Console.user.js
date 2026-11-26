// ==UserScript==
// @name         AI Pill OS - Console journal
// @namespace    https://github.com/JadanPoll/AI_Pill_OS
// @version      0.1.2
// @match        https://*/*
// @match        http://*/*
// @run-at       document-start
// @weight       999
// @inject-into  content
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// @updateURL    https://raw.githubusercontent.com/JadanPoll/AI_Pill_OS/main/AI_Pill_Console.user.js
// @downloadURL  https://raw.githubusercontent.com/JadanPoll/AI_Pill_OS/main/AI_Pill_Console.user.js
// ==/UserScript==
(()=>{
'use strict';
if(window.top!==window)return;
const VERSION='0.1.2',MAX=600,BUDGET=350000,EVENT='ai-pill-console-open';
const boot=Date.now(),pageId=String(boot)+'-'+Math.random().toString(36).slice(2);
const modern=typeof GM!=='undefined'&&typeof GM.getValue==='function'&&typeof GM.setValue==='function';
const legacy=typeof GM_getValue==='function'&&typeof GM_setValue==='function';
const store=modern?{get:k=>GM.getValue(k,null),set:(k,v)=>GM.setValue(k,v)}:legacy?{get:k=>GM_getValue(k,null),set:(k,v)=>GM_setValue(k,v)}:null;
let tabId=null;try{tabId=sessionStorage.getItem('ai-pill-console-tab');if(!/^[a-z0-9-]{10,100}$/.test(tabId||'')){tabId=pageId;sessionStorage.setItem('ai-pill-console-tab',tabId);}}catch{}
const key=tabId?'console.v1.'+location.origin+'.'+tabId:null;
const url=v=>{try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.origin+u.pathname.split('/').map(p=>p.length>80?'[long segment]':p).join('/'):u.protocol;}catch{return '[unavailable]';}};
function clean(v,n=4000){return String(v??'').replace(/https?:\/\/[^\s"'<>]+/gi,x=>url(x)).replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,'Bearer [redacted]').replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,'[redacted JWT]').replace(/((?:password|authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|cookie|secret)\s*[:=]\s*)[^\s,;]+/gi,'$1[redacted]').replace(/'nonce-[^']+'/g,"'nonce-[redacted]'").slice(0,n);}
function value(v,d=0,seen=new WeakSet()){
 try{
 if(v==null||typeof v==='number'||typeof v==='boolean')return v??null;
 if(typeof v==='string'||typeof v==='bigint'||typeof v==='symbol')return clean(v);
 if(typeof v==='function')return '[function]';
 if(v instanceof Error)return {name:clean(v.name,100),message:clean(v.message),stack:clean(v.stack,6000)};
 if(v instanceof Element)return {tag:v.localName,id:clean(v.id,100)};
 if(d>=3)return '[depth limit]';if(seen.has(v))return '[circular]';seen.add(v);
 const result=Object.create(null),ks=Object.keys(v);
 for(const k of ks.slice(0,24)){const x=Object.getOwnPropertyDescriptor(v,k);result[clean(k,120)]=/password|secret|authorization|cookie|token|credential|api.?key/i.test(k)?'[redacted]':x&&'value'in x?value(x.value,d+1,seen):'[accessor omitted]';}
 if(ks.length>24)result['[omitted keys]']=ks.length-24;return result;
 }catch{return '[uninspectable]';}
}
let rows=[],dropped=0,total=0,seq=0,ready=false,dirty=false,timer=null,writing=false,writeAgain=false,lastSaved=null,storageError=null;
const hooks={},hookErrors=[];
const FULL_PAGES=3,COMPACT_PAGES=20,MAX_SIGNATURES=96;
let historical=[],aggregate={pages:0,events:0,types:{},signatures:{},other:0},examples=[];
const sessionOf=e=>e.id.split(':')[0];
function signature(e){
 const a=e.args||[],meta=a[2]||{};
 const raw=e.type==='CSP'?[e.type,e.effectiveDirective,e.blockedURI,e.disposition,e.originalPolicy]:['error','unhandledrejection','console.error','console.warn'].includes(e.type)?[e.type,e.message||e.reason||a[0],a[1]]:a[1]==='state'?[e.type,a[0],meta.state,meta.detail]:[e.type,a[1]==='pong'?'pong':a[0]||e.state||e.visibility||''];
 return clean(JSON.stringify(raw),1000).replace(/heartbeat \d+s ago/g,'heartbeat #s ago');
}
const important=e=>['CSP','error','unhandledrejection','console.error','console.warn'].includes(e.type);
function fold(e){
 const id=sessionOf(e),sig=signature(e);let h=historical.find(x=>x.id===id);
 if(!h){h={id,first:e.time,last:e.time,count:0,types:{},signatures:{},other:0};historical.push(h);}
 h.last=e.time;h.count++;h.types[e.type]=(h.types[e.type]||0)+1;
 if(h.signatures[sig])h.signatures[sig].count++;
 else if(Object.keys(h.signatures).length<MAX_SIGNATURES)h.signatures[sig]={count:1,first:e.time,example:important(e)?e:undefined};
 else h.other++;
 if(important(e)&&!examples.some(x=>x.signature===sig)){examples.push({signature:sig,event:e});if(examples.length>16)examples.shift();}
 while(historical.length>COMPACT_PAGES){const old=historical.shift();aggregate.pages++;aggregate.events+=old.count;for(const [k,n] of Object.entries(old.types))aggregate.types[k]=(aggregate.types[k]||0)+n;for(const [k,v] of Object.entries(old.signatures)){if(aggregate.signatures[k]||Object.keys(aggregate.signatures).length<MAX_SIGNATURES)aggregate.signatures[k]=(aggregate.signatures[k]||0)+v.count;else aggregate.other+=v.count;}aggregate.other+=old.other;}
}
function trim(){
 const pages=[...new Set(rows.map(r=>sessionOf(r.e)))];
 const keep=new Set(pages.slice(-FULL_PAGES));
 while(rows.length&&(!keep.has(sessionOf(rows[0].e))||rows.length>MAX||total>BUDGET)){const r=rows.shift();total-=r.size;fold(r.e);dropped++;}
}
function add(type,data={}){
 try{const e={id:pageId+':'+(++seq),time:new Date().toISOString(),ms:Math.round(performance.now()),type,...data};let size=JSON.stringify(e).length;
 if(size>16000){delete e.args;delete e.reason;delete e.error;e.truncated=true;e.summary=clean(JSON.stringify(data),10000);size=JSON.stringify(e).length;}
 rows.push({e,size});total+=size;trim();dirty=true;schedule();}catch{}
}
function schedule(){if(!ready||!store||!key||timer!==null)return;timer=setTimeout(()=>{timer=null;void flush();},250);}
async function flush(){
 if(!ready||!store||!key||!dirty)return;
 if(writing){writeAgain=true;return;}writing=true;dirty=false;
 try{await store.set(key,{version:2,entries:rows.map(r=>r.e),dropped,historical,aggregate,examples});lastSaved=new Date().toISOString();storageError=null;}catch(e){storageError=clean(e.message);dirty=true;}
 finally{writing=false;if(writeAgain){writeAgain=false;schedule();}}
}
for(const level of ['log','info','warn','error','debug','trace','assert','dir','table','group','groupCollapsed','groupEnd','clear']){
 try{const original=console[level];if(typeof original!=='function')continue;
 const wrapped=function(...args){if(level!=='assert'||!args[0])add('console.'+level,{args:args.slice(0,16).map(x=>value(x)),omittedArgs:Math.max(0,args.length-16)});return Reflect.apply(original,this,args);};
 console[level]=wrapped;hooks[level]=wrapped;if(console[level]!==wrapped)hookErrors.push(level);
 }catch(e){hookErrors.push(level+': '+clean(e.message));}
}
window.addEventListener('error',e=>{const t=e.target,src=e.filename||t?.src||t?.href;add('error',{message:clean(e.message),source:src?url(src):null,line:e.lineno||null,column:e.colno||null,target:t?.localName||null,error:e.error?value(e.error):null});},true);
window.addEventListener('unhandledrejection',e=>add('unhandledrejection',{reason:value(e.reason)}));
window.addEventListener('rejectionhandled',e=>add('rejectionhandled',{reason:value(e.reason)}));
document.addEventListener('securitypolicyviolation',e=>add('CSP',{blockedURI:clean(e.blockedURI),effectiveDirective:e.effectiveDirective,violatedDirective:e.violatedDirective,disposition:e.disposition,originalPolicy:clean(e.originalPolicy,8000),source:e.sourceFile?url(e.sourceFile):null,line:e.lineNumber,column:e.columnNumber}));
for(const type of ['DOMContentLoaded','readystatechange','visibilitychange'])document.addEventListener(type,()=>{add(type,{state:document.readyState,visibility:document.visibilityState});if(document.hidden)void flush();});
for(const type of ['load','pageshow','pagehide','online','offline','popstate'])window.addEventListener(type,e=>{add(type,{persisted:e.persisted??null,page:url(location.href)});if(type==='pagehide')void flush();});
add('journal.start',{version:VERSION,page:url(location.href),readyState:document.readyState,weight:999,realm:'content',hooks:Object.keys(hooks),hookErrors});
(async()=>{try{if(store&&key){const old=await store.get(key);if(Array.isArray(old?.entries)){historical=Array.isArray(old.historical)?old.historical:historical;aggregate=old.aggregate||aggregate;examples=old.examples||examples;const current=rows;rows=old.entries.filter(e=>e&&typeof e.id==='string').map(e=>({e,size:JSON.stringify(e).length})).concat(current);total=rows.reduce((n,r)=>n+r.size,0);dropped+=Number(old.dropped)||0;trim();}}}catch(e){storageError=clean(e.message);}finally{ready=true;dirty=true;schedule();}})();
function resourceEntries(){return performance.getEntriesByType('resource').slice(-300).map(e=>({url:url(e.name),type:e.initiatorType,startMs:e.startTime,duration:e.duration,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize,responseStatus:e.responseStatus??null,fetchStart:e.fetchStart,responseStart:e.responseStart,responseEnd:e.responseEnd}));}
function report(){return {schema:'ai_pill_os.console_journal',version:VERSION,time:new Date().toISOString(),page:url(location.href),pageId,environment:{ua:navigator.userAgent,readyState:document.readyState,visibility:document.visibilityState,viewport:[innerWidth,innerHeight]},persistence:{mode:store&&key?'GM per tab/origin':'memory only',ready,lastSaved,storageError,dropped,retained:rows.length,retention:{fullPages:FULL_PAGES,compactPages:COMPACT_PAGES,maxEntries:MAX,characterBudget:BUDGET}},history:{historical,aggregate,failureExamples:examples},console:{hooked:Object.keys(hooks),stillHooked:Object.keys(hooks).filter(k=>console[k]===hooks[k]),hookErrors},entries:rows.map(r=>r.e),resources:resourceEntries(),limitations:['Content-world console only; page-world console, native extension logs and messages before injection may be invisible.','Reload checkpoints are best effort; browser termination or a blocked main thread may lose the newest entries.','Recent events are bounded by count and size; older events are summarized by page and signature. Values are limited and best-effort redacted. Review before sharing.']};}
let host,root,box,area,status,launcher,copying=false;
function syncLauncher(){if(launcher&&box.hidden)launcher.hidden=!!document.querySelector('#ai-pill-os[data-console-journal]');}
function show(){if(!host)mount();if(!host)return;area.value=JSON.stringify(report(),null,2);box.hidden=false;launcher.hidden=true;status.textContent='Review before copying. '+rows.length+' entries.';}
function mount(){
 if(host||!document.documentElement)return;
 host=document.createElement('div');host.id='ai-pill-console';root=host.attachShadow({mode:'closed'});
 root.innerHTML='<style>:host{all:initial;position:fixed;right:12px;bottom:75px;z-index:2147483647;font:14px system-ui;color:#172033}[hidden]{display:none!important}button{font:inherit;min-height:44px;border:1px solid #94a3b8;border-radius:9px;background:white;color:#172033;padding:8px;cursor:pointer}#launch{border-radius:22px;background:#172033;color:white}section{width:min(440px,calc(100vw - 24px));padding:10px;background:#fff;border:1px solid #94a3b8;border-radius:12px;box-shadow:0 3px 16px #0003}.row{display:flex;align-items:center;gap:6px}.grow{flex:1}textarea{width:100%;box-sizing:border-box;height:min(45vh,330px);font:12px monospace;margin:8px 0}small{color:#475569}</style><button id="launch" title="Open console journal">Logs v'+VERSION+'</button><section id="box" hidden><div class="row"><strong class="grow">Console <small>v'+VERSION+'</small></strong><button id="refresh" title="Refresh report">↻</button><button id="close" aria-label="Close">×</button></div><textarea id="area" readonly aria-label="Review console report"></textarea><div class="row"><button id="copy" class="grow">Copy logs</button></div><small id="status" role="status"></small></section>';
 const $=id=>root.getElementById(id);box=$('box');area=$('area');status=$('status');launcher=$('launch');launcher.onclick=show;$('refresh').onclick=show;$('close').onclick=()=>{box.hidden=true;syncLauncher();};$('copy').onclick=async e=>{
 if(!e.isTrusted||copying)return;
 const text=area.value,size=text.length.toLocaleString()+' characters';
 if(!text){status.textContent='Refresh report first.';return;}
 copying=true;status.textContent='Copying…';
 try{await navigator.clipboard.writeText(text);status.textContent='Copied · '+size+'.';}
 catch(err){area.value=text;area.focus();area.select();status.textContent='Not copied: '+clean(err.message||err,160)+' · '+size+'. Tap Copy logs again or use native Copy.';}
 finally{copying=false;}
 };
 document.documentElement.append(host);syncLauncher();
 if(typeof MutationObserver==='function')new MutationObserver(syncLauncher).observe(document.documentElement,{childList:true});
}
document.addEventListener(EVENT,show);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
