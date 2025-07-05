import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Generic JSON loader that loads and parses a JSON file,
 * returning a strongly typed array of the specified type.
 * Handles both normal and nested array cases.
 */
export class JsonTable<T> {
  items: T[];

  constructor(private filePath: string) {}

  async load(): Promise<T[]> {
    const absPath = path.resolve(this.filePath);
    const data = await fs.readFile(absPath, 'utf-8');
    let json: unknown = JSON.parse(data);

    // Handle case where the root is an array, but may contain nested arrays (as in schedules.json)
    if (Array.isArray(json)) {
      // Flatten any nested arrays (e.g., at the end of schedules.json)
      const flat: T[] = [];
      for (const item of json) {
        if (Array.isArray(item)) {
          flat.push(...item as T[]);
        } else {
          flat.push(item as T);
        }
      }
      this.items = flat;
      return flat;
    }
    throw new Error('JSON root is not an array');
  }

  /**
   * Get an item by its id.
   * @param id The id of the item to retrieve.
   * @returns The item with the given id, or undefined if not found.
   */
  get(id: string): T | undefined {
    try {
      if (!this.items) {
        console.error('Items not loaded. Call load() first.');
        return undefined;
      }
      const item = this.items.find((item: any) => item.id === id);
      if (!item) {
        console.warn(`Item with id '${id}' not found.`);
      }
      return item;
    } catch (error) {
      console.error('Error in getById:', error);
      return undefined;
    }
  }

  /**
   * Set (add or update) an item by its id.
   * @param id The id of the item to set.
   * @param newItem The new item to add or update.
   */
  set(id: string, newItem: T): void {
    try {
      if (!this.items) {
        console.error('Items not loaded. Call load() first.');
        return;
      }
      const idx = this.items.findIndex((item: any) => item.id === id);
      if (idx !== -1) {
        this.items[idx] = newItem;
        console.info(`Updated item with id '${id}'.`);
      } else {
        this.items.push(newItem);
        console.info(`Added new item with id '${id}'.`);
      }
    } catch (error) {
      console.error('Error in setById:', error);
    }
  }

  /**
   * Save the current items array back to the JSON file.
   */
  async save(): Promise<void> {
    try {
      if (!this.items) {
        throw new Error('No items to save. Call load() first.');
      }
      const absPath = path.resolve(this.filePath);
      await fs.writeFile(absPath, JSON.stringify(this.items, null, 2), 'utf-8');
      console.info(`Saved ${this.items.length} items to ${absPath}`);
    } catch (error) {
      console.error('Error saving items to file:', error);
      throw error;
    }
  }
}

// Example usage:
// const loader = new JsonLoader<Schedule>('path/to/schedules.json');
// const schedules = await loader.load();
// const taskLoader = new JsonLoader<Task>('path/to/tasks.json');
// const tasks = await taskLoader.load();
