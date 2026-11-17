'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
import {getGuestFavorites} from '@/lib/guest-favorites';
import {useShop} from '@/lib/shop-state';
type Product={id:number;name:string;price:number;stock:number};
export default function Favorites(){
 const {user,loading,toggleFavorite,refresh}=useShop();
 const [items,setItems]=useState<Product[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 useEffect(()=>{
  if(loading)return;
  let alive=true;
  const load=async()=>{
   setBusy(true);setError('');
   try{
    let products:Product[];
    if(user)products=await request<Product[]>('/account/favorites');
    else{
     const ids=getGuestFavorites();
     const found=await Promise.all(ids.map(id=>request<Product>('/products/'+id).catch(()=>null)));
     products=found.filter((p):p is Product=>p!==null);
    }
    if(alive)setItems(products);
   }catch{if(alive)setError('お気に入りを読み込めませんでした。再読み込みしてください。');}
   finally{if(alive)setBusy(false);}
  };
  void load();
  return ()=>{alive=false;};
 },[user,loading]);
 async function remove(id:number){
  try{await toggleFavorite(id);setItems(current=>current.filter(item=>item.id!==id));}
  catch{setError('お気に入りの解除に失敗しました。');}
 }
 return <main className="container"><h1>お気に入り</h1>
 {!loading&&!user&&<div className="panel"><p>ゲストのお気に入りを表示しています。データはこのブラウザに保存されます。</p><Link href="/account">ログイン・会員登録はこちら</Link></div>}
 {error&&<p className="error" role="alert">{error}</p>}
 {busy||loading?<p>読み込み中…</p>:items.length===0?<div className="panel"><p>お気に入りの商品はまだありません。</p><Link className="button secondary" href="/">商品を探す</Link></div>:
 <div className="grid">{items.map(p=><article className="card" key={p.id}><Link href={'/products/'+p.id}><div className="card-image">♡</div><h3>{p.name}</h3><p className="price">{yen(p.price)}</p></Link>
 <button className="button secondary" onClick={()=>remove(p.id)}>お気に入りから削除</button></article>)}</div>}
 </main>;
}
