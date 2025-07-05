import { SchedulerPlugin } from '@awing/scheduler-plugin';
import { MarketingDb, Schedule, Task, TaskSchedule } from '@awing/marketing-db';

export class ScheduleManager {
    public scheduler: SchedulerPlugin;
    private logger: Console;
    private db: MarketingDb;

    constructor(db:MarketingDb) {
        this.logger = console;
        this.db = db;
        this.scheduler = new SchedulerPlugin();
    }

    async start() {
        await this.scheduleAll();
    }

    async restart() {
        await this.scheduler.restart();
    }

    async stop() {
        await this.scheduler.stop();
    }

    /**
     * Schedule all events from the loaded schedules and tasks.
     * Each schedule may have multiple tasks (by id), which are mapped to URLs from the tasks list.
     */
    private async scheduleAll(): Promise<void> {
        try {
            for (const schedule of this.db.schedules.items) {
                for (const scheduleTask of schedule.tasks) {
                    const task = this.db.tasks.items.find(t => t.id === scheduleTask.id);
                    if (!task) {
                        this.logger.warn(`Task with id ${scheduleTask.id} not found for schedule ${schedule.id}`);
                        continue;
                    }
                    this.addSchedule(schedule, task);
                }
            }
        } catch (error) {
            this.logger.error('Error scheduling all events:', error);
        }
    }

    private addSchedule(schedule: Schedule, task: Task) {
        try {
            this.scheduler.add(
                TaskSchedule.id(schedule.id, task.id),
                this.cronTime(task, schedule),
                task.url
            );
            this.logger.info(`Scheduled job for schedule ${schedule.id}, task ${task.id}`);
        } catch (err) {
            this.logger.error(`Failed to schedule job for schedule ${schedule.id}, task ${task.id}:`, err);
        }
    }

    cronTime(t: Task, schedule: Schedule): string {
        const [min, hour, dayStr, monthStr] = schedule.cron.split(' ');
        const eventDate = new Date(2024, parseInt(monthStr) - 1, parseInt(dayStr));
        const scheduledTask = schedule.tasks.find(scheduledTask => scheduledTask.id === t.id);

        eventDate.setDate(eventDate.getDate() - scheduledTask.leadDays);

        const preDay = eventDate.getDate();
        const preMonth = eventDate.getMonth() + 1;

        return `${min} ${hour} ${preDay} ${preMonth} *`;
    }
} 