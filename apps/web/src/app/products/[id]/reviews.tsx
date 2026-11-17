'use client';
import {useEffect,useState} from 'react';
import {request} from '@/lib/api';
type Review={id:number;rating:number;body:string;name:string;helpful:number};
export default function Reviews({id}:{id:number}){
 const [reviews,setReviews]=useState<Review[]>([]),[rating,setRating]=useState(5),[body,setBody]=useState(''),[message,setMessage]=useState('');
 const load=()=>request<Review[]>('/products/'+id+'/reviews').then(setReviews).catch(()=>{});
 useEffect(()=>{load();},[id]);
 async function send(){try{await request('/products/'+id+'/reviews',{method:'POST',body:JSON.stringify({rating,body})});setBody('');setMessage('レビューを投稿しました');load();}catch(e:any){setMessage(e.message);}}
 async function vote(reviewId:number){try{await request('/products/reviews/'+reviewId+'/helpful',{method:'POST'});load();}catch(e:any){setMessage(e.message);}}
 return <section className="panel"><h2>カスタマーレビュー</h2><p className="muted">レビューは購入・決済済みのユーザーのみ投稿できます。</p>
 <div className="form"><select value={rating} onChange={e=>setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}</select>
 <textarea value={body} onChange={e=>setBody(e.target.value)} rows={3} placeholder="商品の感想" style={{padding:12,borderRadius:8,border:'1px solid #cbd4db'}}/>
 <button className="button" onClick={send}>レビューを投稿</button>{message&&<p>{message}</p>}</div>
 {reviews.map(review=><div key={review.id} style={{padding:'18px 0',borderBottom:'1px solid #e5e7eb'}}><strong>{review.name}</strong>
 <p>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><p>{review.body}</p>
 <button className="button secondary" onClick={()=>vote(review.id)}>役に立った ({review.helpful})</button></div>)}</section>;
}
