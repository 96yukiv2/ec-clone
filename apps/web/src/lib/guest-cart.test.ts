import {describe,it,expect} from 'vitest';
import {getGuestCart} from './guest-cart';
describe('ゲスト状態',()=>{
 it('サーバー上ではゲストカートは空になる',()=>{
  expect(getGuestCart()).toEqual([]);
 });
});
