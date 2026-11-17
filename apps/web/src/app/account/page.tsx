'use client';
import {useEffect,useState} from 'react';
import {request} from '@/lib/api';
export default function Account(){
 const [me,setMe]=useState<any>(null),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('');
 useEffect(()=>{request('/auth/me').then(setMe).catch(()=>{});},[]);
 async function submit(register:boolean){try{
  const user=await request(register?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify({name,email,password})});setMe(user);setError('');
 }catch(e:any){setError(e.message);}}
 return <main className="container"><div className="panel"><h1>アカウント</h1>
 {me?<><p>{me.name} ({me.email})</p><p>権限: {me.role}</p><button className="button secondary" onClick={async()=>{await request('/auth/logout',{method:'POST'});setMe(null);}}>ログアウト</button></>:
 <div className="form"><input placeholder="名前（新規登録用）" value={name} onChange={e=>setName(e.target.value)}/><input type="email" placeholder="メールアドレス" value={email} onChange={e=>setEmail(e.target.value)}/>
 <input type="password" placeholder="パスワード（10文字以上）" value={password} onChange={e=>setPassword(e.target.value)}/>
 <div className="row"><button className="button" onClick={()=>submit(false)}>ログイン</button><button className="button secondary" onClick={()=>submit(true)}>新規登録</button></div></div>}
 {error&&<p className="error">{error}</p>}</div></main>;
}
