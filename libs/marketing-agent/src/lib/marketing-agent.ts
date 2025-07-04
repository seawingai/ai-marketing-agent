export function marketingAgent(): string {
  return 'marketing-agent';
}

import { NodeCronPlugin } from '@awing/node-cron-plugin';
import { ContentManager } from './content-manager';

export class MarketingAgent {
  private static instance: MarketingAgent;
  scheduler: NodeCronPlugin;
  content: ContentManager;

  constructor(scheduleFilePath: string) {
    this.scheduler = new NodeCronPlugin(scheduleFilePath);
    this.content = new ContentManager();
  }

  async start() {
    await this.scheduler.load();
  }

  async restart() {
    await this.scheduler.restart();
  }

  async stop() {
    await this.scheduler.stop();
  }

  static getInstance(configPath: string) {
    if (!MarketingAgent.instance) {
      MarketingAgent.instance = new MarketingAgent(configPath);
    }
    return MarketingAgent.instance;
  }
}
