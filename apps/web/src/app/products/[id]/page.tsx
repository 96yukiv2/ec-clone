import Link from 'next/link';
import {yen,API} from '@/lib/api';
import ProductActions from './product-actions';
import Reviews from './reviews';
import ProductCarousel from '@/components/product-carousel';
export default async function Product({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 let p:any=null,related:any[]=[],variants:any[]=[];
 const host=process.env.API_INTERNAL_URL||'http://localhost:4000';
 try{
  const [a,b,c]=await Promise.all([fetch(host+'/products/'+id,{cache:'no-store'}),fetch(host+'/products/'+id+'/related',{cache:'no-store'}),fetch(host+'/discovery/variants/'+id,{cache:'no-store'})]);
  if(a.ok)p=await a.json();if(b.ok)related=await b.json();if(c.ok)variants=await c.json();
 }catch{}
 if(!p)return <main className="container">商品が見つかりません。</main>;
 const src=p.image?.startsWith('/uploads/')?API+p.image:p.image;
 return <main className="container"><div className="panel" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:32}}>
 <div className="card-image" style={{height:350,fontSize:110}}>{src?<img src={src} alt={p.name} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>:'📦'}</div>
 <div><div className="muted">{p.category}</div><h1>{p.name}</h1><p>{p.description}</p>
 <p className="price">{yen(p.price)}</p><p>在庫: {p.stock}</p><ProductActions id={p.id} stock={p.stock}/>
 {variants.length>0&&<div><h3>バリエーション</h3><div className="row">{variants.map(v=><Link className="button secondary" href={'/products/'+v.id} key={v.id}>{v.variant_label||v.sku} · {yen(v.price)}</Link>)}</div></div>}
 </div></div>
 <Reviews id={p.id}/><section className="panel"><h2>関連商品</h2><div className="grid">{related.map(x=><Link key={x.id} className="card" href={'/products/'+x.id}><div className="card-image">📦</div><h3>{x.name}</h3><p className="price">{yen(x.price)}</p></Link>)}</div></section>
 <ProductCarousel endpoint="/discovery/recommendations" title="おすすめ商品"/></main>;
}
