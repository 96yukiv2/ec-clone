import { Pool } from 'pg';
const db=new Pool({connectionString:process.env.DATABASE_URL});
async function main(){
  const cats=[['Electronics','electronics'],['Books','books'],['Home','home'],['Fashion','fashion'],['Outdoor','outdoor']];
  for(const [name,slug] of cats)await db.query('INSERT INTO categories(name,slug) VALUES($1,$2) ON CONFLICT(slug) DO NOTHING',[name,slug]);
  const categories=(await db.query('SELECT id FROM categories ORDER BY id')).rows;
  for(let i=1;i<=150;i++){
    const cat=categories[(i-1)%categories.length].id;
    const name=['Wireless Headphones','Programming Book','Desk Lamp','Canvas Bag','Travel Bottle'][((i-1)%5)]+' '+i;
    await db.query('INSERT INTO products(name,slug,description,price,category_id,stock,image) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(slug) DO NOTHING',[name,'product-'+i,'Practice catalog item '+i,500+(i*137)%18000,cat,2+(i*13)%30,'']);
  }
  await db.query("INSERT INTO coupons(code,discount_percent) VALUES('WELCOME10',10) ON CONFLICT DO NOTHING");
  console.log('Seed data ready');
}
main().finally(()=>db.end());
