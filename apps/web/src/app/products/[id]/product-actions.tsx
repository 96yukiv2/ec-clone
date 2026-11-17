'use client';
import {useState} from 'react';
import {request} from '@/lib/api';
import {getGuestCart,setGuestItem} from '@/lib/guest-cart';
export default function ProductActions({id,stock}:{id:number;stock:number}){
 const [quantity,setQuantity]=useState(1),[msg,setMsg]=useState('');
 return <div className="row"><input type="number" min={1} max={Math.max(1,stock)} value={quantity} style={{width:75,padding:10}} onChange={e=>setQuantity(Number(e.target.value))}/>
 <button className="button" disabled={stock<=0} onClick={async()=>{
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>99){setMsg('数量が不正です');return;}
  try{const session=await request('/auth/me');if(session){await request('/cart/'+id,{method:'PUT',body:JSON.stringify({quantity})});setMsg('カートに追加しました');return;}}
  catch{}
  setGuestItem(id,Math.min(99,(getGuestCart().find(i=>i.productId===id)?.quantity||0)+quantity));setMsg('ゲストカートに追加しました');
 }}>カートに追加</button>
 <button className="button secondary" onClick={async()=>{try{await request('/account/favorites/'+id,{method:'POST'});setMsg('お気に入りに登録しました');}catch{setMsg('お気に入り登録にはログインが必要です');}}}>♡ お気に入り</button><span>{msg}</span></div>;
}
