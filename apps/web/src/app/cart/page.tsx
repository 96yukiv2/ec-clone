'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
import {getGuestCart,clearGuestCart} from '@/lib/guest-cart';
import {useShop} from '@/lib/shop-state';
type Item={product_id:number;name:string;price:number;quantity:number;stock:number};
type Address={id:number;postal_code:string;region:string;city:string;line1:string};
export default function Cart(){
 const {user,loading,setCartQuantity,refresh}=useShop();
 const [items,setItems]=useState<Item[]>([]),[busy,setBusy]=useState(true),[msg,setMsg]=useState(''),[coupon,setCoupon]=useState(''),[email,setEmail]=useState(''),[addresses,setAddresses]=useState<Address[]>([]),[addressId,setAddressId]=useState('');
 async function reload(){
  setBusy(true);
  try{
   if(user){setItems(await request<Item[]>('/cart'));setAddresses(await request<Address[]>('/account/addresses'));}
   else{const result=await Promise.all(getGuestCart().map(async item=>{try{const p=await request<Item>('/products/'+item.productId);return {product_id:item.productId,name:p.name,price:p.price,quantity:item.quantity,stock:p.stock};}catch{return null;}}));setItems(result.filter((x):x is Item=>x!==null));}
   setMsg('');
  }catch{setMsg('カート情報を取得できませんでした。');}
  finally{setBusy(false);}
 }
 useEffect(()=>{if(!loading)void reload();},[loading,user]);
 async function change(item:Item,quantity:number){try{await setCartQuantity(item.product_id,quantity);await reload();}catch(e){setMsg(e instanceof Error?e.message:'変更できませんでした');}}
 async function order(){
  setBusy(true);
  try{
   const idempotencyKey=crypto.randomUUID();
   if(!user){
    if(!/^\S+@\S+\.\S+$/.test(email)){setMsg('ゲスト購入には有効なメールアドレスが必要です');return;}
    await request('/guest/checkout',{method:'POST',body:JSON.stringify({email,items:getGuestCart(),idempotencyKey,couponCode:coupon})});
    clearGuestCart();await refresh();window.location.href='/orders';return;
   }
   await request('/orders',{method:'POST',body:JSON.stringify({idempotencyKey,couponCode:coupon,addressId:addressId?Number(addressId):undefined})});
   await refresh();window.location.href='/orders';
  }catch(e){setMsg(e instanceof Error?e.message:'注文に失敗しました');}finally{setBusy(false);}
 }
 const total=items.reduce((s,item)=>s+item.price*item.quantity,0);
 return <main className="container"><h1>ショッピングカート</h1><div className="panel">
 {!loading&&!user&&<p className="muted">ゲストとして購入できます。カートはこのブラウザに保存されます。</p>}
 {busy||loading?<p>読み込み中…</p>:items.length===0?<p>カートは空です。<Link href="/">商品を探す</Link></p>:items.map(item=><div className="row" key={item.product_id} style={{marginBottom:20}}>
 <Link href={'/products/'+item.product_id}>{item.name}</Link><span className="spacer"/><span>{yen(item.price)}</span>
 <input type="number" min={0} max={99} value={item.quantity} aria-label={item.name+'の数量'} onChange={e=>change(item,Number(e.target.value))} style={{width:65,padding:8}}/>
 <button className="button secondary" onClick={()=>change(item,0)}>削除</button></div>)}
 <p>商品小計：<strong>{yen(total)}</strong>（送料・割引は注文時に計算）</p>
 {!user&&<input type="email" placeholder="ゲスト購入用メールアドレス" value={email} onChange={e=>setEmail(e.target.value)} style={{padding:10}}/>}
 {user&&<select value={addressId} onChange={e=>setAddressId(e.target.value)}><option value="">配送先未指定</option>{addresses.map(a=><option value={a.id} key={a.id}>〒{a.postal_code} {a.region}{a.city}{a.line1}</option>)}</select>}
 <input placeholder="クーポンコード（WELCOME10）" value={coupon} onChange={e=>setCoupon(e.target.value)} style={{padding:10}}/>
 <button className="button" disabled={!items.length||busy||loading} onClick={order}>注文を作成</button>
 {msg&&<p className="error" role="alert">{msg}</p>}</div></main>;
}
