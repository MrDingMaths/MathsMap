// Cache failures are misses; authoring never depends on browser storage.
export function boundedCache(limit=2000){
  const values=new Map();
  return {get(key){const value=values.get(key);if(value!==undefined){values.delete(key);values.set(key,value);}return value;},
    set(key,value){values.delete(key);values.set(key,value);while(values.size>limit)values.delete(values.keys().next().value);},clear(){values.clear();}};
}

export function createMeasurementStore({indexedDB=globalThis.indexedDB,limit=10000,timeoutMs=1000}={}){
  const memory=boundedCache(limit);let database;
  const safe=work=>new Promise(resolve=>{let done=false;const finish=value=>{if(!done){done=true;clearTimeout(timer);resolve(value);}};const timer=setTimeout(()=>finish(null),timeoutMs);try{work(finish);}catch{finish(null);}});
  const open=()=>database??=safe(finish=>{
    if(!indexedDB)return finish(null);
    const request=indexedDB.open('mathsmap-booklet-measurements',1);
    request.onupgradeneeded=()=>{const store=request.result.createObjectStore('dimensions',{keyPath:'key'});store.createIndex('ts','ts');};
    request.onsuccess=()=>{request.result.onversionchange=()=>{request.result.close();database=null;};finish(request.result);};
    request.onerror=request.onblocked=()=>finish(null);
  });
  const valid=value=>Number.isFinite(value?.height)&&value.height>=0&&Number.isFinite(value?.capacity)&&value.capacity>0;
  return {
    async get(key){
      const cached=memory.get(key);if(cached)return cached;
      const db=await open();if(!db)return null;
      const row=await safe(finish=>{const req=db.transaction('dimensions').objectStore('dimensions').get(key);req.onsuccess=()=>finish(req.result);req.onerror=()=>finish(null);});
      if(!valid(row))return null;const value={height:row.height,capacity:row.capacity};memory.set(key,value);return value;
    },
    async set(key,value){
      if(!valid(value))return;
      const dimensions={height:value.height,capacity:value.capacity};memory.set(key,dimensions);
      const db=await open();if(!db)return;
      await safe(finish=>{const tx=db.transaction('dimensions','readwrite'),store=tx.objectStore('dimensions');store.put({key,...dimensions,ts:Date.now()});
        const count=store.count();count.onsuccess=()=>{let excess=count.result-limit;if(excess<=0)return;const cursor=store.index('ts').openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(item&&excess-->0){item.delete();item.continue();}};};
        tx.oncomplete=()=>finish(true);tx.onerror=tx.onabort=()=>finish(null);
      });
    },
  };
}
