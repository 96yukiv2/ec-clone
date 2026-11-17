import {Inject} from '@nestjs/common';
import {Controller,Get,Query,Req,Param} from '@nestjs/common';
import {Request} from 'express';
import {DiscoveryService} from './discovery.service';
@Controller('discovery')
export class DiscoveryController{
 constructor(@Inject(DiscoveryService) private readonly service:DiscoveryService){}
 @Get('trending') trending(){return this.service.trending();}
 @Get('recent') recent(@Req() req:Request){return this.service.recent(req);}
 @Get('recommendations') recommendations(@Req() req:Request){return this.service.recommendations(req);}
 @Get('search/facets') facets(@Query('q') q:string){return this.service.facets(q);}
 @Get('variants/:id') variants(@Param('id') id:string){return this.service.variants(id);}
}