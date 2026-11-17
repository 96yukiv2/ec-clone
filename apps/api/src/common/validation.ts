import {BadRequestException} from '@nestjs/common';
export const int=(v:unknown,min=0,max=Number.MAX_SAFE_INTEGER):number=>{
 const n=Number(v);
 if(!Number.isSafeInteger(n)||n<min||n>max)throw new BadRequestException('Invalid integer');
 return n;
};
export const str=(v:unknown,min=1,max=200):string=>{
 const s=typeof v==='string'?v.trim():'';
 if(s.length<min||s.length>max)throw new BadRequestException('Invalid text length');
 return s;
};
export function money(subtotal:number,percent:number):{discount:number;shipping:number;total:number}{
 const discount=Math.floor(subtotal*percent/100);
 const shipping=subtotal-discount>=5000?0:500;
 return {discount,shipping,total:subtotal-discount+shipping};
}
export const statuses={
 pending_payment:['paid','payment_failed','cancelled','expired'],
 payment_failed:['paid','cancelled','expired'],
 paid:['shipped','cancelled','refunded'],
 shipped:['delivered'],
 delivered:['refunded'],
 cancelled:[],refunded:[],expired:[]
} as const;
