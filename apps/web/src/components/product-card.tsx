import Link from 'next/link';
import {yen,API} from '@/lib/api';
export type CatalogProduct={id:number;name:string;price:number;stock:number;category?:string;rating?:number;image?:string};
export default function ProductCard({product:p}:{product:CatalogProduct}){
 const src=p.image?.startsWith('/uploads/')?API+p.image:p.image;
 return <Link className="card" href={'/products/'+p.id}>
  <div className="card-image">{src?<img src={src} alt={p.name} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>:'📦'}</div>
  <div className="muted">{p.category||'商品'}</div><h3>{p.name}</h3><div className="price">{yen(p.price)}</div>
  <p className="muted">★ {Number(p.rating||0).toFixed(1)} · {p.stock>0?'在庫 '+p.stock:'在庫切れ'}</p>
 </Link>;
}
