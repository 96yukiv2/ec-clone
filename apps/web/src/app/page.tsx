import Link from 'next/link';
import {yen} from '@/lib/api';
type Product={id:number;name:string;price:number;stock:number;category:string;rating:number};
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams,params=new URLSearchParams();
 for(const k of ['search','category','minPrice','maxPrice','sort','page'])if(q[k])params.set(k,q[k]!);
 let items:Product[]=[],total=0,error='';
 try{
  const res=await fetch((process.env.API_INTERNAL_URL||'http://localhost:4000')+'/products?'+params,{cache:'no-store'});
  if(!res.ok)throw new Error('API unavailable');
  const data=await res.json();items=data.items;total=data.total;
 }catch{error='APIに接続できません。Docker Composeの起動状況を確認してください。';}
 return <main className="container"><section className="hero"><h1>好きなものを、見つけよう。</h1><p>ECアーキテクチャを体験するローカルショップ</p></section>
 <form className="row panel"><input name="search" defaultValue={q.search||''} placeholder="商品名" style={{padding:10,flex:2}}/>
 <select name="category" defaultValue={q.category||''}><option value="">すべてのカテゴリ</option>{['electronics','books','home','fashion','outdoor'].map(c=><option key={c} value={c}>{c}</option>)}</select>
 <select name="sort" defaultValue={q.sort||'newest'}><option value="newest">新着順</option><option value="price_asc">安い順</option><option value="price_desc">高い順</option><option value="rating">評価順</option><option value="popular">人気順</option></select>
 <button className="button">絞り込む</button></form>
 <h2>商品一覧 <small className="muted">{total}件</small></h2>{error&&<p className="error">{error}</p>}
 <div className="grid">{items.map(p=><Link className="card" href={'/products/'+p.id} key={p.id}>
 <div className="card-image">📦</div><div className="muted">{p.category}</div><h3>{p.name}</h3><div className="price">{yen(p.price)}</div>
 <p className="muted">★ {Number(p.rating).toFixed(1)} · {p.stock>0?'在庫 '+p.stock:'在庫切れ'}</p></Link>)}</div>
 <div className="row" style={{justifyContent:'center',margin:30}}>
 {Number(q.page||1)>1&&<Link className="button secondary" href={'/?'+new URLSearchParams({...q,page:String(Number(q.page||1)-1)}).toString()}>前へ</Link>}
 {items.length===12&&<Link className="button secondary" href={'/?'+new URLSearchParams({...q,page:String(Number(q.page||1)+1)}).toString()}>次へ</Link>}</div></main>;
}
