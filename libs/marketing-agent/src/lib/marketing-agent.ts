export function marketingAgent(): string {
  return 'marketing-agent';
}

import { LlmResponse } from '@awing/llm-plugin';
import { ContentManager, PublishResponse } from './content-manager';
import { ScheduleManager } from './schedule-manager';
import { MarketingDb } from '@awing/marketing-db';

export class MarketingAgentOptions {
  dbPath: string;

  constructor(dbPath: string)  
  {
    this.dbPath = dbPath;
  }
}

export class MarketingAgent {
  private static instance: MarketingAgent;
  private scheduler: ScheduleManager;
  private content: ContentManager;
  private db: MarketingDb;

  constructor(options: MarketingAgentOptions) 
  {
    this.db = new MarketingDb(options.dbPath)
    this.scheduler = new ScheduleManager(this.db);
    this.content = new ContentManager(this.db);
  }

  async start() {
    await this.db.load();
    await this.scheduler.start();
  }

  async restart() {
    await this.scheduler.restart();
  }

  async stop() {
    await this.scheduler.stop();
  }

  async generate(id: string): Promise<LlmResponse> {
    return this.content.generate(id);
  }

  async publish(id: string): Promise<PublishResponse> {
    return this.content.publish(id);
  }

  static getInstance(options: MarketingAgentOptions)  {
    if (!MarketingAgent.instance) {
      MarketingAgent.instance = new MarketingAgent(options);
    }
    return MarketingAgent.instance;
  }
}
