(function(){
const store=new Map(Object.entries(window.__DB__));const subs=new Set();
const notify=()=>setTimeout(()=>subs.forEach(f=>f()),0);
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
function docRef(path){const id=path.split("/").pop();return{id,path,
  get:async()=>({id,exists:store.has(path),data:()=>clone(store.get(path))}),
  set:async d=>{store.set(path,clone(d));window.__W__=(window.__W__||0)+1;notify()},
  update:async d=>{if(!store.has(path))throw{code:"not_found"};store.set(path,{...store.get(path),...clone(d)});window.__W__=(window.__W__||0)+1;notify()},
  delete:async()=>{store.delete(path);window.__W__=(window.__W__||0)+1;notify()},
  onSnapshot(cb){const f=()=>cb({id,exists:store.has(path),data:()=>clone(store.get(path))});subs.add(f);f();return()=>subs.delete(f)}}}
function colRef(path){const depth=path.split("/").length+1;
  const snap=()=>({docs:[...store.keys()].filter(k=>k.startsWith(path+"/")&&k.split("/").length===depth).map(k=>({id:k.split("/").pop(),data:()=>clone(store.get(k))}))});
  return{doc:id=>docRef(path+"/"+(id||Math.random().toString(36).slice(2,12))),get:async()=>snap(),onSnapshot(cb){const f=()=>cb(snap());subs.add(f);f();return()=>subs.delete(f)}}}
const db={doc:docRef,collection:colRef};
const mcp={callTool:async(server,tool,input)=>{window.__MCP__={server,tool,input};return{content:[{type:"text",text:JSON.stringify({id:input.fileId,content:"(file sent separately)"})},{type:"resource",resource:{uri:"googledrive://file/x",mimeType:input.exportMimeType,blob:window.__B64__}}]}}};
const perms={state:async()=>"prompt"};
window.claude={use:async n=>n==="db"?db:n==="mcp"?mcp:n==="permissions"?perms:n==="assets"?null:null};
window.__store=store;
})();
