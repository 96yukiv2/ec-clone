export const yen=(n:number)=>'¥'+Number(n).toLocaleString('ja-JP');
export const summary=(subtotal:number,discount:number,shipping:number)=>subtotal-discount+shipping;
