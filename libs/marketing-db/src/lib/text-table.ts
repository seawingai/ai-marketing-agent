import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * TextLoader loads all .txt files in a folder into a Map, provides get/set, and can save back to files.
 */
export class TextTable {
  private folder: string;
  private table: Map<string, string> = new Map();

  constructor(folder: string) {
    this.folder = path.resolve(folder);
  }

  /**
   * Loads all .txt files in the folder into the table.
   */
  async load(): Promise<void> {
    try {
      const files = await fs.readdir(this.folder);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const key = path.basename(file, '.txt');
          const filePath = path.join(this.folder, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            this.table.set(key, content);
            console.log(`[TextLoader] Loaded: ${file}`);
          } catch (err) {
            console.error(`[TextLoader] Failed to read ${file}:`, err);
          }
        }
      }
      console.log(`[TextLoader] Loaded ${this.table.size} .txt files from ${this.folder}`);
    } catch (err) {
      console.error(`[TextLoader] Failed to read directory ${this.folder}:`, err);
      throw err;
    }
  }

  /**
   * Gets the content for a given key (filename without extension).
   */
  get(key: string): string | undefined {
    return this.table.get(key);
  }

  /**
   * Sets the content for a given key (filename without extension).
   */
  set(key: string, value: string): void {
    this.table.set(key, value);
  }

  /**
   * Saves the current table back to .txt files in the folder.
   */
  async save(): Promise<void> {
    try {
      for (const [key, value] of this.table.entries()) {
        const filePath = path.join(this.folder, `${key}.txt`);
        try {
          await fs.writeFile(filePath, value, 'utf-8');
          console.log(`[TextLoader] Saved: ${key}.txt`);
        } catch (err) {
          console.error(`[TextLoader] Failed to write ${key}.txt:`, err);
        }
      }
      console.log(`[TextLoader] Saved ${this.table.size} .txt files to ${this.folder}`);
    } catch (err) {
      console.error(`[TextLoader] Failed to save files to ${this.folder}:`, err);
      throw err;
    }
  }
} 