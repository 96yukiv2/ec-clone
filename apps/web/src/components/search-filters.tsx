'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request} from '@/lib/api';
export default function SearchFilters({initial}:{initial:Record<string,string|undefined>}){
 const [q,setQ]=useState(initial.search||''),[suggest,setSuggest]=useState<{id:number;name:string}[]>([]);
 useEffect(()=>{
  if(q.trim().length<2){setSuggest([]);return;}
  const timeout=setTimeout(()=>request<{id:number;name:string}[]>('/products/suggest?q='+encodeURIComponent(q)).then(setSuggest).catch(()=>{}),250);
  return ()=>clearTimeout(timeout);
 },[q]);
 return <form className="panel" action="/" style={{display:'grid',gap:12}}>
  <div style={{position:'relative'}}><input name="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="商品名・キーワード" autoComplete="off" style={{padding:12,width:'100%'}}/>
  {suggest.length>0&&<div className="panel" style={{position:'absolute',zIndex:10,top:'100%',width:'100%',padding:8,boxShadow:'0 6px 15px #0002'}}>
   {suggest.map(s=><Link key={s.id} href={'/products/'+s.id} style={{display:'block',padding:9}}>{s.name}</Link>)}</div>}</div>
  <div className="row">
   <select name="category" defaultValue={initial.category||''}><option value="">すべてのカテゴリ</option>{['electronics','books','home','fashion','outdoor'].map(c=><option key={c} value={c}>{c}</option>)}</select>
   <input name="minPrice" type="number" min={0} placeholder="最低価格" defaultValue={initial.minPrice} style={{width:105}}/>
   <input name="maxPrice" type="number" min={0} placeholder="最高価格" defaultValue={initial.maxPrice} style={{width:105}}/>
   <select name="minRating" defaultValue={initial.minRating||''}><option value="">評価すべて</option>{[4,3,2,1].map(x=><option key={x} value={x}>★{x}以上</option>)}</select>
   <label><input type="checkbox" name="inStock" value="true" defaultChecked={initial.inStock==='true'}/> 在庫あり</label>
   <select name="sort" defaultValue={initial.sort||'newest'}><option value="newest">新着順</option><option value="price_asc">安い順</option><option value="price_desc">高い順</option><option value="rating">評価順</option><option value="popular">人気順</option></select>
   <button className="button">検索・絞り込み</button>
  </div>
 </form>;
}
