// ==UserScript==
// @name         AI Pill OS - Pocket
// @namespace    https://github.com/JadanPoll/AI_Pill_OS
// @version      0.1.1
// @description  A small cross-site pocket for text, links, questions and JSON; save and recall in Safari.
// @match        https://*/*
// @match        http://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.listValues
// @grant        GM.deleteValue
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @run-at       document-idle
// @noframes
// ==/UserScript==
(() => {
  'use strict';
  if (window.top !== window || document.getElementById('ai-pill-pocket')) return;
  const VERSION='0.1.1', PREFIX='pocket.v1.', LIMIT=100000, MAX_ITEMS=250;
  // Deliberately no localStorage fallback: that would appear to work but silently
  // partition the data by site. Only this installed script owns these GM keys.
  const modern=typeof GM!=='undefined' && ['getValue','setValue','listValues','deleteValue'].every(k=>typeof GM[k]==='function');
  const legacy=typeof GM_getValue==='function'&&typeof GM_setValue==='function'&&typeof GM_listValues==='function'&&typeof GM_deleteValue==='function';
  const store=modern?{get:(k)=>GM.getValue(k,null),set:(k,v)=>GM.setValue(k,v),keys:()=>GM.listValues(),del:k=>GM.deleteValue(k)}:
    legacy?{get:k=>GM_getValue(k,null),set:(k,v)=>GM_setValue(k,v),keys:()=>GM_listValues(),del:k=>GM_deleteValue(k)}:null;
  const host=document.createElement('div');host.id='ai-pill-pocket';
  const root=host.attachShadow({mode:'closed'});
  const $=id=>root.getElementById(id);
  const icons={pocket:'<path d="M4 5h16v10a8 8 0 0 1-16 0zM8 10l4 4 4-4"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',plus:'<path d="M12 4v16M4 12h16"/>',refresh:'<path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5"/>'};
  const icon=k=>'<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">'+icons[k]+'</svg>';
  const btn=(id,k,title,words='')=>'<button id="'+id+'" type="button" aria-label="'+title+'" title="'+title+'">'+icon(k)+(words?' '+words:'')+'</button>';
  root.innerHTML='<style>:host{all:initial;position:fixed;left:12px;bottom:18px;z-index:2147483645;color:#172033;font:14px system-ui}*{box-sizing:border-box}[hidden]{display:none!important}button,input,textarea{font:inherit;color:inherit}button{min-height:44px;min-width:44px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px;cursor:pointer}button:disabled{opacity:.45}#open{border-radius:22px;background:#172033;color:#fff;box-shadow:0 2px 10px #0004}#panel{width:min(400px,calc(100vw - 24px));max-height:78vh;overflow:auto;background:white;border:1px solid #cbd5e1;border-radius:13px;padding:10px;box-shadow:0 4px 20px #0004}.row{display:flex;gap:5px;align-items:center;margin:5px 0}.grow{flex:1;min-width:0}textarea,input{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:8px;background:#fff}input{min-height:44px}textarea{resize:vertical}small,#status{font-size:12px;color:#475569;overflow-wrap:anywhere}h3{font-size:15px;margin:0}#list{max-height:30vh;overflow:auto}.entry{display:block;text-align:left;width:100%;margin-top:4px;overflow-wrap:anywhere}.entry b,.entry small{display:block}#detail{border-top:1px solid #cbd5e1;margin-top:6px;padding-top:6px}#body{white-space:pre-wrap;overflow-wrap:anywhere;max-height:28vh;overflow:auto;background:#f8fafc;padding:8px;font:13px/1.45 ui-monospace,monospace;user-select:text}#save{background:#172033;color:#fff}#status{min-height:20px}details{border-top:1px solid #e2e8f0;padding:6px 0}summary{cursor:pointer}</style>'+
    btn('open','pocket','Open Pocket')+
    '<section id="panel" hidden><div class="row"><h3 class="grow">Pocket <small>v'+VERSION+'</small></h3>'+btn('close','close','Close Pocket')+'</div>'+
    '<textarea id="draft" rows="3" placeholder="Save a thought, passage, prompt or JSON…" aria-label="Text to save"></textarea><div class="row"><input id="source" class="grow" placeholder="Source (optional)" aria-label="Source URL or reference"><button id="save">Save</button></div>'+
    '<div class="row"><input id="filter" class="grow" placeholder="Find saved items…" aria-label="Find saved items">'+btn('refresh','refresh','Refresh saved items')+'</div><small id="count"></small><div id="list"></div>'+
    '<section id="detail" hidden><div class="row"><small class="grow" id="meta"></small>'+btn('copy','copy','Copy selected text','Copy')+'<button id="done">Back</button></div><pre id="body"></pre><details><summary>More</summary><div class="row"><button id="copy-record">Copy with source</button><button id="remove">Delete</button></div></details></section>'+
    '<details><summary>More</summary><div class="row"><button id="export">Copy all as JSON</button></div><small>Local userscript storage. Do not save credentials or other secrets. Enable only on trusted sites. No automatic upload.</small></details>'+
    '<textarea id="fallback" hidden rows="4" readonly aria-label="Manual copy fallback"></textarea><div id="status" role="status"></div></section>';
  document.documentElement.append(host);
  let records=[],selected=null,busy=false,loadEpoch=0;
  const status=t=>$('status').textContent=t;
  const action=(id,fn)=>{$(id).addEventListener('click',e=>{if(!e.isTrusted)return;try{Promise.resolve(fn()).catch(err=>status('Error: '+String(err?.message||err).slice(0,250)));}catch(err){status('Error: '+String(err?.message||err).slice(0,250));}});};
  function sourceURL(){try{const u=new URL(location.href);return u.origin+u.pathname;}catch{return '';}}
  function selection(){
    const s=window.getSelection();if(!s||s.isCollapsed)return '';
    const el=s.anchorNode?.parentElement;
    if(el?.closest('input,textarea,[contenteditable]'))return '';
    return s.toString().slice(0,LIMIT);
  }
  // Capture selection before the launcher takes focus. No continuous capture.
  let picked='';
  $('open').addEventListener('pointerdown',e=>{if(e.isTrusted)picked=selection();});
  function valid(v,k){return v&&typeof v==='object'&&v.id===k.slice(PREFIX.length)&&typeof v.text==='string'&&typeof v.source==='string'&&typeof v.created==='string';}
  async function load(){
    if(!store){status('GM storage unavailable. Check userscript manager permissions; nothing saved.');$('save').disabled=true;return;}
    const epoch=++loadEpoch;
    const keys=(await store.keys()).filter(k=>typeof k==='string'&&k.startsWith(PREFIX));
    const result=[];let skipped=0;
    for(const k of keys){const v=await store.get(k);if(valid(v,k))result.push(v);else skipped++;}
    if(epoch!==loadEpoch)return;
    records=result.sort((a,b)=>b.created.localeCompare(a.created));
    render();
    status((modern?'GM async':'GM legacy')+' · '+records.length+' saved'+(skipped?' · '+skipped+' unreadable records':''));
  }
  function render(){
    const q=$('filter').value.toLowerCase().trim();
    const found=records.filter(r=>!q||(r.text+'\n'+r.source).toLowerCase().includes(q));
    $('count').textContent=found.length+' / '+records.length+' items';
    $('list').replaceChildren();
    for(const r of found){
      const b=document.createElement('button');b.className='entry';b.type='button';
      const t=document.createElement('b');t.textContent=r.text.replace(/\s+/g,' ').slice(0,105)||'(empty)';
      const m=document.createElement('small');m.textContent=(r.source||'No source').slice(0,130)+' · '+r.created.slice(0,10);
      b.append(t,m);b.addEventListener('click',e=>{if(e.isTrusted)show(r);});$('list').append(b);
    }
  }
  function show(r){
    selected=r;$('detail').hidden=false;$('body').textContent=r.text;
    $('meta').textContent=(r.source||'No source')+'\n'+r.created;
    $('list').hidden=true;$('detail').scrollIntoView({block:'nearest'});
  }
  function hideDetail(){selected=null;$('detail').hidden=true;$('body').textContent='';$('meta').textContent='';$('list').hidden=false;}
  async function save(){
    if(!store||busy)return;
    const text=$('draft').value,source=$('source').value.trim();
    if(!text.trim()){status('Enter or select text first. To save only a link, paste the URL as text.');return;}
    if(text.length>LIMIT||source.length>2000){status('Item too large (100,000 text characters / 2,000 source characters). Split it first.');return;}
    busy=true;$('save').disabled=true;
    try{
      const keys=(await store.keys()).filter(k=>typeof k==='string'&&k.startsWith(PREFIX));
      if(keys.length>=MAX_ITEMS){status('Pocket full (250 items). Export and remove old items before saving.');return;}
      const id=globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
      const r={id,created:new Date().toISOString(),source,text};
      await store.set(PREFIX+id,r);
      const check=await store.get(PREFIX+id);
      if(!valid(check,PREFIX+id)||check.text!==text||check.source!==source)throw Error('Write could not be read back');
      $('draft').value='';await load();hideDetail();status('Saved · '+records.length+' items');
    }finally{busy=false;$('save').disabled=false;}
  }
  async function copyText(t){
    try{await navigator.clipboard.writeText(t);$('fallback').hidden=true;$('fallback').value='';status('Copied. Paste into the destination.');}
    catch{
      // Fallback lets the user explicitly select/copy even when Safari denies clipboard API.
      $('fallback').hidden=false;$('fallback').value=t;$('fallback').focus();$('fallback').select();status('Clipboard API unavailable. Use native Copy on the selected text.'); 
    }
  }
  action('open',async()=>{
    $('open').hidden=true;$('panel').hidden=false;
    if(!$('draft').value){$('draft').value=picked||selection();$('source').value=sourceURL();}
    picked='';await load();
  });
  action('close',()=>{++loadEpoch;hideDetail();$('fallback').hidden=true;$('fallback').value='';records=[];$('list').replaceChildren();$('panel').hidden=true;$('open').hidden=false;});
  action('save',save);action('refresh',load);
  $('filter').addEventListener('input',e=>{if(e.isTrusted){hideDetail();render();}});
  action('done',hideDetail);
  action('copy',()=>{if(selected)return copyText(selected.text);});
  action('copy-record',()=>{if(selected)return copyText(JSON.stringify(selected,null,2));});
  action('remove',async()=>{if(!store||!selected||busy)return;const r=selected;if(!confirm('Delete this saved item?'))return;await store.del(PREFIX+r.id);hideDetail();await load();status('Deleted item.');});
  action('export',async()=>{if(!store)return;await load();await copyText(JSON.stringify({schema:'ai_pill_os.pocket',version:1,items:records},null,2));});
  window.addEventListener('pageshow',()=>{if(!$('panel').hidden)load().catch(e=>status('Error: '+String(e.message||e)));});
})();
