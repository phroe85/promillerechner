importScripts('model.js?v=24');onmessage=e=>{let {id,args}=e.data;try{postMessage({id,result:PromilleModel.simulate(...args)})}catch(e){postMessage({id,error:String(e)})}};
