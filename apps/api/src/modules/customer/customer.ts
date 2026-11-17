import {Inject} from '@nestjs/common';
import {Controller,Get,Post,Delete,Req,Body,Param} from '@nestjs/common';
import {Request} from 'express';
import {CustomerService} from './customer.service';
@Controller('account')
export class CustomerController{
 constructor(@Inject(CustomerService) private readonly service:CustomerService){}
 @Get('favorites') favorites(@Req() req:Request){return this.service.favorites(req);}
 @Post('favorites/:id') add(@Req() req:Request,@Param('id') id:string){return this.service.add(req,id);}
 @Delete('favorites/:id') remove(@Req() req:Request,@Param('id') id:string){return this.service.remove(req,id);}
 @Get('history') history(@Req() req:Request){return this.service.history(req);}
 @Get('addresses') addresses(@Req() req:Request){return this.service.addresses(req);}
 @Post('addresses') address(@Req() req:Request,@Body() body:any){return this.service.address(req,body);}
 @Delete('addresses/:id') deleteAddress(@Req() req:Request,@Param('id') id:string){return this.service.deleteAddress(req,id);}
}