const assert=require('node:assert/strict'),M=require('./model.js');
const p={sex:'m',age:41,weight:95,height:180},now=new Date('2026-11-27T23:00:00+01:00').getTime(),morning=now+8*M.HOUR;
const d=(t,g=19.725,food='normal')=>({t,g,duration:20,food,profile:p});
assert(Math.abs(M.grams(500,5)-19.725)<1e-8);assert(M.volume(p)>50&&M.volume(p)<70);
assert.equal(M.simulate([],p,now,morning).thresholds.length,0);
let entries=[d(now-90*M.MIN),d(now-50*M.MIN),d(now-10*M.MIN)];
let a=M.simulate(entries,p,now,morning),b=M.simulate(entries,p,now,morning);assert.deepEqual(a,b);assert(a.massError<1e-8);assert(a.points.every(x=>x.lo>=0&&x.lo<=x.mid&&x.mid<=x.hi));assert(a.peak.mid>0);assert(a.stopped);
let fine=M.simulate(entries,p,now,morning,{dtMin:.5});assert(Math.abs(a.peak.mid-fine.peak.mid)<.03);assert(Math.abs(a.thresholds[1].mid-fine.thresholds[1].mid)<15*M.MIN);
let fast=M.simulate([d(now,45,'empty')],p,now,morning),fed=M.simulate([d(now,45,'full')],p,now,morning);assert(fast.peak.mid>fed.peak.mid);assert(fast.peak.t<fed.peak.t);
let old=d(now-19*M.HOUR,150),recent=d(now,19.725);assert.equal(M.sessions([old,recent]).length,2);let carry=M.simulate([old,recent],p,now,morning),fresh=M.simulate([recent],p,now,morning);assert(M.at(carry.points,now).hi>M.at(fresh.points,now).hi);assert(carry.massError<1e-8);
let historical=M.simulate([d(now-30*24*M.HOUR)],p,now,morning);assert(historical.stopped);assert(M.at(historical.points,now).hi<.01);assert(historical.points.length<5000);
let ref={sex:'m',age:35,weight:75,height:175};for(let food of ['empty','full']){let t=now,rr=M.simulate([{...d(t,45,food),profile:ref}],ref,t,t+10*M.HOUR);let auc=0;for(let i=1;i<rr.points.length;i++){let a=rr.points[i-1],b=rr.points[i];if(a.t>=t&&b.t<=t+10*M.HOUR)auc+=(a.mid+b.mid)/2*(b.t-a.t)/M.HOUR*1.055}console.log('Reference plausibility (median-curve AUC, g h/L)',food,auc.toFixed(3),'peak',rr.peak.mid.toFixed(3));}
console.log('PASS: dosage, reproducibility, non-negativity, mass balance, timestep convergence, food, session carryover, archive horizon');console.log('Mass error g',a.massError,'peak change ‰',Math.abs(a.peak.mid-fine.peak.mid));
