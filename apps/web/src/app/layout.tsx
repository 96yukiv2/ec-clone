import './globals.css';
import type {ReactNode} from 'react';
import SiteHeader from '@/components/site-header';
import {ShopProvider} from '@/lib/shop-state';
export const metadata={title:'EC Clone | Local Shop',description:'ローカルECサイトの学習'};
export default function Layout({children}:{children:ReactNode}){return <html lang="ja"><body><ShopProvider><SiteHeader/>{children}</ShopProvider><footer className="container muted">ECサイト学習プロジェクト · Mock決済 · Amazonとは関係ありません</footer></body></html>;}
