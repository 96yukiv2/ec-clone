import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import React from 'react';
import ProductCard from './product-card';
describe('商品カード',()=>{
 it('商品名・価格・在庫を表示する',()=>{
  render(<ProductCard product={{id:1,name:'テスト商品',price:1990,stock:5,rating:4.5}}/>);
  expect(screen.getByText('テスト商品')).toBeTruthy();
  expect(screen.getByText('¥1,990')).toBeTruthy();
  expect(screen.getByText(/在庫 5/)).toBeTruthy();
 });
 it('在庫切れを表示する',()=>{
  render(<ProductCard product={{id:2,name:'売り切れ',price:300,stock:0}}/>);
  expect(screen.getByText(/在庫切れ/)).toBeTruthy();
 });
});
