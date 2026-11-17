import {Injectable} from '@nestjs/common';
import {Db} from '../../common/db';
@Injectable()
export class CustomerRepository{
 constructor(private readonly db:Db){}
 async favorites(userId:number){return (await this.db.query('SELECT p.* FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=$1',[userId])).rows;}
 async addFavorite(userId:number,productId:number){await this.db.query('INSERT INTO favorites(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[userId,productId]);}
 async removeFavorite(userId:number,productId:number){await this.db.query('DELETE FROM favorites WHERE user_id=$1 AND product_id=$2',[userId,productId]);}
 async history(userId:number){return (await this.db.query('SELECT DISTINCT ON (p.id) p.*,h.viewed_at FROM view_history h JOIN products p ON p.id=h.product_id WHERE h.user_id=$1 ORDER BY p.id,h.viewed_at DESC LIMIT 30',[userId])).rows;}
 async addresses(userId:number){return (await this.db.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY id DESC',[userId])).rows;}
 async insertAddress(userId:number,values:string[]){return (await this.db.query('INSERT INTO addresses(user_id,postal_code,region,city,line1,line2) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[userId,...values])).rows[0];}
 async deleteAddress(userId:number,addressId:number){await this.db.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2',[addressId,userId]);}
}
