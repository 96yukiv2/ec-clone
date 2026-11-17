'use client';
import {useState} from 'react';
import {request} from '@/lib/api';
export default function ProductActions({id,stock}:{id:number;stock:number}){
 const [quantity,setQuantity]=useState(1),[msg,setMsg]=useState('');
 return <div className="row"><input type="number" min={1} max={Math.max(1,stock)} value={quantity} style={{width:75,padding:10}} onChange={e=>setQuantity(Number(e.target.value))}/>
 <button className="button" disabled={stock<=0} onClick={async()=>{try{await request('/cart/'+id,{method:'PUT',body:JSON.stringify({quantity})});setMsg('カートに追加しました');}catch(e:any){setMsg(e.message+' · ログインが必要です');}}}>カートに追加</button>
 <button className="button secondary" onClick={async()=>{try{await request('/account/favorites/'+id,{method:'POST'});setMsg('お気に入りに登録しました');}catch(e:any){setMsg(e.message);}}}>♡ お気に入り</button><span>{msg}</span></div>;
}
