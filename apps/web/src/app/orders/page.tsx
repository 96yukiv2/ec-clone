'use client';
import {useEffect,useState} from 'react';
import {request,yen} from '@/lib/api';
export default function Orders(){
 const [orders,setOrders]=useState<any[]>([]),[guest,setGuest]=useState(false),[error,setError]=useState('');
 const reload=async()=>{try{const me=await request('/auth/me');setGuest(!me);setOrders(await request(me?'/orders':'/guest/orders'));setError('');}catch(e:any){setError(e.message);}};
 useEffect(()=>{reload();},[]);
 async function action(id:number,path:string,payload?:any){try{await request((guest?'/guest/orders/':'/orders/')+id+'/'+path,{method:'POST',body:JSON.stringify(payload||{})});reload();}catch(e:any){setError(e.message);}}
 return <main className="container"><h1>注文履歴・Mock決済</h1>{guest&&<p className="muted">ゲスト注文の確認には、注文したブラウザのCookieが必要です。</p>}{error&&<p className="error">{error}</p>}
 {orders.map(o=><div className="panel" key={o.id}><div className="row"><strong>注文 #{o.id}</strong><span>{o.status}</span><span className="spacer"/><strong>{yen(o.total)}</strong></div>
 <p className="muted">小計 {yen(o.subtotal)} / 割引 {yen(o.discount)} / 送料 {yen(o.shipping)}</p>
 <div className="row">{['pending_payment','payment_failed'].includes(o.status)&&<><button className="button" onClick={()=>action(o.id,'pay',{succeed:true})}>Mock決済成功</button><button className="button secondary" onClick={()=>action(o.id,'pay',{succeed:false})}>決済失敗を再現</button></>}
 {!guest&&['pending_payment','payment_failed','paid'].includes(o.status)&&<button className="button secondary" onClick={()=>action(o.id,'cancel')}>注文キャンセル</button>}
 {!guest&&['delivered','paid'].includes(o.status)&&<button className="button secondary" onClick={()=>action(o.id,'refund')}>Mock返金</button>}</div></div>)}</main>;
}
