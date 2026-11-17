'use client';
import Link from 'next/link';
import {useState} from 'react';
import {yen,API} from '@/lib/api';
import {useShop} from '@/lib/shop-state';
export type CatalogProduct={id:number;name:string;price:number;stock:number;category?:string;rating?:number;image?:string};
export default function ProductCard({product:p}:{product:CatalogProduct}){
 const [busy,setBusy]=useState(false),[msg,setMsg]=useState('');
 const {addToCart,toggleFavorite,isFavorite}=useShop();
 const src=p.image?.startsWith('/uploads/')?API+p.image:p.image;
 async function act(fn:()=>Promise<void>,success:string){setBusy(true);try{await fn();setMsg(success);}catch(e){setMsg(e instanceof Error?e.message:'操作に失敗しました');}finally{setBusy(false);}}
 return <article className="card">
 <Link href={'/products/'+p.id} className="product-card-link"><div className="card-image">{src?<img src={src} alt={p.name} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>:'📦'}</div><div className="muted">{p.category||'商品'}</div><h3>{p.name}</h3><div className="price">{yen(p.price)}</div><p className="muted">★ {Number(p.rating||0).toFixed(1)} · {p.stock>0?'在庫 '+p.stock:'在庫切れ'}</p></Link>
 <div className="row"><button className="button" disabled={busy||p.stock<=0} onClick={()=>act(()=>addToCart(p.id,1),'カートに追加しました')}>カートに追加</button><button className="button secondary" disabled={busy} aria-label={p.name+'のお気に入り操作'} aria-pressed={isFavorite(p.id)} onClick={()=>act(()=>toggleFavorite(p.id),'お気に入りを更新しました')}>{isFavorite(p.id)?'♥':'♡'}</button></div>
 {msg&&<small role="status" className="muted">{msg}</small>}</article>;
}
