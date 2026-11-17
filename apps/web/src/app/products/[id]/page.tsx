import Link from 'next/link';
import {yen} from '@/lib/api';
import ProductActions from './product-actions';
import Reviews from './reviews';
export default async function Product({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 let p:any=null,related:any[]=[];
 const host=process.env.API_INTERNAL_URL||'http://localhost:4000';
 try{
  const [a,b]=await Promise.all([fetch(host+'/products/'+id,{cache:'no-store'}),fetch(host+'/products/'+id+'/related',{cache:'no-store'})]);
  if(a.ok)p=await a.json();if(b.ok)related=await b.json();
 }catch{}
 if(!p)return <main className="container">商品が見つかりません。</main>;
 return <main className="container"><div className="panel" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:32}}>
 <div className="card-image" style={{height:350,fontSize:110}}>📦</div><div><div className="muted">{p.category}</div><h1>{p.name}</h1><p>{p.description}</p>
 <p className="price">{yen(p.price)}</p><p>在庫: {p.stock}</p><ProductActions id={p.id} stock={p.stock}/></div></div>
 <Reviews id={p.id}/><section className="panel"><h2>関連商品</h2><div className="grid">{related.map(x=><Link key={x.id} className="card" href={'/products/'+x.id}><div className="card-image">📦</div><h3>{x.name}</h3><p className="price">{yen(x.price)}</p></Link>)}</div></section>
 </main>;
}
