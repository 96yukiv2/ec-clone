'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
import {getGuestCart,setGuestItem,clearGuestCart} from '@/lib/guest-cart';
type Item={product_id:number;name:string;price:number;quantity:number;stock:number};
type Address={id:number;postal_code:string;region:string;city:string;line1:string};
export default function Cart(){
 const [items,setItems]=useState<Item[]>([]),[guest,setGuest]=useState(false),[msg,setMsg]=useState(''),[coupon,setCoupon]=useState(''),[email,setEmail]=useState(''),[addresses,setAddresses]=useState<Address[]>([]),[addressId,setAddressId]=useState('');
 async function refresh(){
  try{
   const me=await request('/auth/me');
   if(me){setGuest(false);setItems(await request('/cart'));setAddresses(await request('/account/addresses'));return;}
   setGuest(true);
   const stored=getGuestCart();
   const list:Item[]=[];
   for(const item of stored){try{const p=await request<any>('/products/'+item.productId);list.push({product_id:p.id,name:p.name,price:p.price,stock:p.stock,quantity:item.quantity});}catch{}}
   setItems(list);
  }catch(e:any){setMsg(e.message);}
 }
 useEffect(()=>{refresh();},[]);
 async function change(item:Item,quantity:number){
  if(!Number.isSafeInteger(quantity)||quantity<0||quantity>99){setMsg('数量は0〜99で指定してください');return;}
  if(guest){setGuestItem(item.product_id,quantity);refresh();return;}
  try{setItems(await request('/cart/'+item.product_id,{method:'PUT',body:JSON.stringify({quantity})}));}catch(e:any){setMsg(e.message);}
 }
 async function order(){try{
  const key=crypto.randomUUID();
  if(guest){
   if(!email.includes('@')){setMsg('ゲスト購入にはメールアドレスが必要です');return;}
   await request('/guest/checkout',{method:'POST',body:JSON.stringify({email,items:getGuestCart(),idempotencyKey:key,couponCode:coupon})});
   clearGuestCart();location.href='/orders?guest=1';return;
  }
  const result=await request<{id:number}>('/orders',{method:'POST',body:JSON.stringify({idempotencyKey:key,couponCode:coupon,addressId:addressId?Number(addressId):null})});
  location.href='/orders?new='+result.id;
 }catch(e:any){setMsg(e.message);}}
 const total=items.reduce((n,i)=>n+i.price*i.quantity,0);
 return <main className="container"><h1>ショッピングカート</h1><div className="panel">
 {guest&&<p className="muted">ゲストとして購入できます。会員登録すると購入履歴を管理できます。</p>}
 {items.map(i=><div className="row" key={i.product_id} style={{marginBottom:20}}><Link href={'/products/'+i.product_id}>{i.name}</Link><span className="spacer"/><span>{yen(i.price)}</span>
 <input type="number" min="0" max="99" value={i.quantity} onChange={e=>change(i,Number(e.target.value))} style={{width:65,padding:8}}/><button className="button secondary" onClick={()=>change(i,0)}>削除</button></div>)}
 <p>商品小計: <strong>{yen(total)}</strong>（送料・クーポンは注文時に計算）</p>
 {guest?<input type="email" placeholder="ゲスト購入用メールアドレス" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10}}/>:
 <select value={addressId} onChange={e=>setAddressId(e.target.value)}><option value="">配送先未指定</option>{addresses.map(a=><option value={a.id} key={a.id}>〒{a.postal_code} {a.region}{a.city}{a.line1}</option>)}</select>}
 <input placeholder="クーポンコード (WELCOME10)" value={coupon} onChange={e=>setCoupon(e.target.value)} style={{padding:10}}/>
 <button className="button" disabled={!items.length} onClick={order}>注文を作成</button>{msg&&<p className="error">{msg}</p>}</div></main>;
}
