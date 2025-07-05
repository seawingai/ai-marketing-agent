
// Task interface based on tasks.json
export interface Task {
    id: string;
    url: string;
}

// ScheduleTask interface for the tasks inside schedules.json
export interface ScheduleTask {
    id: string;
    description: string;
    leadDays: number;
}

// Schedule interface based on schedules.json
export interface Schedule {
    id: string;
    event: string;
    date?: string;
    time?: string;
    cron: string;
    prompt: string;
    tasks: ScheduleTask[];
}

export class TaskSchedule {
    scheduleId: string;
    taskId: string;

    static id(scheduleId: string, taskId: string) {
        return `${scheduleId}:${taskId}`
    }

    static parseId(id: string): TaskSchedule {
        const [scheduleId, taskId] = id.split(':');

        if (!scheduleId || !taskId) {
            throw new Error(`Invalid ScheduleTask id format: ${id}`);
        }

        return { scheduleId, taskId };
    }
}