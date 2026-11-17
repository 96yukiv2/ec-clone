import {describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import React from 'react';
import ProductCard from './product-card';
const addToCart=vi.fn().mockResolvedValue(undefined);
const toggleFavorite=vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/shop-state',()=>({useShop:()=>({addToCart,toggleFavorite,isFavorite:()=>false})}));
describe('商品カード',()=>{
 it('商品名・価格・在庫を表示する',()=>{
  render(<ProductCard product={{id:1,name:'テスト商品',price:1990,stock:5,rating:4.5}}/>);
  expect(screen.getByText('テスト商品')).toBeTruthy();
  expect(screen.getByText('¥1,990')).toBeTruthy();
  expect(screen.getByText(/在庫 5/)).toBeTruthy();
 });
 it('一覧からカートに追加できる',async()=>{
  render(<ProductCard product={{id:1,name:'追加テスト',price:1990,stock:5}}/>);
  fireEvent.click(screen.getByRole('button',{name:'カートに追加'}));
  await waitFor(()=>expect(addToCart).toHaveBeenCalledWith(1,1));
 });
 it('在庫切れは追加ボタンを無効にする',()=>{
  render(<ProductCard product={{id:2,name:'売り切れ',price:300,stock:0}}/>);
  expect(screen.getByText(/在庫切れ/)).toBeTruthy();
  expect((screen.getByRole('button',{name:'カートに追加'}) as HTMLButtonElement).disabled).toBe(true);
 });
});
