'use client';
import {useEffect,useState} from 'react';
import {request,yen} from '@/lib/api';
type Summary={orders:{orders:number;revenue:number};lowStock:{id:number;name:string;stock:number}[];trend:any[];ranking:any[]};
export default function Admin(){
 const [summary,setSummary]=useState<Summary|null>(null),[orders,setOrders]=useState<any[]>([]),[error,setError]=useState(''),[name,setName]=useState(''),[slug,setSlug]=useState(''),[price,setPrice]=useState(1000),[stock,setStock]=useState(10);
 async function load(){try{
  const [s,o]=await Promise.all([request<Summary>('/admin/summary'),request<any[]>('/admin/orders')]);setSummary(s);setOrders(o);setError('');
 }catch(e:any){setError(e.message+' · この画面には管理者権限が必要です');}}
 useEffect(()=>{load();},[]);
 async function create(){try{await request('/admin/products',{method:'POST',body:JSON.stringify({name,slug,price,stock})});setName('');setSlug('');load();}catch(e:any){setError(e.message);}}
 async function change(id:number,status:string){try{await request('/admin/orders/'+id,{method:'PATCH',body:JSON.stringify({status})});load();}catch(e:any){setError(e.message);}}
 return <main className="container"><h1>ストア管理</h1>{error&&<p className="error">{error}</p>}
 {summary&&<><div className="row"><div className="panel">注文総数 <h2>{summary.orders.orders}</h2></div><div className="panel">売上 <h2>{yen(summary.orders.revenue)}</h2></div></div>
 <div className="panel"><h2>在庫不足（5個以下）</h2>{summary.lowStock.map(p=><div key={p.id}>{p.name} — 残り {p.stock}</div>)}</div>
 <div className="panel"><h2>人気商品</h2>{summary.ranking.map(p=><div key={p.id}>{p.name} — {p.sold}個</div>)}</div>
 <div className="panel"><h2>日別売上</h2>{summary.trend.map((x,i)=><div key={i}>{String(x.day).slice(0,10)} — {yen(x.total)}</div>)}</div>
 <div className="panel"><h2>商品を登録</h2><div className="form">
 <input placeholder="商品名" value={name} onChange={e=>setName(e.target.value)}/>
 <input placeholder="slug (英数字とハイフン)" value={slug} onChange={e=>setSlug(e.target.value)}/>
 <input type="number" value={price} onChange={e=>setPrice(Number(e.target.value))}/>
 <input type="number" value={stock} onChange={e=>setStock(Number(e.target.value))}/>
 <button className="button" onClick={create}>商品を追加</button></div></div>
 <div className="panel"><h2>注文処理</h2>{orders.map(o=><div className="row" key={o.id} style={{padding:12,borderBottom:'1px solid #ddd'}}>
 <span>#{o.id} {o.email}</span><strong>{o.status}</strong><span>{yen(o.total)}</span>
 {o.status==='paid'&&<button className="button" onClick={()=>change(o.id,'shipped')}>出荷する</button>}
 {o.status==='shipped'&&<button className="button" onClick={()=>change(o.id,'delivered')}>配達完了</button>}</div>)}</div></>}</main>;
}
