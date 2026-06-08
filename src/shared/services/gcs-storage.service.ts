import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';

import { ApiConfigService } from './api-config.service.ts';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

@Injectable()
export class GcsStorageService {
  private readonly storage: Storage;

  private readonly bucketName: string;

  constructor(apiConfigService: ApiConfigService) {
    const { projectId, bucket } = apiConfigService.gcpConfig;

    this.storage = new Storage({ projectId });
    this.bucketName = bucket;
  }

  /** Upload a buffer to the given object path and return that path. */
  async upload(
    objectPath: string,
    data: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .save(data, { contentType, resumable: false });

    return objectPath;
  }

  /**
   * Stream data straight into GCS without buffering the whole file in memory.
   * The source is piped in chunks, so memory stays flat regardless of file size.
   * `resumable: true` uses GCS chunked uploads, which suits large videos.
   */
  async uploadStream(
    objectPath: string,
    source: Readable,
    contentType: string,
  ): Promise<string> {
    const writeStream = this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .createWriteStream({ contentType, resumable: true });

    await pipeline(source, writeStream);

    return objectPath;
  }

  /** Generate a short-lived signed read URL for a private object. */
  async getSignedReadUrl(
    objectPath: string,
    ttlMs: number = FIFTEEN_MINUTES_MS,
  ): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + ttlMs,
      });

    return url;
  }

  /**
   * Generate a short-lived signed write URL the client can PUT bytes to.
   * The `contentType` is bound into the signature, so the client must send the
   * exact same `Content-Type` header on its PUT or GCS rejects the upload.
   */
  async getSignedWriteUrl(
    objectPath: string,
    contentType: string,
    ttlMs: number = FIFTEEN_MINUTES_MS,
  ): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .getSignedUrl({
        action: 'write',
        contentType,
        expires: Date.now() + ttlMs,
      });

    return url;
  }

  /** Whether an object exists at the given path. */
  async exists(objectPath: string): Promise<boolean> {
    const [isPresent] = await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .exists();

    return isPresent;
  }

  async delete(objectPath: string): Promise<void> {
    await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .delete({ ignoreNotFound: true });
  }
}
