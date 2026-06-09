/** biome-ignore-all lint/style/useNamingConvention: D-ID wire keys are snake_case and must match exactly */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { ApiConfigService } from '../../../shared/services/api-config.service.ts';
import type { IDidCreateTalk } from '../interfaces/did-create-talk.interface.ts';
import type { IDidTalk } from '../interfaces/did-talk.interface.ts';

@Injectable()
export class DidService {
  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly webhookUrl: string;

  private readonly webhookSecret: string;

  constructor(
    private readonly httpService: HttpService,
    apiConfigService: ApiConfigService,
  ) {
    const { apiKey, baseUrl, webhookUrl, webhookSecret } =
      apiConfigService.didConfig;

    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.webhookUrl = webhookUrl;
    this.webhookSecret = webhookSecret;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Basic ${this.apiKey}`,
    };
  }

  get webhookEndpoint(): string {
    return `${this.webhookUrl.replace(/\/$/, '')}/${this.webhookSecret}`;
  }

  async createTalk(params: IDidCreateTalk): Promise<IDidTalk> {
    const body = {
      source_url: params.sourceUrl,
      script: { type: 'audio', audio_url: params.audioUrl },
      webhook: this.webhookEndpoint,
      user_data: params.userData,
    };

    const response = await firstValueFrom(
      this.httpService.post<Record<string, unknown>>(
        `${this.baseUrl}/talks`,
        body,
        { headers: this.headers },
      ),
    );

    return this.normalize(response.data);
  }

  /**
   * Upload an image to D-ID and return the hosted URL to use as a talk
   * `source_url`. Used for source images we normalize server-side (e.g. HEIC →
   * JPEG): we send the bytes rather than a GCS link so D-ID gets a format it can
   * decode. The JPEG MIME type is bound in because D-ID validates by content.
   */
  async uploadImage(image: Buffer, filename: string): Promise<string> {
    const form = new FormData();
    form.append('image', new Blob([image], { type: 'image/jpeg' }), filename);

    const response = await firstValueFrom(
      this.httpService.post<{ url: string }>(`${this.baseUrl}/images`, form, {
        headers: this.headers,
      }),
    );

    return response.data.url;
  }

  async getTalk(talkId: string): Promise<IDidTalk> {
    const response = await firstValueFrom(
      this.httpService.get<Record<string, unknown>>(
        `${this.baseUrl}/talks/${talkId}`,
        { headers: this.headers },
      ),
    );

    return this.normalize(response.data);
  }

  private normalize(data: Record<string, unknown>): IDidTalk {
    return {
      id: String(data.id),
      status: String(data.status),
      resultUrl: data.result_url as string | undefined,
      error: data.error,
      durationSeconds: data.duration as number | undefined,
    };
  }
}
