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

  private readonly maxUploadBytes: number;

  constructor(apiConfigService: ApiConfigService) {
    const { projectId, bucket, maxUploadBytes } = apiConfigService.gcpConfig;

    this.storage = new Storage({ projectId });
    this.bucketName = bucket;
    this.maxUploadBytes = maxUploadBytes;
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

  /**
   * Generate a short-lived signed read URL for a private object.
   *
   * Uses V4 signing. V4 is the maintained signing scheme and is the only one
   * that signs reliably when the runtime has no local private key and must sign
   * through the IAM `signBlob` API (Workload Identity on Cloud Run). The legacy
   * V2 default produced signatures GCS rejected with `SignatureDoesNotMatch` in
   * that setup.
   */
  async getSignedReadUrl(
    objectPath: string,
    ttlMs: number = FIFTEEN_MINUTES_MS,
  ): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectPath)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + ttlMs,
      });

    return url;
  }

  /**
   * Generate a short-lived signed write URL the client can PUT bytes to.
   * The `contentType` is bound into the signature, so the client must send the
   * exact same `Content-Type` header on its PUT or GCS rejects the upload.
   * An `x-goog-content-length-range` upper bound is also bound in, so the client
   * must send that header too and GCS rejects oversize bodies (cost/abuse cap).
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
        version: 'v4',
        action: 'write',
        contentType,
        extensionHeaders: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'x-goog-content-length-range': `0,${this.maxUploadBytes}`,
        },
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

  /**
   * Delete every object under a path prefix (e.g. `memory-points/<id>/`).
   * Used to purge all media of an abandoned draft in one call. `force: true`
   * keeps deleting the rest if an individual object is already gone.
   */
  async deletePrefix(prefix: string): Promise<void> {
    await this.storage
      .bucket(this.bucketName)
      .deleteFiles({ prefix, force: true });
  }
}
