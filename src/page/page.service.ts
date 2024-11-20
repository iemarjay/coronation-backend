import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { DataType, Page } from './entites.ts/page.entity';
import { PageRepository } from './repositories/page.repository';
import { instanceToPlain } from 'class-transformer';
import { pagesData } from './resources/pages';

@Injectable()
export class PageService implements OnModuleInit {
  private readonly logger = new Logger(PageService.name);
  constructor(private pageRepository: PageRepository) {}

  async onModuleInit() {
    await this.initializePages();
  }

  private async initializePages() {
    try {
      const existingPages = await this.pageRepository.find();

      if (existingPages.length === 0) {
        const pages = await this.create(pagesData);
        this.logger.log(pages.message);
      } else {
        this.logger.log('Pages already exist.');
      }
    } catch (error) {
      this.logger.error('Error initializing pages: ', error);
    }
  }

  async create(dtos: CreatePageDto | CreatePageDto[]) {
    const pagesToCreate = Array.isArray(dtos) ? dtos : [dtos];
    const createdPages = [];

    for (const dto of pagesToCreate) {
      if (dto.type === DataType.block && !dto.content) {
        throw new BadRequestException('Content required');
      }

      const sectionSlug = dto.sectionTitle ? slugify(dto.sectionTitle) : null;

      const subPagesSlug = dto.subPagesTitle?.map(slugify) || [];
      const parentPagesSlug = dto.parentPagesTitle?.map(slugify) || [];

      const page = await this.pageRepository.save({
        ...dto,
        documentSlug: slugify(dto.documentTitle),
        pageSlug: slugify(dto.pageTitle),
        sectionSlug,
        parentPagesSlug,
        subPagesSlug,
      });

      createdPages.push(instanceToPlain<Partial<Page>>(page));
    }

    return {
      message: pagesToCreate.length > 1 ? 'pages added' : 'page added',
      success: true,
      data: createdPages,
    };
  }

  async getPages() {
    return await this.pageRepository.find({
      where: {
        type: DataType.page,
      },
    });
  }

  async search(searchTerm: string) {
    if (typeof searchTerm !== 'string' || searchTerm.length < 3) {
      return [];
    }
    const pages = await this.pageRepository.getSearchResults(searchTerm);

    const highlightedPages = pages
      .map((page) => {
        const content = page.content ? page.content : page.pageTitle;
        const sentences = content.split(/(?<=[.!?])\s+/);

        const matchingSentences = sentences.filter((sentence) =>
          sentence.toLowerCase().includes(searchTerm.toLowerCase()),
        );

        const highlightedSentences = matchingSentences.map((sentence) => {
          const regex = new RegExp(`\\b\\w*${searchTerm}\\w*\\b`, 'gi');
          return sentence.replace(regex, '<b>$&</b>');
        });

        return {
          ...instanceToPlain<Partial<Page>>(page),
          highlight: highlightedSentences,
        };
      })
      .filter((page) => page.highlight.length > 0);

    return highlightedPages;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-&?]+/g, '');
}
