import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    protected repository: PermissionRepository,
    private event: EventEmitter2,
  ) {}

  async onModuleInit() {
    await this.initializePermissions();
  }

  private async initializePermissions() {
    const permissions = ['read', 'write', 'upload', 'download'];

    for (const name of permissions) {
      const existingPermission = await this.repository.findOneBy({ name });
      if (!existingPermission) {
        await this.repository.save({ name });
      }
    }
  }

  async getAll() {
    return this.repository.find();
  }
}
