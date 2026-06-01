import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import mime from 'mime-types';

import type { IFile } from './../../interfaces/IFile.ts';
import { ApiConfigService } from './api-config.service.ts';
import { GeneratorService } from './generator.service.ts';

@Injectable()
export class GcsStorageService {
  private readonly storage: Storage;

  constructor(
    public configService: ApiConfigService,
    public generatorService: GeneratorService,
  ) {
    const config = configService.gcsConfig;

    // Credentials are resolved via Application Default Credentials (ADC):
    // the runtime service account on Cloud Run / Workload Identity on GKE,
    // or GOOGLE_APPLICATION_CREDENTIALS locally.
    this.storage = new Storage({ projectId: config.projectId });
  }

  async uploadImage(file: IFile): Promise<string> {
    const fileName = this.generatorService.fileName(
      mime.extension(file.mimetype) as string,
    );
    const key = `images/${fileName}`;

    await this.storage
      .bucket(this.configService.gcsConfig.bucketName)
      .file(key)
      .save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

    return key;
  }
}
