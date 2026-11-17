'use client';
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from 'react';
import {request} from './api';
import {getGuestCart,setGuestItem,clearGuestCart} from './guest-cart';
import {getGuestFavorites,setGuestFavorite,clearGuestFavorites} from './guest-favorites';
type User={id:number;name:string;email:string;role:string};
type Line={product_id:number;quantity:number};
type Shop={user:User|null;loading:boolean;cartCount:number;favorites:number[];refresh:()=>Promise<void>;addToCart:(id:number,quantity:number)=>Promise<void>;toggleFavorite:(id:number)=>Promise<void>;isFavorite:(id:number)=>boolean;setCartQuantity:(id:number,quantity:number)=>Promise<void>};
const Context=createContext<Shop|null>(null);
export function ShopProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true),[cartCount,setCartCount]=useState(0),[favorites,setFavorites]=useState<number[]>([]);
 const refresh=useCallback(async()=>{
  let me:User|null=null;
  try{me=await request<User|null>('/auth/me');}catch{}
  setUser(me);
  if(me){
   try{
    const pending=getGuestCart();
    const guestFavorites=getGuestFavorites();
    if(pending.length){
     const existing=await request<Line[]>('/cart');
     for(const item of pending){const current=existing.find(x=>x.product_id===item.productId)?.quantity||0;await request('/cart/'+item.productId,{method:'PUT',body:JSON.stringify({quantity:Math.min(99,current+item.quantity)})});}
     clearGuestCart();
    }
    for(const id of guestFavorites)await request('/account/favorites/'+id,{method:'POST'});
    if(guestFavorites.length)clearGuestFavorites();
    const [cart,favs]=await Promise.all([request<Line[]>('/cart'),request<{id:number}[]>('/account/favorites')]);
    setCartCount(cart.reduce((s,x)=>s+x.quantity,0));setFavorites(favs.map(x=>x.id));
   }catch{setCartCount(0);setFavorites([]);}
  }else{
   setCartCount(getGuestCart().reduce((s,x)=>s+x.quantity,0));setFavorites(getGuestFavorites());
  }
  setLoading(false);
 },[]);
 useEffect(()=>{
  void refresh();
  const changed=()=>{if(!user){setCartCount(getGuestCart().reduce((s,x)=>s+x.quantity,0));setFavorites(getGuestFavorites());}};
  const storage=()=>{void refresh();};
  window.addEventListener('guest-cart-changed',changed);window.addEventListener('favorites-changed',changed);window.addEventListener('storage',storage);
  return ()=>{window.removeEventListener('guest-cart-changed',changed);window.removeEventListener('favorites-changed',changed);window.removeEventListener('storage',storage);};
 },[refresh]);
 const setCartQuantity=useCallback(async(id:number,quantity:number)=>{
  if(!Number.isSafeInteger(quantity)||quantity<0||quantity>99)throw Error('数量は0〜99で指定してください');
  if(user){const cart=await request<Line[]>('/cart/'+id,{method:'PUT',body:JSON.stringify({quantity})});setCartCount(cart.reduce((s,x)=>s+x.quantity,0));}
  else{setGuestItem(id,quantity);setCartCount(getGuestCart().reduce((s,x)=>s+x.quantity,0));}
 },[user]);
 const addToCart=useCallback(async(id:number,quantity:number)=>{
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>99)throw Error('数量は1〜99で指定してください');
  const current=user?(await request<Line[]>('/cart')).find(x=>x.product_id===id)?.quantity||0:getGuestCart().find(x=>x.productId===id)?.quantity||0;
  await setCartQuantity(id,Math.min(99,current+quantity));
 },[user,setCartQuantity]);
 const toggleFavorite=useCallback(async(id:number)=>{
  const enabled=!favorites.includes(id);
  if(user){await request('/account/favorites/'+id,{method:enabled?'POST':'DELETE'});setFavorites(old=>enabled?[...new Set([...old,id])]:old.filter(x=>x!==id));}
  else{setGuestFavorite(id,enabled);setFavorites(getGuestFavorites());}
 },[favorites,user]);
 return <Context.Provider value={{user,loading,cartCount,favorites,refresh,addToCart,toggleFavorite,isFavorite:(id)=>favorites.includes(id),setCartQuantity}}>{children}</Context.Provider>;
}
export function useShop(){const value=useContext(Context);if(!value)throw Error('ShopProviderが必要です');return value;}
