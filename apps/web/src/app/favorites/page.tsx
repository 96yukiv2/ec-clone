'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
export default function Favorites(){
 const [items,setItems]=useState<any[]>([]),[error,setError]=useState('');
 const load=()=>request<any[]>('/account/favorites').then(setItems).catch(e=>setError(e.message));
 useEffect(()=>{load();},[]);
 return <main className="container"><h1>お気に入り</h1>{error&&<p className="error">{error}</p>}<div className="grid">
 {items.map(p=><div className="card" key={p.id}><Link href={'/products/'+p.id}><div className="card-image">♡</div><h3>{p.name}</h3><p className="price">{yen(p.price)}</p></Link>
 <button className="button secondary" onClick={async()=>{await request('/account/favorites/'+p.id,{method:'DELETE'});load();}}>削除</button></div>)}</div></main>;
}
