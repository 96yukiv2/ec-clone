'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
type Item={product_id:number;name:string;price:number;quantity:number;stock:number};
export default function Cart(){
 const [items,setItems]=useState<Item[]>([]),[msg,setMsg]=useState(''),[coupon,setCoupon]=useState('');
 const refresh=()=>request<Item[]>('/cart').then(setItems).catch(e=>setMsg(e.message+' · アカウントからログインしてください'));
 useEffect(()=>{refresh();},[]);
 async function change(item:Item,quantity:number){try{setItems(await request('/cart/'+item.product_id,{method:'PUT',body:JSON.stringify({quantity})}));}catch(e:any){setMsg(e.message);}}
 async function order(){try{
  const key=crypto.randomUUID();
  const result=await request<{id:number}>('/orders',{method:'POST',body:JSON.stringify({idempotencyKey:key,couponCode:coupon})});
  location.href='/orders?new='+result.id;
 }catch(e:any){setMsg(e.message);}}
 const total=items.reduce((n,i)=>n+i.price*i.quantity,0);
 return <main className="container"><h1>ショッピングカート</h1><div className="panel">
 {items.map(i=><div className="row" key={i.product_id} style={{marginBottom:20}}><Link href={'/products/'+i.product_id}>{i.name}</Link><span className="spacer"/><span>{yen(i.price)}</span>
 <input type="number" min="0" max="99" value={i.quantity} onChange={e=>change(i,Number(e.target.value))} style={{width:65,padding:8}}/><button className="button secondary" onClick={()=>change(i,0)}>削除</button></div>)}
 <p>商品小計: <strong>{yen(total)}</strong>（送料・クーポンは注文時に計算）</p>
 <input placeholder="クーポンコード (WELCOME10)" value={coupon} onChange={e=>setCoupon(e.target.value)} style={{padding:10}}/>
 <button className="button" disabled={!items.length} onClick={order}>注文を作成</button>{msg&&<p className="error">{msg}</p>}</div></main>;
}
