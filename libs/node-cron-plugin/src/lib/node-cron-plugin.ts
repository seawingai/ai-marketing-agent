export function nodeCronPlugin(): string {
  return 'node-cron-plugin';
}

import cron, { ScheduledTask } from 'node-cron';
import * as fs from 'fs/promises';
import axios from 'axios';
import * as path from 'path';
import { existsSync } from 'fs';

type ScheduleEntry = {
  id: string;
  url: string;
  cronTime: string; // e.g., '0 9 * * *'
};

export class NodeCronPlugin {
  private readonly scheduleFilePath: string;
  private tasks: Map<string, ScheduledTask> = new Map();
  private entries: Map<string, ScheduleEntry> = new Map();

  constructor(scheduleFilePath = './schedules.json') {
    this.scheduleFilePath = path.resolve(scheduleFilePath);
  }

  async start(): Promise<void> {
    this.load();
    console.log('All scheduled jobs have been loaded.');
  }

  async restart(): Promise<void> {
    this.stop();
    this.start();
  }

  async stop(): Promise<void> {
    // Stop all scheduled tasks and clear them
    for (const [id, task] of this.tasks.entries()) {
      task.stop();
      this.tasks.delete(id);
    }
    this.entries.clear();
    console.log('All scheduled jobs have been stopped and cleared.');
  }

  get defaultSchedule(): ScheduleEntry[] {
    const defaultSchedule: ScheduleEntry[] = [
      {
        id: 'ping',
        cronTime: '*/3 * * * * *',
        url: 'http://localhost:3000/content/generate'
      }
    ]

    return defaultSchedule;
  }

  // Load existing schedules from file
  async load(): Promise<void> {
    try {

      let schedules: ScheduleEntry[] = this.defaultSchedule;

      if (existsSync(this.scheduleFilePath)) {
        console.log('Schedule file found.');
        const data = await fs.readFile(this.scheduleFilePath, 'utf-8');
        schedules = JSON.parse(data);
      } else {
        console.log('No schedule file found, using default schedule.');
      }

      for (const entry of schedules) {
        this.add(entry.id, entry.cronTime, entry.url, false); // don't persist while restoring
      }

      console.log(`Loaded ${schedules.length} scheduled job(s).`);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // File doesn't exist yet — safe to ignore
        console.log('No schedule file found. Starting fresh.');
        return;
      }
      console.error('Error loading schedules:', err);
    }
  }

  // Save all current entries to file
  private async save(): Promise<void> {
    const data = Array.from(this.entries.values());
    await fs.writeFile(this.scheduleFilePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  // Add a new scheduled job
  add(id: string, cronTime: string, url: string, persist = true): boolean {
    if (this.tasks.has(id)) {
      console.warn(`Job with id "${id}" already exists.`);
      return false;
    }

    if (!cron.validate(cronTime)) {
      throw new Error(`Invalid cron time: ${cronTime}`);
    }

    const task = cron.schedule(cronTime, async () => {
      try {
        await axios.get(url); // or .get if you prefer
        console.log(`[CRON] Triggered ${id} → ${url}`);
      } catch (err) {
        console.error(`[CRON] Failed to trigger ${id}:`, err);
      }
    });

    this.tasks.set(id, task);
    this.entries.set(id, { id, cronTime, url });

    if (persist) {
      this.save();
    }

    console.log(`Scheduled job ${id} at "${cronTime}" for ${url}`);
    return true;
  }

  // Remove a scheduled job
  remove(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.stop();
    this.tasks.delete(id);
    this.entries.delete(id);

    this.save();
    console.log(`Removed scheduled job ${id}`);
    return true;
  }

  // List all current scheduled jobs
  list(): ScheduleEntry[] {
    return Array.from(this.entries.values());
  }
}
