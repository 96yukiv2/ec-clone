import SearchFilters from '@/components/search-filters';
import ProductCard,{CatalogProduct} from '@/components/product-card';
import ProductCarousel from '@/components/product-carousel';
import Link from 'next/link';
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const q=await searchParams,params=new URLSearchParams();
 for(const k of ['search','category','minPrice','maxPrice','minRating','inStock','sort','page'])if(q[k])params.set(k,q[k]!);
 let items:CatalogProduct[]=[],total=0,error='';
 try{
  const res=await fetch((process.env.API_INTERNAL_URL||'http://localhost:4000')+'/products?'+params,{cache:'no-store'});
  if(!res.ok)throw new Error('API unavailable');
  const data=await res.json();items=data.items;total=data.total;
 }catch{error='APIに接続できません。Docker Composeの起動状況を確認してください。';}
 return <main className="container"><section className="hero"><h1>好きなものを、見つけよう。</h1><p>ECアーキテクチャを体験するローカルショップ</p></section>
 <SearchFilters initial={q}/>
 <h2>商品一覧 <small className="muted">{total}件</small></h2>{error&&<p className="error">{error}</p>}
 <div className="grid">{items.map(p=><ProductCard key={p.id} product={p}/>)}</div>
 <div className="row" style={{justifyContent:'center',margin:30}}>
 {Number(q.page||1)>1&&<Link className="button secondary" href={'/?'+new URLSearchParams({...q,page:String(Number(q.page||1)-1)}).toString()}>前へ</Link>}
 {Number(q.page||1)*12<total&&<Link className="button secondary" href={'/?'+new URLSearchParams({...q,page:String(Number(q.page||1)+1)}).toString()}>次へ</Link>}</div>
 <ProductCarousel endpoint="/discovery/trending" title="人気の商品"/>
 <ProductCarousel endpoint="/discovery/recommendations" title="あなたへのおすすめ"/>
 <ProductCarousel endpoint="/discovery/recent" title="最近閲覧した商品"/>
 </main>;
}
