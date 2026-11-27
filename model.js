/* Promille 2.2 – exploratory population PK model, not a measurement. MIT-style no dependencies. */
(function(root){'use strict';
const MIN=60000,HOUR=60*MIN, N=512, LIMITS=[.5,.2,.01], DENSITY=1.055;
const grams=(ml,abv)=>ml*abv*.00789;
function volume(p){const w=p.sex==='m'?2.447-.09516*p.age+.1074*p.height+.3362*p.weight:-2.097+.1069*p.height+.2466*p.weight;return w/(p.sex==='m'?.825:.838)} // apparent litres
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function normal(r){return Math.sqrt(-2*Math.log(Math.max(r(),1e-12)))*Math.cos(2*Math.PI*r())}
function logN(r,median,cv){return median*Math.exp(Math.sqrt(Math.log1p(cv*cv))*normal(r))}
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function quant(a,p){let x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(x-i)}
function sessions(entries){let out=[];for(const d of entries){let s=out.at(-1);if(!s||d.t-s.drinks.at(-1).t>=18*HOUR){s={id:d.t,start:d.t,drinks:[],profile:d.profile};out.push(s)}s.drinks.push(d);s.end=d.t;}return out}
function parameters(p,r){const v=volume(p)*clamp(logN(r,1,p.sex==='m'?.10:.15),.55,1.65);const ratio=11.1/39.3;let vc=v*ratio,vp=v-vc;const q=clamp(logN(r,96.8*v/39.3,.38),20,400); // scaled adaptation of published venous model
// Independent uncertainty; body-mass scaling and distributions are exploratory, not calibrated percentiles.
const vmax=clamp(logN(r,6.31*Math.pow(p.weight/75,.75),.25),2.5,20);const km=clamp(logN(r,.0849,.40),.015,.30);
return {vc,vp,q,km,vmax,foodEffect:clamp(logN(r,1.39,.15),1,2),foodState:1,fast:clamp(logN(r,3.64,.70),.25,12),fed:clamp(logN(r,1.45,.40),.22,8),f:clamp(logN(r,.944,.04),.75,1),g:[0,0,0],c:0,p:0,elim:0,ingested:0}}
function setProfile(m,p,r){let n=parameters(p,r);for(let k of ['vc','vp','q','km','vmax','foodEffect','fast','fed','f'])m[k]=n[k]}
const foodIndex=f=>f==='empty'?0:f==='full'?2:1;
// Stable exact absorption/exchange substeps, bounded elimination, mass-conserving.
function step(m,input,dt){let ks=[m.fast,Math.sqrt(m.fast*m.fed),m.fed];let absorbed=0;for(let k=0;k<3;k++){let x=ks[k]*dt,dec=Math.exp(-x),incoming=input[k]*m.f,old=m.g[k];let remain=old*dec+incoming*(-Math.expm1(-x))/x;absorbed+=old+incoming-remain;m.g[k]=remain;m.ingested+=incoming}m.c+=absorbed;
let eq=(m.c+m.p)*m.vc/(m.vc+m.vp);let a=eq+(m.c-eq)*Math.exp(-m.q*(1/m.vc+1/m.vp)*dt);m.p+=m.c-a;m.c=a;
let conc=m.c/m.vc;let effect=m.foodState===0?1:m.foodState===2?m.foodEffect:Math.sqrt(m.foodEffect);let e=Math.min(m.c,m.vmax*effect*conc/(m.km+conc)*dt);m.c-=e;m.elim+=e;return m.c/m.vc/DENSITY}
function at(points,t){if(!points.length)return {t,mid:0,lo:0,hi:0};if(t<=points[0].t)return {...points[0],t};if(t>=points.at(-1).t)return {...points.at(-1),t};let l=0,h=points.length-1;while(h-l>1){let i=(h+l)>>1;if(points[i].t<t)l=i;else h=i}let a=points[l],b=points[h],f=(t-a.t)/(b.t-a.t);return {t,mid:a.mid+(b.mid-a.mid)*f,lo:a.lo+(b.lo-a.lo)*f,hi:a.hi+(b.hi-a.hi)*f}}
function simulate(entries,profile,now,morning,{n=N,dtMin=1}={}){
 entries=[...entries].sort((a,b)=>a.t-b.t);if(!entries.length)return {points:[{t:now,mid:0,lo:0,hi:0},{t:Math.max(now+HOUR,morning),mid:0,lo:0,hi:0}],thresholds:[],peak:null,now,morning};
 const ss=sessions(entries),latest=ss.at(-1),start=Math.floor(entries[0].t/MIN)*MIN,recordStart=Math.max(now-48*HOUR,Math.min(latest.start-30*MIN,now-30*MIN)),end=Math.max(now+3*HOUR,morning+HOUR,latest.end+6*HOUR),cap=Math.max(end,latest.end+14*24*HOUR),dt=dtMin/60,ms=dtMin*MIN;
 const models=Array.from({length:n},(_,i)=>{let r=rng(1234567+i*7919);return {...parameters(ss[0].profile||profile,r),r,idx:0,cross:LIMITS.map(()=>null),prev:0}});
 let points=[],active=[],idx=0,si=0,vals=new Float64Array(n),peak={t:latest.start,mid:0},maxMass=0,stopped=false;
 // Duration/dose factors are stable per drink and scenario, not resampled each step.
 const sampled=entries.map((d,j)=>models.map((m,i)=>{let r=rng(98765+((d.t/1000)|0)+i*104729+j*17);return {g:d.g*clamp(logN(r,1,.06),.8,1.25),duration:Math.max(.25,d.duration*clamp(logN(r,1,.30),.35,2.5))*MIN,food:foodIndex(d.food)}}));
 const latestInputEnd=Math.max(...entries.map((d,j)=>d.t+Math.max(...sampled[j].map(x=>x.duration))));
 function add(t){let sorted=Array.from(vals).sort((a,b)=>a-b),p={t,lo:quant(sorted,.025),mid:quant(sorted,.5),hi:quant(sorted,.975)};points.push(p);if(p.mid>peak.mid)peak=p}
 for(let t=start;t<=cap;t+=ms){
  while(si+1<ss.length&&ss[si+1].start<t){si++;if(JSON.stringify(ss[si].profile||profile)!==JSON.stringify(ss[si-1].profile||profile))for(const m of models)setProfile(m,ss[si].profile||profile,m.r)}
  while(idx<entries.length&&entries[idx].t<t)active.push(idx++);
  active=active.filter(j=>t-ms<entries[j].t+entries[j].duration*2.5*MIN+MIN);
  maxMass=0;
  for(let i=0;i<n;i++){let m=models[i],input=[0,0,0];for(let j of active){let d=entries[j],a=sampled[j][i],overlap=Math.max(0,Math.min(t,d.t+a.duration)-Math.max(t-ms,d.t));input[a.food]+=a.g*overlap/a.duration;if(overlap>0)m.foodState=a.food}let c=step(m,input,dt);vals[i]=c;maxMass=Math.max(maxMass,m.c+m.p+m.g[0]+m.g[1]+m.g[2]);if(t>=latest.start){for(let k=0;k<3;k++){let lim=LIMITS[k];if(c>=lim)m.cross[k]={t:null,above:true};else if(m.prev>=lim)m.cross[k]={t:t-ms+(m.prev-lim)/(m.prev-c)*ms,above:false}}}m.prev=c}
  if(t>=recordStart)add(t);
  if(t>=end&&t>=latestInputEnd&&maxMass<.001){stopped=true;break}
  // Skip idle archive spans only after all model mass is negligible. Never discard appreciable residual alcohol.
  if(!active.length&&maxMass<1e-6&&t<recordStart-2*HOUR){let jump=Math.floor(Math.min(idx<entries.length?entries[idx].t-30*MIN:recordStart-ms,recordStart-ms)/ms)*ms;if(jump>t+ms){t=jump-ms;}}
 }
 const thresholds=LIMITS.map((limit,k)=>{let times=models.map(m=>m.cross[k]?.above?Infinity:m.cross[k]?.t??-Infinity).sort((a,b)=>a-b);let q=p=>times[Math.floor((n-1)*p)];return {limit,lo:q(.025),mid:q(.5),hi:q(.975),notReached:times.filter(t=>t===-Infinity).length,unresolved:times.filter(t=>t===Infinity).length}});
 return {points,thresholds,peak,now,morning,latest,stopped,capReached:!stopped,massError:Math.max(...models.map(m=>Math.abs(m.ingested-m.elim-m.c-m.p-m.g.reduce((a,b)=>a+b,0))))};
}
root.PromilleModel={MIN,HOUR,N,grams,volume,parameters,step,simulate,sessions,at,rng};if(typeof module!=='undefined')module.exports=root.PromilleModel;
})(typeof self!=='undefined'?self:globalThis);
