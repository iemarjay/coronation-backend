import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreatePageDto } from './dto/create-page.dto';
import { DataType, Page } from './entites.ts/page.entity';
import { PageRepository } from './repositories/page.repository';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class PageService {
  private readonly logger = new Logger(PageService.name);
  constructor(private pageRepository: PageRepository) {}

  async create(dto: CreatePageDto) {
    if (dto.type === DataType.block && !dto.content) {
      throw new BadRequestException('Content required');
    }

    let sectionSlug = null,
      subPagesSlug = [],
      parentPagesSlug = [];

    if (dto.sectionTitle) {
      sectionSlug = slugify(dto.sectionTitle);
    }
    if (dto.subPagesTitle?.length > 0) {
      for (const title of dto.subPagesTitle) {
        subPagesSlug.push(slugify(title));
      }
    }

    if (dto.parentPagesTitle?.length > 0) {
      for (const title of dto.parentPagesTitle) {
        parentPagesSlug.push(slugify(title));
      }
    }

    const page = await this.pageRepository.save({
      ...dto,
      documentSlug: slugify(dto.documentTitle),
      pageSlug: slugify(dto.pageTitle),
      sectionSlug,
      parentPagesSlug,
      subPagesSlug,
    });

    return {
      message: 'page added',
      success: true,
      data: instanceToPlain<Partial<Page>>(page),
    };
  }

  async search(searchTerm: string) {
    if (typeof searchTerm !== 'string' || searchTerm.length < 1) {
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
          const regex = new RegExp(`(${searchTerm})`, 'gi');
          return sentence.replace(regex, '<b>$1</b>');
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
    .replace(/[^\w-]+/g, '');
}
