export type GuestItem={productId:number;quantity:number};
const KEY='ec-clone-guest-cart';
export function getGuestCart():GuestItem[]{
 if(typeof window==='undefined')return [];
 try{
  const items=JSON.parse(localStorage.getItem(KEY)||'[]');
  return Array.isArray(items)?items.filter((i:any)=>Number.isSafeInteger(i.productId)&&Number.isSafeInteger(i.quantity)&&i.quantity>0):[];
 }catch{return [];}
}
export function setGuestItem(id:number,quantity:number){
 const items=getGuestCart().filter(i=>i.productId!==id);
 if(quantity>0)items.push({productId:id,quantity});
 localStorage.setItem(KEY,JSON.stringify(items));
 window.dispatchEvent(new Event('guest-cart-changed'));
}
export function clearGuestCart(){localStorage.removeItem(KEY);window.dispatchEvent(new Event('guest-cart-changed'));}
