import { JsonTable } from "./json-table";
import { TextTable } from "./text-table";
import { Schedule, Task } from "./types";

export function marketingDb(): string {
  return 'marketing-db';
}

export class MarketingDb {
  private logger: Console;
  dbPath: string
  schedules: JsonTable<Schedule>;
  tasks: JsonTable<Task>;
  prompts: TextTable;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  public async load(): Promise<void> {
    try {
      this.schedules = new JsonTable<Schedule>(`${this.dbPath}/schedules.json`);
      this.tasks = new JsonTable<Task>(`${this.dbPath}/tasks.json`);
      this.prompts = new TextTable(`${this.dbPath}/prompts`);

      await this.schedules.load();
      await this.tasks.load();
      await this.prompts.load();

      this.logger.info(`Loaded database successfully from ${this.dbPath}.`);
    } catch (error) {
      this.logger.error('Failed to load schedules or tasks:', error);
    }
  }
} 
