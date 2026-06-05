import { CloudTasksClient } from '@google-cloud/tasks';
import { Injectable } from '@nestjs/common';

import { ApiConfigService } from './api-config.service.ts';

@Injectable()
export class CloudTasksService {
  private readonly client: CloudTasksClient;

  private readonly queuePath: string;

  private readonly targetUrl: string;

  private readonly invokerServiceAccount: string;

  constructor(apiConfigService: ApiConfigService) {
    const { projectId, location, queue, targetUrl, invokerServiceAccount } =
      apiConfigService.gcpConfig;

    /*
     * No explicit credentials: the client picks up the runtime service account
     * via Application Default Credentials (ADC).
     */
    this.client = new CloudTasksClient({ projectId });
    this.queuePath = this.client.queuePath(projectId, location, queue);
    this.targetUrl = targetUrl;
    this.invokerServiceAccount = invokerServiceAccount;
  }

  /**
   * Enqueue a task that POSTs the given JSON payload to the configured target URL.
   * Returns immediately once the task is accepted by Cloud Tasks — the actual work
   * runs later when Cloud Tasks calls the endpoint.
   */
  async enqueue(payload: Record<string, unknown>): Promise<void> {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64');

    await this.client.createTask({
      parent: this.queuePath,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: this.targetUrl,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { 'Content-Type': 'application/json' },
          body,
          oidcToken: {
            serviceAccountEmail: this.invokerServiceAccount,
            audience: this.targetUrl,
          },
        },
      },
    });
  }
}
