import {Pool} from 'pg';
const db=new Pool({connectionString:process.env.DATABASE_URL});
(async()=>{
 try{
  await db.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  await db.query('CREATE INDEX IF NOT EXISTS products_name_trgm ON products USING gin (name gin_trgm_ops)');
  await db.query('CREATE INDEX IF NOT EXISTS products_description_trgm ON products USING gin (description gin_trgm_ops)');
  await db.query('CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items(product_id)');
  await db.query('CREATE INDEX IF NOT EXISTS view_history_user_time_idx ON view_history(user_id,viewed_at DESC)');
  await db.query('CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders(status,created_at DESC)');
  console.log('Indexes ready');
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
