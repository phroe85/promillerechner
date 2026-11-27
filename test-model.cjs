const assert=require('node:assert/strict'),M=require('./model.js');
const p={sex:'m',age:41,weight:95,height:180},t=new Date('2026-11-27T20:00:00+01:00').getTime(),H=M.HOUR,MIN=M.MIN;
const d=(t,g=19.725,food='normal',kind='beer',duration=20,profile=p)=>({t,g,food,kind,duration,profile});
const run=(ds,opts={},now=t,morning=t+11*H)=>M.simulate(ds,p,now,morning,opts);
const auc=(r,t0,h)=>{let a=0;for(let i=1;i<r.points.length;i++){let x=r.points[i-1],y=r.points[i];if(x.t>=t0&&y.t<=t0+h*H)a+=(x.mid+y.mid)/2*(y.t-x.t)/H*1.055}return a};
assert(Math.abs(M.grams(500,5)-19.725)<1e-9);assert(Math.abs(M.grams(20,40)-6.312)<1e-9);assert(Math.abs(M.grams(40,40)-12.624)<1e-9);
const entries=[d(t-90*MIN),d(t-50*MIN,9.8625,'normal','wine'),d(t-10*MIN,12.624,'full','shot2',2)];
let a=run(entries),b=run(entries);assert.deepEqual(a,b);assert(a.massError<1e-8);assert(a.points.every(x=>x.lo>=0&&x.lo<=x.mid&&x.mid<=x.hi));assert(a.stopped);let fine=run(entries,{dtMin:.5});let error=Math.max(...a.points.map(x=>Math.abs(M.at(fine.points,x.t).mid-x.mid)));assert(error<.02);
const ref={sex:'m',age:35,height:175,weight:75};
let report={numerical:{massError:a.massError,maxStepDifference:error},literature:[],drinks:[]};
for(let food of ['empty','full']){const target=food==='empty'?3.83:2.34,ds=[d(t,45,food,'other',20,ref)];let typical=run(ds,{n:1,reference:true},t,t+10*H),live=run(ds,{},t,t+10*H);let val=auc(typical,t,10);assert(Math.abs(val/target-1)<.035);report.literature.push({food,target,reference:val,app:auc(live,t,10)});}
const mit={sex:'m',age:37.8,height:177,weight:82.66};for(let [kind,peak,tmax] of [['beer',.503,62],['wine',.617,54],['shot2',.774,36]]){let ds=[d(t,.5*mit.weight,'empty',kind,20,mit)];let r=run(ds);report.drinks.push({kind,targetPeak:peak,targetTmax:tmax,appPeak:r.peak.mid*1.055,appTmax:(r.peak.t-t)/MIN});}
let m=M.parameters(p,Array(9).fill(0),1/60);m.foodLevel=1;for(let i=0;i<180;i++)M.step(m,new Float64Array(12),1/60);assert(Math.abs(m.foodLevel-.5)<1e-10);
let old=d(t-16*H,150,'empty','other'),recent=d(t,19.725,'empty','beer',20,{...p,weight:100});assert.equal(M.sessions([old,recent]).length,2);let carry=run([old,recent]),fresh=run([recent]);assert(carry.profileDeferred);assert(M.at(carry.points,t).hi>M.at(fresh.points,t).hi);assert(carry.massError<1e-8);
let hist=run([d(t-30*24*H)],{historyStart:t-7*24*H});assert(hist.stopped);assert(M.at(hist.points,t).hi<.01);assert(hist.history.every((q,i)=>i===0||q.t>hist.history[i-1].t));assert(run([d(t,100)]).extrapolation);assert.equal(run([]).thresholds.length,0);
console.log(JSON.stringify(report,null,2));console.log('PASS: dose, reproducibility, mass, non-negativity, convergence, published typical AUC, food decay, profile deferral, carryover, archive, extrapolation');
