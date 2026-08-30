import { useEffect, useState, type ReactNode } from 'react';
import { NetworkContext } from './networkContextValue';
export function NetworkProvider({children}:{children:ReactNode}){
  const [isOnline,setOnline]=useState(()=>typeof navigator==='undefined'||navigator.onLine);
  useEffect(()=>{
    let active=true;
    const probe=async()=>{try{const response=await fetch(`/network-check.txt?ts=${Date.now()}`,{method:'HEAD',cache:'no-store'});if(active)setOnline(response.ok);}catch{if(active)setOnline(false);}};
    const online=()=>void probe();const offline=()=>setOnline(false);
    void probe();window.addEventListener('online',online);window.addEventListener('offline',offline);
    return()=>{active=false;window.removeEventListener('online',online);window.removeEventListener('offline',offline)};
  },[]);
  return <NetworkContext.Provider value={{isOnline}}>{children}</NetworkContext.Provider>;
}
