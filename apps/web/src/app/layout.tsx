import './globals.css';
import Link from 'next/link';
import type {ReactNode} from 'react';
export const metadata={title:'EC Clone | Local Shop',description:'Local ecommerce learning project'};
export default function Layout({children}:{children:ReactNode}){
 return <html lang="ja"><body><header><Link href="/" className="brand">ec / clone</Link>
 <form action="/" className="search"><input name="search" placeholder="商品を検索"/><button type="submit">検索</button></form>
 <nav className="nav"><Link href="/cart">カート</Link><Link href="/favorites">お気に入り</Link><Link href="/orders">注文履歴</Link><Link href="/account">アカウント</Link><Link href="/admin">管理画面</Link></nav>
 </header>{children}<footer className="container muted">Local learning project · Mock payments · Not affiliated with Amazon</footer></body></html>;
}
