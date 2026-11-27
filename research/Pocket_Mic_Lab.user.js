// ==UserScript==
// @name         Pocket - Mic Pipeline Lab
// @namespace    https://github.com/JadanPoll/AI_Pill_OS
// @version      0.1.0
// @description  Explicit one-shot microphone reuse and metadata-only dictation trace.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// @noframes
// ==/UserScript==
(() => {
  'use strict';
  if (window.top !== window || document.getElementById('pocket-mic-lab')) return;
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) return;
  const originalGum = md.getUserMedia;
  const tracked = new WeakMap(), attached = new WeakSet(), recorders = new WeakSet();
  const clones = new Set(), rows = [];
  let reserve = null, pending = false, armed = false, eligibleUntil = 0;
  let expires = 0, lease = 0, generation = 0, trial = 0, serial = 0, ui, status;
  const now = () => Date.now();
  function log(event, detail = {}) {
    rows.push({ at: now(), t: Math.round(performance.now()), visibility: document.visibilityState,
      activation: navigator.userActivation?.isActive ?? null, trial, event, ...detail });
    if (rows.length > 500) rows.shift();
    paint();
  }
  function tracks(stream) {
    return stream?.getTracks().map(t => ({ kind:t.kind, state:t.readyState, enabled:t.enabled, muted:t.muted })) || [];
  }
  function paint() {
    if (!status) return;
    status.textContent = pending ? 'Permission pending' : reserve ?
      (armed ? 'Reserved · reuse armed' : eligibleUntil > now() ? 'Waiting for native acquisition' : 'Reserved · reuse disarmed') :
      'Observe only';
  }
  function watch(stream, source) {
    for (const t of stream.getTracks()) {
      tracked.set(t, source);
      if (attached.has(t)) continue;
      attached.add(t);
      for (const e of ['mute','unmute','ended'])
        t.addEventListener(e, () => log('track.'+e,{source,kind:t.kind,state:t.readyState,enabled:t.enabled,muted:t.muted}));
    }
    return stream;
  }
  function release(reason) {
    generation++; clearTimeout(lease); armed = false; eligibleUntil = 0; expires = 0;
    pending = false;
    const r = reserve; reserve = null;
    for (const t of clones) t.stop();
    clones.clear();
    for (const t of r?.getTracks() || []) t.stop();
    log('reservation.release',{reason});
  }
  async function arm() {
    if (pending || reserve || document.hidden) return;
    if (!confirm('Reserve microphone and allow ONE explicitly requested ChatGPT dictation to reuse it for up to 2 minutes? No idle audio is stored or sent. Release stops the reservation and any borrowed tracks.')) return;
    const g = ++generation; trial++; pending = true; expires = now()+120000;
    lease = setTimeout(() => release('lease expired'),120000);
    log('reservation.request');
    try {
      const stream = await originalGum.call(md,{audio:true,video:false});
      if (g !== generation || now() >= expires) { stream.getTracks().forEach(t=>t.stop()); return; }
      reserve = watch(stream,'reservation'); pending = false; armed = true;
      log('reservation.grant',{tracks:tracks(stream)});
    } catch(e) { if (g === generation) { release('permission failure'); log('reservation.error',{name:e.name}); } }
  }
  // A one-shot grant is consumed only by the native Dictate click, including
  // Pocket's explicitly requested remote click. Never replace arbitrary capture.
  document.addEventListener('click', e => {
    const b = e.target?.closest?.('button');
    if (!b || !b.closest('[data-chatgpt-composer], form')) return;
    const label = b.getAttribute('aria-label') || b.title || '';
    const state = b.getAttribute('data-dictation-button');
    const start = state === 'idle' || (/^Dictate(?:\s*\(|$)/i.test(label) && !state && b.getAttribute('aria-pressed') !== 'true');
    if (!start && !/dictat|transcrib/i.test(label)) return;
    log('native.click',{start,state,label:label.slice(0,80),trusted:e.isTrusted});
    if (start && armed && reserve && now()<expires) {
      armed = false; eligibleUntil = Math.min(now()+15000,expires);
      log('reuse.eligible');
    }
  },true);
  function safeConstraints(c) {
    if (!c?.audio || c.video) return false;
    if (c.audio === true) return true;
    if (typeof c.audio !== 'object') return false;
    // Do not substitute a different device or ignore mandatory constraints.
    return Object.entries(c.audio).every(([k,v]) =>
      !['deviceId','groupId','advanced'].includes(k) &&
      !(v && typeof v === 'object' && ['exact','min','max'].some(p=>p in v)));
  }
  const wrappedGum = function(c) {
    const id = ++serial, start = now();
    const eligible = eligibleUntil > now();
    log('gum.call',{id,audio:!!c?.audio,video:!!c?.video,
      audioKeys:c?.audio && typeof c.audio==='object'?Object.keys(c.audio):[],eligible});
    if (eligible && c?.audio) {
      eligibleUntil = 0;
      const t = reserve?.getAudioTracks().find(t=>t.readyState==='live'&&t.enabled&&!t.muted);
      if (t && now()<expires && safeConstraints(c)) {
        try {
          const borrowed = t.clone(); clones.add(borrowed);
          const stream = watch(new MediaStream([borrowed]),'borrowed:'+id);
          // Optional preferences may differ from a fresh native acquisition.
          log('gum.reused',{id,elapsed:now()-start,tracks:tracks(stream)});
          return Promise.resolve(stream);
        } catch(e) { log('reuse.cloneError',{id,name:e.name}); }
      }
      log('reuse.notUsed',{id,reason:t?'constraints or expiry':'no unmuted live reserved track'});
    }
    try {
      const p = originalGum.apply(this,arguments);
      p.then(s=>{watch(s,'native:'+id);log('gum.resolved',{id,elapsed:now()-start,tracks:tracks(s)});},
        e=>log('gum.rejected',{id,elapsed:now()-start,name:e.name}));
      return p;
    } catch(e) {log('gum.threw',{id,name:e.name});throw e;}
  };
  const hooks = {};
  function hook(obj,key,wrap) {
    if (typeof obj?.[key] !== 'function') { hooks[key]='unavailable'; return; }
    try { const old=obj[key], fn=wrap(old); obj[key]=fn; hooks[key]=obj[key]===fn?'installed':'failed'; }
    catch(e){hooks[key]=e.name;}
  }
  try { md.getUserMedia=wrappedGum; hooks.getUserMedia=md.getUserMedia===wrappedGum?'installed':'failed'; }
  catch(e){hooks.getUserMedia=e.name;}
  hook(window.MediaStreamTrack?.prototype,'stop',old=>function(){
    const source=tracked.get(this);
    if(source) log('track.stop',{source,kind:this.kind});
    clones.delete(this); return old.apply(this,arguments);
  });
  function sources(s) { return s?.getTracks().map(t=>tracked.get(t)||t.kind)||[]; }
  for (const key of ['start','stop','pause','resume','requestData']) {
    const proto=window.MediaRecorder?.prototype;
    if(typeof proto?.[key]!=='function')continue;
    try {
      const old=proto[key];
      proto[key]=function(){
        if(!recorders.has(this)){
          recorders.add(this);
          for(const e of ['start','stop','pause','resume','error','dataavailable'])
            this.addEventListener(e,ev=>log('recorder.event.'+e,{state:this.state,sources:sources(this.stream),
              ...(e==='dataavailable'?{bytes:ev.data?.size||0}:{})}));
        }
        log('recorder.'+key,{state:this.state,sources:sources(this.stream)});
        try{return old.apply(this,arguments);}catch(e){log('recorder.error',{method:key,name:e.name});throw e;}
      };
      hooks['recorder.'+key]='installed';
    }catch(e){hooks['recorder.'+key]=e.name;}
  }
  const AC=window.AudioContext||window.webkitAudioContext;
  hook(AC?.prototype,'createMediaStreamSource',old=>function(stream){
    log('audio.source',{state:this.state,time:this.currentTime,sources:sources(stream)});
    this.addEventListener('statechange',()=>log('audio.state',{state:this.state,time:this.currentTime}));
    return old.apply(this,arguments);
  });
  hook(AC?.prototype,'resume',old=>function(){
    log('audio.resume.call',{state:this.state,time:this.currentTime});
    const p=old.apply(this,arguments);
    p.then(()=>log('audio.resume.resolved',{state:this.state,time:this.currentTime}),
      e=>log('audio.resume.rejected',{name:e.name}));return p;
  });
  document.addEventListener('visibilitychange',()=>{
    if(reserve && now()>=expires)release('expired on visibility change');
    log('visibility',{reserve:tracks(reserve),borrowed:[...clones].map(t=>({state:t.readyState,muted:t.muted,enabled:t.enabled}))});
  });
  window.addEventListener('pagehide',()=>release('pagehide'));
  function mount(){
    if(!document.body || document.getElementById('pocket-mic-lab'))return;
    ui=document.createElement('div');ui.id='pocket-mic-lab';
    ui.style.cssText='position:fixed;right:10px;top:70px;z-index:2147483647';
    const root=ui.attachShadow({mode:'open'});
    root.innerHTML='<style>:host{color:#111;font:13px system-ui}section{background:white;border:1px solid #aaa;border-radius:10px;padding:8px;max-width:230px;box-shadow:0 2px 10px #0002}button{font:inherit;margin:3px;padding:7px;border:1px solid #aaa;background:#fafafa;border-radius:6px}summary{cursor:pointer}textarea{width:200px;height:90px}</style><section><details><summary>Mic Lab 0.1.0</summary><div id="status"></div><button id="arm">Arm reuse</button><button id="release">Release</button><button id="report">Copy trace</button><button id="clear">Clear trace</button><textarea hidden readonly></textarea></details></section>';
    status=root.getElementById('status');
    root.getElementById('arm').onclick=arm;
    root.getElementById('release').onclick=()=>release('user');
    root.getElementById('clear').onclick=()=>{rows.length=0;log('trace.cleared');};
    root.getElementById('report').onclick=async()=>{
      const text=JSON.stringify({version:'0.1.0',exportedAt:new Date().toISOString(),hooks,
        hookStillPresent:md.getUserMedia===wrappedGum,reservation:tracks(reserve),armed,events:rows},null,2);
      try{await navigator.clipboard.writeText(text);status.textContent='Trace copied';}
      catch{const ta=root.querySelector('textarea');ta.hidden=false;ta.value=text;ta.select();}
    };
    document.body.append(ui);paint();
  }
  log('lab.boot',{hooks,readyState:document.readyState});
  if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
})();