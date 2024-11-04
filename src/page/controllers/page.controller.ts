import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PageService } from '../page.service';
import { CreatePageDto } from '../dto/create-page.dto';
import { SearchPageQueryDto } from '../dto/search-page.dto';

@Controller('page')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post('create')
  create(@Body() dto: CreatePageDto) {
    return this.pageService.create(dto);
  }

  @Get('search')
  search(@Query() query: SearchPageQueryDto) {
    return this.pageService.search(query.q);
  }
}
