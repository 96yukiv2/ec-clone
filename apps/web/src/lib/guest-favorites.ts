const KEY='ec-clone-guest-favorites';
export function getGuestFavorites():number[]{if(typeof window==='undefined')return [];try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter((n:unknown)=>Number.isSafeInteger(n)&&Number(n)>0):[];}catch{return [];}}
export function setGuestFavorite(id:number,enabled:boolean){const set=new Set(getGuestFavorites());if(enabled)set.add(id);else set.delete(id);localStorage.setItem(KEY,JSON.stringify([...set]));window.dispatchEvent(new Event('favorites-changed'));}
export function clearGuestFavorites(){localStorage.removeItem(KEY);window.dispatchEvent(new Event('favorites-changed'));}
