import {describe,it,expect} from 'vitest';
import {yen,summary} from './format';
describe('表示形式・集計',()=>{
 it('円で表示する',()=>expect(yen(1200)).toBe('¥1,200'));
 it('注文合計を計算する',()=>expect(summary(2000,200,500)).toBe(2300));
});
