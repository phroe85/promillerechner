/* Promille 2.5 – exploratory venous population PK; not a measurement. */
(function(root){'use strict';
const MIN=60000,HOUR=60*MIN,N=512,LIMITS=[.5,.2,.01],DENSITY=1.055,BUILD=25;
const grams=(ml,abv)=>ml*abv*.00789,clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296}}
function normal(r){return Math.sqrt(-2*Math.log(Math.max(r(),1e-12)))*Math.cos(2*Math.PI*r())}
const logfactor=(z,cv)=>Math.exp(Math.sqrt(Math.log1p(cv*cv))*z);
// Acklam inverse normal approximation; interior probabilities only.
function invnorm(p){const a=[-39.6968302866538,220.946098424521,-275.928510446969,138.357751867269,-30.6647980661472,2.50662827745924],b=[-54.4760987982241,161.585836858041,-155.698979859887,66.8013118877197,-13.2806815528857],c=[-.00778489400243029,-.322396458041136,-2.40075827716184,-2.54973253934373,4.37466414146497,2.93816398269878],d=[.00778469570904146,.32246712907004,2.445134137143,3.75440866190742];let q,r;if(p<.02425||p>.97575){q=Math.sqrt(-2*Math.log(p<.5?p:1-p));r=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);return p<.5?r:-r}q=p-.5;r=q*q;return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1)}
function lhs(n,dim,seed){const r=rng(seed),out=Array.from({length:n},()=>[]);for(let k=0;k<dim;k++){const perm=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){let j=Math.floor(r()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]]}for(let i=0;i<n;i++)out[i].push(invnorm((perm[i]+.5)/n))}return out}
function quant(a,p){let x=(a.length-1)*p,i=Math.floor(x);return a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(x-i)}
function sessionStart(t){let d=new Date(t);d.setHours(7,0,0,0);if(+d>t)d.setDate(d.getDate()-1);return +d}
function sessions(entries){let out=[];for(const d of entries){let id=sessionStart(d.t),s=out.at(-1);if(!s||s.id!==id){s={id,start:d.t,drinks:[],profile:d.profile};out.push(s)}s.drinks.push(d);s.end=d.t}return out}
function peripheral(weight){return 28.2*Math.pow(weight/75,1.49)} // 75 kg reference assumption, see MODELL.md
function volume(p){return 11.1+peripheral(p.weight)}
function watsonVolume(p){const w=p.sex==='m'?2.447-.09516*p.age+.1074*p.height+.3362*p.weight:-2.097+.1069*p.height+.2466*p.weight;return w/(p.sex==='m'?.825:.838)}
const FOOD=[0,.5,1],foodIndex=f=>f==='empty'?0:f==='full'?2:1;
const kindIndex=d=>d.kind==='beer'?1:d.kind==='wine'?2:['shot1','shot2'].includes(d.kind)?3:0;
// Relative ka modifiers; exploratory, not validated for 40% shots. Generic=published reference.
const DRINK=[[1,.35,.50,.85],[1,.78,.85,.75],[1,1,1,.70]];
function parameters(p,z,dt,{reference=false}={}){let factor=(i,cv)=>logfactor(z[i]||0,cv);let m={vc:clamp(11.1*factor(0,.579),3,45),vpFactor:factor(1,.171),q:clamp(96.8*factor(2,.264),25,300),vmax:6.31*factor(3,.135),km:.0849,f:.944,fast:clamp(3.64*factor(4,.971),.15,18),fed:clamp(1.45*factor(5,.319),.15,8),foodEffect:Math.max(1,1.39*factor(6,.106)),foodHalf:reference?Infinity:clamp(3*factor(7,.45),1,8),drinkZ:z[8]||0,g:new Float64Array(12),c:0,p:0,elim:0,ingested:0,foodLevel:0,occasion:1,weight:p.weight,pendingWeight:p.weight,cross:LIMITS.map(()=>null),prev:0};m.vp=peripheral(p.weight)*m.vpFactor;prepare(m,dt,reference);return m}
function prepare(m,dt,reference){m.dec=[];m.inFrac=[];for(let f=0;f<3;f++){let ka=f===0?m.fast:f===2?m.fed:Math.sqrt(m.fast*m.fed);for(let k=0;k<4;k++){let a=ka*(reference?1:DRINK[f][k]* (k?logfactor(m.drinkZ,.20):1));let x=a*dt/2;m.dec.push(Math.exp(-x));m.inFrac.push(-Math.expm1(-x)/x)}}m.foodDecay=Math.exp(-Math.LN2*dt/m.foodHalf);exchangeCoeff(m,dt)}
function exchangeCoeff(m,dt){m.ratio=m.vc/(m.vc+m.vp);m.exchange=Math.exp(-m.q*(1/m.vc+1/m.vp)*dt/2)}
function mass(m){let v=m.c+m.p;for(let k=0;k<12;k++)v+=m.g[k];return v}
function absorb(m,input){let a=0;for(let k=0;k<12;k++){let old=m.g[k],incoming=input[k]*.5*m.f;if(old===0&&incoming===0)continue;let remain=old*m.dec[k]+incoming*m.inFrac[k];a+=old+incoming-remain;m.g[k]=remain;m.ingested+=incoming}m.c+=a}
function exchange(m){let eq=(m.c+m.p)*m.ratio,a=eq+(m.c-eq)*m.exchange;m.p+=m.c-a;m.c=a}
// Symmetric split; implicit midpoint elimination with exact positive bound at low concentration.
function step(m,input,dt){absorb(m,input);exchange(m);let c0=m.c,capacity=m.vmax*m.occasion*(1+(m.foodEffect-1)*m.foodLevel*Math.sqrt(m.foodDecay))*dt,K=m.km*m.vc;
// implicit midpoint root, bounded. For very low concentrations exact first-order decay avoids clipping to zero.
let A=2*(K+c0)+capacity, e=capacity===0?0:(4*capacity*c0)/(A+Math.sqrt(Math.max(0,A*A-8*capacity*c0)));if(e>c0)e=c0*(-Math.expm1(-capacity/(K+c0)));e=clamp(e,0,c0);m.c-=e;m.elim+=e;exchange(m);absorb(m,input);m.foodLevel*=m.foodDecay;return m.c/m.vc/DENSITY}
function at(points,t){if(!points.length)return {t,mid:0,lo:0,hi:0};if(t<=points[0].t)return {...points[0],t};if(t>=points.at(-1).t)return {...points.at(-1),t};let l=0,h=points.length-1;while(h-l>1){let i=(h+l)>>1;if(points[i].t<t)l=i;else h=i}let a=points[l],b=points[h],f=(t-a.t)/(b.t-a.t);return {t,mid:a.mid+(b.mid-a.mid)*f,lo:a.lo+(b.lo-a.lo)*f,hi:a.hi+(b.hi-a.hi)*f}}
function simulate(entries,profile,now,morning,{n=N,dtMin=1,historyStart=null,reference=false,seed=1234567}={}){
 if(!Number.isInteger(n)||n<1||n>4096||![.25,.5,1].includes(dtMin))throw Error('Invalid simulation options');
 entries=[...entries].sort((a,b)=>a.t-b.t);if(!entries.length)return {points:[{t:now,mid:0,lo:0,hi:0},{t:Math.max(now+HOUR,morning),mid:0,lo:0,hi:0}],thresholds:[],peak:null,now,morning,history:[],extrapolation:false,stopped:true};
 const ss=sessions(entries),latest=ss.at(-1),start=Math.floor(entries[0].t/MIN)*MIN,recordStart=Math.max(now-48*HOUR,Math.min(latest.start-30*MIN,now-30*MIN)),end=Math.max(now+3*HOUR,morning+HOUR,latest.end+6*HOUR),cap=Math.max(end,latest.end+14*24*HOUR),dt=dtMin/60,ms=dtMin*MIN;
 const models=lhs(n,9,seed).map(z=>parameters(ss[0].profile||profile,reference?Array(9).fill(0):z,dt,{reference}));
 let points=[],history=[],active=[],idx=0,vals=new Float64Array(n),peak={t:latest.start,mid:0},maxMass=0,stopped=false,lastSession=null,profileDeferred=false;
 let sampled=entries.map(d=>{let f=foodIndex(d.food),k=kindIndex(d),duration=[],dose=[],latestEnd=d.t;for(let i=0;i<n;i++){let r=rng((98765+Math.floor(d.t/1000)+i*104729+seed)|0);let dur=Math.max(.25,d.duration*(reference?1:clamp(logfactor(normal(r),.30),.35,2.5)))*MIN;duration.push(dur);dose.push(d.g*(reference?1:clamp(logfactor(normal(r),.06),.8,1.25)));latestEnd=Math.max(latestEnd,d.t+dur)}return {f,k,duration,dose,latestEnd}});
 const latestInputEnd=sampled.reduce((a,b)=>Math.max(a,b.latestEnd),start);
 const input=new Float64Array(12);
 function add(t,live,hist){let sorted=Array.from(vals).sort((a,b)=>a-b),p={t,lo:quant(sorted,.025),mid:quant(sorted,.5),hi:quant(sorted,.975)};if(live){points.push(p);if(t>=latest.start&&p.mid>peak.mid)peak=p}if(hist)history.push(p)}
 if(start>=recordStart||historyStart!==null&&start>=historyStart&&start<=now)add(start,start>=recordStart,historyStart!==null&&start>=historyStart&&start<=now);
 for(let t=start+ms;t<=cap;t+=ms){
  while(idx<entries.length&&entries[idx].t<t){let d=entries[idx],sid=sessionStart(d.t);if(sid!==lastSession){for(let i=0;i<n;i++){let m=models[i];m.occasion=reference?1:logfactor(normal(rng((Math.floor(sid/MIN)+i*7919+seed)|0)),.055)}lastSession=sid}for(const m of models)m.pendingWeight=(d.profile||profile).weight;active.push(idx++)}
  active=active.filter(j=>t-ms<sampled[j].latestEnd);maxMass=0;
  for(let i=0;i<n;i++){let m=models[i];if(m.pendingWeight!==m.weight){if(mass(m)<.001){m.weight=m.pendingWeight;m.vp=peripheral(m.weight)*m.vpFactor;exchangeCoeff(m,dt)}else profileDeferred=true}input.fill(0);for(let j of active){let d=entries[j],a=sampled[j],overlap=Math.max(0,Math.min(t,d.t+a.duration[i])-Math.max(t-ms,d.t));if(overlap>0){input[a.f*4+a.k]+=a.dose[i]*overlap/a.duration[i];m.foodLevel=FOOD[a.f]}}let c=step(m,input,dt);vals[i]=c;maxMass=Math.max(maxMass,mass(m));if(t>=latest.start){for(let k=0;k<3;k++){let lim=LIMITS[k];if(c>=lim)m.cross[k]={t:null,above:true};else if(m.prev>=lim)m.cross[k]={t:t-ms+(m.prev-lim)/(m.prev-c)*ms,above:false}}}m.prev=c}
  let hist=historyStart!==null&&t>=historyStart-ms&&t<=now+ms&&t%(5*MIN)===0;
  if(t>=recordStart||hist)add(t,t>=recordStart,hist);
  if(t>=end&&t>=latestInputEnd&&maxMass<.001){stopped=true;break}
  let firstRecord=historyStart===null?recordStart:Math.min(recordStart,historyStart-5*MIN);
  if(!active.length&&maxMass<1e-8&&t<firstRecord-2*HOUR){let jump=Math.floor(Math.min(idx<entries.length?entries[idx].t-30*MIN:firstRecord-ms,firstRecord-ms)/ms)*ms;if(jump>t+ms){for(const m of models)m.foodLevel*=Math.pow(m.foodDecay,(jump-ms-t)/ms);t=jump-ms}}
 }
 const thresholds=LIMITS.map((limit,k)=>{let times=models.map(m=>m.cross[k]?.above?Infinity:m.cross[k]?.t??-Infinity).sort((a,b)=>a-b);let q=p=>times[Math.floor((n-1)*p)];return {limit,lo:q(.025),mid:q(.5),hi:q(.975),notReached:times.filter(t=>t===-Infinity).length,unresolved:times.filter(t=>t===Infinity).length}});
 const recent=entries.filter(d=>d.t>=now-24*HOUR),dose24=recent.reduce((a,d)=>a+d.g,0),extrapolation=dose24>.68*profile.weight||(latest.end>=now-24*HOUR&&latest.drinks.reduce((a,d)=>a+d.g,0)>.68*(latest.profile||profile).weight)||recent.some(d=>{let p=d.profile||profile;return p.age<20||p.age>60||p.weight<47||p.weight>100||p.height<157||p.height>194})||(latest.end>=now-24*HOUR&&peak.mid>1.5);
 return {points,history,thresholds,peak,now,morning,latest,stopped,capReached:!stopped,extrapolation,profileDeferred,massError:Math.max(...models.map(m=>Math.abs(m.ingested-m.elim-mass(m))))};
}
root.PromilleModel={BUILD,MIN,HOUR,N,grams,volume,watsonVolume,parameters,step,simulate,sessions,sessionStart,at,rng,lhs};if(typeof module!=='undefined')module.exports=root.PromilleModel;
})(typeof self!=='undefined'?self:globalThis);
