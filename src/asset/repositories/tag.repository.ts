import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class TagRepository extends Repository<Tag> {
  constructor(private datasource: DataSource) {
    super(Tag, datasource.createEntityManager());
  }

  async findOrCreateMany(names: string[]): Promise<Tag[]> {
    const existingTags = await this.find({
      where: { title: In(names) },
    });

    const existingTagNames = existingTags.map((tag) => tag.title);
    const newTagNames = names.filter(
      (name) => !existingTagNames.includes(name),
    );

    const newTags = newTagNames.map((name) => this.create({ title: name }));
    const savedNewTags = await this.save(newTags);

    return [...existingTags, ...savedNewTags];
  }
}
