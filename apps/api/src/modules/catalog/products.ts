import {Controller,Get,Post,Param,Query,Req,Body} from '@nestjs/common';
import {Request} from 'express';
import {ProductsService} from './products.service';
@Controller('products')
export class ProductsController{
 constructor(private readonly service:ProductsService){}
 @Get() list(@Query() q:any){return this.service.list(q);}
 @Get('suggest') suggest(@Query('q') q:string){return this.service.suggest(q);}
 @Get('categories') categories(){return this.service.categories();}
 @Get(':id/reviews') reviews(@Param('id') id:string){return this.service.reviews(id);}
 @Get(':id/related') related(@Param('id') id:string){return this.service.related(id);}
 @Get(':id') detail(@Param('id') id:string,@Req() req:Request){return this.service.detail(id,req);}
 @Post(':id/reviews') review(@Param('id') id:string,@Req() req:Request,@Body() body:any){return this.service.review(id,req,body);}
 @Post('reviews/:reviewId/helpful') helpful(@Param('reviewId') id:string,@Req() req:Request){return this.service.helpful(id,req);}
}
