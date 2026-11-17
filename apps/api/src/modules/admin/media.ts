import {Inject} from '@nestjs/common';
import {Controller,Post,Req,UploadedFile,UseInterceptors,UseGuards,Injectable,CanActivate,ExecutionContext,BadRequestException} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {diskStorage} from 'multer';
import {randomUUID} from 'node:crypto';
import {join} from 'node:path';
import {mkdirSync} from 'node:fs';
import {Request} from 'express';
import {Auth} from '../auth/auth';
const extensions:Record<string,string>={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'};
const directory=process.env.UPLOAD_DIR||join(process.cwd(),'uploads');
mkdirSync(directory,{recursive:true});
@Injectable()
export class AdminUploadGuard implements CanActivate{
 constructor(@Inject(Auth) private readonly auth:Auth){}
 async canActivate(context:ExecutionContext):Promise<boolean>{
  await this.auth.required(context.switchToHttp().getRequest<Request>(),true);
  return true;
 }
}
@Controller('admin/media')
export class MediaController{
 constructor(@Inject(Auth) private auth:Auth){}
 @Post()
 @UseGuards(AdminUploadGuard)
 @UseInterceptors(FileInterceptor('file',{
  storage:diskStorage({destination:directory,filename:(_req,file,cb)=>cb(null,randomUUID()+extensions[file.mimetype])}),
  limits:{fileSize:3*1024*1024},
  fileFilter:(_req,file,cb)=>{
   if(!extensions[file.mimetype])return cb(new BadRequestException('Unsupported image type'),false);
   cb(null,true);
  }
 }))
 async upload(@Req() req:Request,@UploadedFile() file:Express.Multer.File){
  await this.auth.required(req,true);
  if(!file)throw new BadRequestException('Image required');
  return {url:'/uploads/'+file.filename};
 }
}
