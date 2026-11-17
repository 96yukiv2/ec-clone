import {Inject} from '@nestjs/common';
import {Injectable} from '@nestjs/common';
import {Db} from '../../common/db';
@Injectable()
export class DiscoveryRepository{
 constructor(@Inject(Db) private readonly db:Db){}
 async trending(){return (await this.db.query("SELECT p.id,p.name,p.price,p.stock,p.image,coalesce(sum(oi.quantity),0)::int purchases FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id WHERE p.active=true AND p.parent_product_id IS NULL GROUP BY p.id ORDER BY purchases DESC,p.id ASC LIMIT 12")).rows;}
 async recent(userId:number){return (await this.db.query('SELECT DISTINCT ON (h.product_id) p.*,h.viewed_at FROM view_history h JOIN products p ON p.id=h.product_id WHERE h.user_id=$1 ORDER BY h.product_id,h.viewed_at DESC LIMIT 24',[userId])).rows;}
 async recommendations(userId:number){return (await this.db.query("WITH mine AS (SELECT DISTINCT oi.product_id FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id=$1), similar AS (SELECT DISTINCT o.user_id FROM orders o JOIN order_items oi ON oi.order_id=o.id WHERE oi.product_id IN (SELECT product_id FROM mine) AND o.user_id<>$1), picks AS (SELECT oi.product_id,count(*)::int score FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.user_id IN (SELECT user_id FROM similar) AND oi.product_id NOT IN (SELECT product_id FROM mine) GROUP BY oi.product_id) SELECT p.id,p.name,p.price,p.stock,p.image,picks.score FROM picks JOIN products p ON p.id=picks.product_id WHERE p.active=true ORDER BY picks.score DESC LIMIT 12",[userId])).rows;}
 async facets(query:string){return (await this.db.query('SELECT c.slug,c.name,count(p.id)::int count FROM categories c LEFT JOIN products p ON p.category_id=c.id AND p.active=true AND p.name ILIKE $1 GROUP BY c.id ORDER BY c.name',['%'+query+'%'])).rows;}
 async variants(parentId:number){return (await this.db.query('SELECT id,name,sku,variant_label,price,stock,image FROM products WHERE parent_product_id=$1 AND active=true ORDER BY id',[parentId])).rows;}
}