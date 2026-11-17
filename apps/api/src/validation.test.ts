import {describe,it,expect} from 'vitest';
import {int,money,statuses} from './validation';
describe('checkout monetary calculations',()=>{
 it('calculates discount and shipping in integer yen',()=>expect(money(5200,10)).toEqual({discount:520,shipping:500,total:5180}));
 it('sets free shipping at exact threshold',()=>expect(money(5000,0)).toEqual({discount:0,shipping:0,total:5000}));
 it('rejects invalid quantities',()=>{expect(()=>int(-1,0,99)).toThrow();expect(()=>int(1.1,0,99)).toThrow();});
 it('never allows shipped order to return to paid',()=>expect(statuses.shipped).not.toContain('paid'));
});
