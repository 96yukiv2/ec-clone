import {yen} from '@/lib/api';
import ProductActions from './product-actions';
export default async function Product({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 let p:any=null;
 try{const r=await fetch((process.env.API_INTERNAL_URL||'http://localhost:4000')+'/products/'+id,{cache:'no-store'});if(r.ok)p=await r.json();}catch{}
 if(!p)return <main className="container">商品が見つかりません。</main>;
 return <main className="container"><div className="panel" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:32}}>
 <div className="card-image" style={{height:350,fontSize:110}}>📦</div><div><div className="muted">{p.category}</div><h1>{p.name}</h1><p>{p.description}</p>
 <p className="price">{yen(p.price)}</p><p>在庫: {p.stock}</p><ProductActions id={p.id} stock={p.stock}/></div></div></main>;
}
