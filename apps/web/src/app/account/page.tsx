'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {request} from '@/lib/api';
type Address={id:number;postal_code:string;region:string;city:string;line1:string;line2:string};
export default function Account(){
 const [me,setMe]=useState<any>(null),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[addresses,setAddresses]=useState<Address[]>([]),[postalCode,setPostalCode]=useState(''),[region,setRegion]=useState(''),[city,setCity]=useState(''),[line1,setLine1]=useState('');
 const load=()=>request('/auth/me').then(u=>{setMe(u);if(u)request<Address[]>('/account/addresses').then(setAddresses);}).catch(()=>{});
 useEffect(()=>{load();},[]);
 async function submit(register:boolean){try{
  const user=await request(register?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify({name,email,password})});setMe(user);setError('');
  request<Address[]>('/account/addresses').then(setAddresses).catch(()=>{});
 }catch(e:any){setError(e.message);}}
 async function addAddress(){try{
  await request('/account/addresses',{method:'POST',body:JSON.stringify({postalCode,region,city,line1})});
  setAddresses(await request('/account/addresses'));setLine1('');
 }catch(e:any){setError(e.message);}}
 return <main className="container"><div className="panel"><h1>アカウント</h1>
 {me?<><p>{me.name} ({me.email})</p><p>権限: {me.role}</p><div className="row"><Link className="button secondary" href="/favorites">お気に入り</Link><Link className="button secondary" href="/orders">注文履歴</Link>
 <button className="button secondary" onClick={async()=>{await request('/auth/logout',{method:'POST'});setMe(null);setAddresses([]);}}>ログアウト</button></div></>:
 <div className="form"><input placeholder="名前（新規登録用）" value={name} onChange={e=>setName(e.target.value)}/><input type="email" placeholder="メールアドレス" value={email} onChange={e=>setEmail(e.target.value)}/>
 <input type="password" placeholder="パスワード（10文字以上）" value={password} onChange={e=>setPassword(e.target.value)}/>
 <div className="row"><button className="button" onClick={()=>submit(false)}>ログイン</button><button className="button secondary" onClick={()=>submit(true)}>新規登録</button></div></div>}
 {error&&<p className="error">{error}</p>}</div>
 {me&&<div className="panel"><h2>配送先住所</h2>{addresses.map(a=><div className="row" key={a.id} style={{padding:'10px 0'}}><span>〒{a.postal_code} {a.region}{a.city}{a.line1}</span>
 <button className="button secondary" onClick={async()=>{await request('/account/addresses/'+a.id,{method:'DELETE'});setAddresses(await request('/account/addresses'));}}>削除</button></div>)}
 <h3>配送先を追加</h3><div className="form"><input placeholder="郵便番号" value={postalCode} onChange={e=>setPostalCode(e.target.value)}/>
 <input placeholder="都道府県" value={region} onChange={e=>setRegion(e.target.value)}/>
 <input placeholder="市区町村" value={city} onChange={e=>setCity(e.target.value)}/>
 <input placeholder="住所" value={line1} onChange={e=>setLine1(e.target.value)}/><button className="button" onClick={addAddress}>住所を登録</button></div></div>}
 </main>;
}
