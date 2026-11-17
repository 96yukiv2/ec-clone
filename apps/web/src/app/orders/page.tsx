'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request,yen} from '@/lib/api';
import {useShop} from '@/lib/shop-state';
type Order={id:number;status:string;subtotal:number;discount:number;shipping:number;total:number};
const statusLabels:Record<string,string>={pending_payment:'支払い待ち',payment_failed:'決済失敗',paid:'支払い済み',shipped:'発送済み',delivered:'配達完了',cancelled:'キャンセル済み',expired:'期限切れ',refunded:'返金済み'};
export default function Orders(){
 const {user,loading,refresh}=useShop();
 const [orders,setOrders]=useState<Order[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 async function reload(){setBusy(true);try{setOrders(await request<Order[]>(user?'/orders':'/guest/orders'));setError('');}catch{setError('注文履歴を取得できませんでした。');}finally{setBusy(false);}}
 useEffect(()=>{if(!loading)void reload();},[user,loading]);
 async function action(id:number,path:string,payload?:unknown){
  try{await request((user?'/orders/':'/guest/orders/')+id+'/'+path,{method:'POST',body:JSON.stringify(payload||{})});await reload();await refresh();}
  catch(e){setError(e instanceof Error?e.message:'注文処理に失敗しました');}
 }
 return <main className="container"><h1>注文履歴・Mock決済</h1>
 {!loading&&!user&&<div className="panel"><h2>ゲストの注文履歴</h2><p>このブラウザで購入したゲスト注文だけを表示します。ブラウザのCookieを削除すると履歴を確認できなくなる場合があります。</p>
 <Link href="/account">ログイン・会員登録はこちら</Link></div>}
 {error&&<p className="error" role="alert">{error}</p>}
 {loading||busy?<p>読み込み中…</p>:orders.length===0?<div className="panel"><p>注文履歴はまだありません。</p><Link className="button secondary" href="/">商品を探す</Link></div>:orders.map(o=><article className="panel" key={o.id}>
 <div className="row"><strong>注文 #{o.id}</strong><span>{statusLabels[o.status]||o.status}</span><span className="spacer"/><strong>{yen(o.total)}</strong></div>
 <p className="muted">小計 {yen(o.subtotal)} / 割引 {yen(o.discount)} / 送料 {yen(o.shipping)}</p>
 <div className="row">{['pending_payment','payment_failed'].includes(o.status)&&<><button className="button" onClick={()=>action(o.id,'pay',{succeed:true})}>Mock決済成功</button><button className="button secondary" onClick={()=>action(o.id,'pay',{succeed:false})}>決済失敗を再現</button></>}
 {user&&['pending_payment','payment_failed','paid'].includes(o.status)&&<button className="button secondary" onClick={()=>action(o.id,'cancel')}>注文キャンセル</button>}
 {user&&['paid','delivered'].includes(o.status)&&<button className="button secondary" onClick={()=>action(o.id,'refund')}>Mock返金</button>}</div>
 </article>)}</main>;
}
