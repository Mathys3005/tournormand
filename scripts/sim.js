import * as E from '../shared/engine.js';
function options(s){
  const p=s.players[s.turn], i=s.pending&&s.pending.tile;
  switch(s.phase){
    case 'roll': { const o=[{type:'roll',mode:['free','low','mid','high'][Math.random()*4|0]}]; if(p.jail&&p.cash>=100)o.push({type:'jailPay'}); if(p.jail&&p.escape)o.push({type:'jailCard'}); return o;}
    case 'travel': return [{type:'travel',to:Math.random()*32|0},{type:'stay'}];
    case 'buy': return [{type:'pass'},{type:'buy',level:Math.random()*4|0},{type:'buy',level:0}];
    case 'build': return [{type:'pass'},...E.buildOptions(s.pending.start).map(l=>({type:'build',level:l}))];
    case 'buyback': return [{type:'pass'},{type:'buyback'},{type:'buyback'}];
    case 'champ': return [{type:'pass'},...E.ownedBy(s,s.turn).map(t=>({type:'champ',tile:t}))];
    case 'storm': return [{type:'pass'},...E.stormTargets(s,s.turn).map(t=>({type:'storm',tile:t}))];
    case 'debt': return [...E.ownedBy(s,s.turn).map(t=>({type:'sell',tile:t})),{type:'bankrupt'}];
  }
  return [];
}
const reasons={}; let stuck=0, total=0, turns=[];
for(let g=0;g<1000;g++){
  let s=E.newGame([{id:'a',pseudo:'A'},{id:'b',pseudo:'B'},{id:'c',pseudo:'C'}],{maxRounds:0});
  let n=0;
  while(s.status==='playing'&&n<5000){
    const o=options(s); let a=o[Math.random()*o.length|0];
    if(s.phase==='debt' && Math.random()<0.8 && o.length>1) a=o[0];
    if(Math.random()<0.002){ const r=Math.random()*3|0; const ns=E.reduce(s,{type:'resign'},r); s=ns; n++; continue;}
    const ns=E.reduce(s,a,s.turn);
    if(ns===s){ // invalid; try pass or first option
      let ok=false; for(const x of o){const t=E.reduce(s,x,s.turn); if(t!==s){s=t;ok=true;break;}} if(!ok){stuck++;console.log("STUCK",s.phase);break;}
    } else s=ns;
    // invariants
    s.players.forEach(p=>{ if(p.cash<0) throw new Error('neg cash '+s.phase); });
    n++;
  }
  total++; reasons[s.winReason||'unfinished']=(reasons[s.winReason||'unfinished']||0)+1; turns.push(s.round);
}
turns.sort((a,b)=>a-b);
console.log(total, 'stuck',stuck, reasons, 'median rounds', turns[turns.length>>1]);
