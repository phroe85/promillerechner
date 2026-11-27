// PROMILLE_WORKER_BUILD=25
importScripts('model.js?v=25');onmessage=e=>{let {id,args}=e.data;try{if(PromilleModel.BUILD!==25)throw Error('Release mismatch');postMessage({id,result:PromilleModel.simulate(...args)})}catch(e){postMessage({id,error:String(e)})}};
