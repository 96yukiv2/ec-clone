'use client';
import {useEffect,useState} from 'react';
import {request} from '@/lib/api';
import ProductCard,{CatalogProduct} from './product-card';
export default function ProductCarousel({endpoint,title}:{endpoint:string;title:string}){
 const [items,setItems]=useState<CatalogProduct[]>([]);
 useEffect(()=>{request<CatalogProduct[]>(endpoint).then(setItems).catch(()=>{});},[endpoint]);
 if(items.length===0)return null;
 return <section style={{marginTop:32}}><h2>{title}</h2><div className="grid">{items.slice(0,6).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>;
}
