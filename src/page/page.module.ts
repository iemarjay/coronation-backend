import { Module } from '@nestjs/common';
import { PageService } from './page.service';
import { PageController } from './controllers/page.controller';
import { PageRepository } from './repositories/page.repository';

@Module({
  controllers: [PageController],
  providers: [PageService, PageRepository],
})
export class PageModule {}
