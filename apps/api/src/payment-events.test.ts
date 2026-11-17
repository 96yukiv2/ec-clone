import {describe,it,expect} from 'vitest';
import {money,statuses} from './validation';
describe('注文ドメイン',()=>{
 it('割引後5000円未満なら送料500円',()=>expect(money(5400,10)).toEqual({discount:540,shipping:500,total:5360}));
 it('キャンセル後の再決済を許可しない',()=>expect(statuses.cancelled).toEqual([]));
});
