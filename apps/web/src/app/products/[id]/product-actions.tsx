'use client';
import {useState} from 'react';
import {useShop} from '@/lib/shop-state';
export default function ProductActions({id,stock}:{id:number;stock:number}){
 const [quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const {addToCart,toggleFavorite,isFavorite,user}=useShop();
 async function act(fn:()=>Promise<void>,success:string){setBusy(true);try{await fn();setMsg(success);}catch(e){setMsg(e instanceof Error?e.message:'操作に失敗しました');}finally{setBusy(false);}}
 return <div className="row"><input type="number" min="1" max={Math.max(1,stock)} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} style={{width:75,padding:10}}/>
 <button className="button" disabled={busy||stock<=0} onClick={()=>act(()=>addToCart(id,quantity),'カートに追加しました')}>カートに追加</button>
 <button className="button secondary" disabled={busy} onClick={()=>act(()=>toggleFavorite(id),'お気に入りを更新しました')}>{isFavorite(id)?'♥ お気に入り済み':'♡ お気に入り'}</button>
 {msg&&<span role="status">{msg}</span>}{!user&&<small className="muted">ゲストのお気に入りとカートはブラウザに保存します</small>}</div>;
}
