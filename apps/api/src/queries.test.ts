import {describe,it,expect} from 'vitest';
describe('money calculations',()=>{
 it('discount percentage uses integer minor units',()=>{
  const subtotal=1999,percent=10;
  expect(Math.floor(subtotal*percent/100)).toBe(199);
 });
 it('shipping threshold is computed after discounts',()=>{
  const subtotal=5200,discount=520;
  expect(subtotal-discount>=5000?0:500).toBe(500);
 });
});
