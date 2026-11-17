'use client';
import {useEffect,useState} from 'react';
import {request,yen,API,ApiError} from '@/lib/api';
import Link from 'next/link';
type Summary={orders:{orders:number;revenue:number};lowStock:{id:number;name:string;stock:number}[];trend:any[];ranking:any[]};
export default function Admin(){
 const [summary,setSummary]=useState<Summary|null>(null),[orders,setOrders]=useState<any[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[name,setName]=useState(''),[slug,setSlug]=useState(''),[price,setPrice]=useState(1000),[stock,setStock]=useState(10),[sku,setSku]=useState(''),[parentProductId,setParentProductId]=useState(''),[variantLabel,setVariantLabel]=useState(''),[image,setImage]=useState(''),[editing,setEditing]=useState(''),[editStock,setEditStock]=useState('0'),[editPrice,setEditPrice]=useState('0'),[editActive,setEditActive]=useState(true);
 async function load(){try{
  const [s,o]=await Promise.all([request<Summary>('/admin/summary'),request<any[]>('/admin/orders')]);setSummary(s);setOrders(o);setError('');
 }catch(e:unknown){
  if(e instanceof ApiError){
   if(e.status===401){setError('未ログイン、セッション期限切れ、または管理者権限がありません。アカウントを確認してください。');return;}
   if(e.status===403){setError('このアカウントには管理者権限がありません。');return;}
   if(e.status>=500){setError('サーバー内部エラー（HTTP '+e.status+'）。docker compose logs --tail=100 api を確認してください。');return;}
   setError('管理APIのエラー（HTTP '+e.status+'）：'+e.message);
  }else{setError('APIと通信できません。APIコンテナを確認してください。');}
 }}
 useEffect(()=>{load();},[]);
 async function create(){try{await request('/admin/products',{method:'POST',body:JSON.stringify({name,slug,price,stock,sku:sku||null,parentProductId:parentProductId?Number(parentProductId):null,variantLabel:variantLabel||null,image})});setMessage('商品を追加しました');setName('');setSlug('');load();}catch(e:any){setError(e.message);}}
 async function change(id:number,status:string){try{await request('/admin/orders/'+id,{method:'PATCH',body:JSON.stringify({status})});load();}catch(e:any){setError(e.message);}}
 async function updateProduct(){try{await request('/admin/products/'+editing,{method:'PATCH',body:JSON.stringify({stock:Number(editStock),price:Number(editPrice),active:editActive})});setMessage('商品を更新しました');load();}catch(e:any){setError(e.message);}}
 async function upload(file:File){const data=new FormData();data.append('file',file);try{
  const response=await fetch(API+'/admin/media',{method:'POST',credentials:'include',body:data});
  if(!response.ok)throw new Error('画像のアップロードに失敗しました');
  const value=await response.json();setImage(value.url);setMessage('画像を保存しました');
 }catch(e:any){setError(e.message);}}
 return <main className="container"><h1>ストア管理</h1>{error&&<div className="panel" role="alert"><p className="error">{error}</p><Link href="/account">ログイン状態を確認する</Link></div>}{message&&<p>{message}</p>}
 {summary&&<><div className="row"><div className="panel">注文総数 <h2>{summary.orders.orders}</h2></div><div className="panel">売上 <h2>{yen(summary.orders.revenue)}</h2></div></div>
 <div className="panel"><h2>在庫不足（5個以下）</h2>{summary.lowStock.map(p=><div key={p.id}>{p.name} — 残り {p.stock}</div>)}</div>
 <div className="panel"><h2>人気商品</h2>{summary.ranking.map(p=><div key={p.id}>{p.name} — {p.sold}個</div>)}</div>
 <div className="panel"><h2>日別売上</h2>{summary.trend.map((x,i)=><div key={i}>{String(x.day).slice(0,10)} — {yen(x.total)}</div>)}</div>
 <div className="panel"><h2>商品を登録</h2><div className="form">
 <input placeholder="商品名" value={name} onChange={e=>setName(e.target.value)}/>
 <input placeholder="slug（英小文字・数字・ハイフン）" value={slug} onChange={e=>setSlug(e.target.value)}/>
 <input type="number" min="0" value={price} onChange={e=>setPrice(Number(e.target.value))}/>
 <input type="number" min="0" value={stock} onChange={e=>setStock(Number(e.target.value))}/>
 <input placeholder="SKU（任意）" value={sku} onChange={e=>setSku(e.target.value)}/>
 <input placeholder="親商品ID（バリエーションの場合）" value={parentProductId} onChange={e=>setParentProductId(e.target.value)}/>
 <input placeholder="バリエーション名（色・サイズ等）" value={variantLabel} onChange={e=>setVariantLabel(e.target.value)}/>
 <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];if(file)upload(file);}}/>
 {image&&<p className="muted">商品画像: {image}</p>}
 <button className="button" onClick={create}>商品を追加</button></div></div>
 <div className="panel"><h2>商品を編集</h2><div className="form"><input placeholder="商品ID" value={editing} onChange={e=>setEditing(e.target.value)}/>
 <input type="number" placeholder="新しい在庫数" value={editStock} onChange={e=>setEditStock(e.target.value)}/>
 <input type="number" placeholder="新しい価格" value={editPrice} onChange={e=>setEditPrice(e.target.value)}/>
 <label><input type="checkbox" checked={editActive} onChange={e=>setEditActive(e.target.checked)}/> 公開する</label>
 <button className="button" disabled={!editing} onClick={updateProduct}>商品を更新</button></div></div>
 <div className="panel"><h2>注文処理</h2>{orders.map(o=><div className="row" key={o.id} style={{padding:12,borderBottom:'1px solid #ddd'}}>
 <span>#{o.id} {o.email}</span><strong>{o.status}</strong><span>{yen(o.total)}</span>
 {o.status==='paid'&&<button className="button" onClick={()=>change(o.id,'shipped')}>出荷する</button>}
 {o.status==='shipped'&&<button className="button" onClick={()=>change(o.id,'delivered')}>配達完了</button>}</div>)}</div></>}</main>;
}
