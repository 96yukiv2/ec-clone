'use client';
import Link from 'next/link';
import {useShop} from '@/lib/shop-state';
export default function SiteHeader(){
 const {user,loading,cartCount}=useShop();
 return <header><Link href="/" className="brand">ec / clone</Link>
 <form action="/" className="search"><input name="search" placeholder="商品を検索" aria-label="商品検索"/><button type="submit">検索</button></form>
 <nav className="nav" aria-label="メインメニュー">
 <Link href="/cart">カート <span className="nav-count">{cartCount}</span></Link>
 <Link href="/favorites">♡ お気に入り</Link><Link href="/orders">注文履歴</Link>
 <Link className="login-status" href="/account">{loading?'確認中…':user?'✓ '+user.name+'（ログイン中）':'ゲスト｜ログイン・登録'}</Link>
 {user?.role==='admin'&&<Link href="/admin">管理画面</Link>}</nav></header>;
}
