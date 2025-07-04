export function configPlugin(): string {
  return 'config-plugin';
}

// config/base-config.ts
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { z } from 'zod';
import * as path from 'path';
// import _ from 'lodash';

dotenv.config(); // Load .env first

export abstract class ConfigPlugin<TSchema extends z.ZodTypeAny> {
  private config: any = {};
  private schema: TSchema;

  constructor(schema: TSchema) {
    this.schema = schema;
  }

  async load(): Promise<void> {
    // 1. Load from .env (already in process.env)

    // 2. Load from JSON file
    const jsonPath = path.join(process.cwd(), 'config', 'config.json');
    let jsonData = {};
    if (fs.existsSync(jsonPath)) {
      jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }

    // 3. Load secrets from vault (stubbed here)
    const vaultSecrets = await this.loadVaultSecrets(process.env.VAULT_ID);

    // 4. Load from DB (stubbed here)
    const dbConfig = await this.loadDbConfig();

    // Merge order: env < json < vault < db
    const combined = {
      ...jsonData,
      ...vaultSecrets,
      ...dbConfig,
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000'),
      db: { url: process.env.DB_URL },
      auth: { jwtSecret: process.env.JWT_SECRET },
    };

    const parsed = this.schema.safeParse(combined);
    if (!parsed.success) {
      console.error('❌ Config validation failed:', parsed.error.format());
      process.exit(1);
    }

    this.config = parsed.data;
  }

  // get<T = any>(key: string, defaultValue?: T): T {
  //   return _.get(this.config, key, defaultValue);
  // }

  getAll(): TSchema['_output'] {
    return this.config;
  }

  protected async loadVaultSecrets(vaultId?: string): Promise<any> {
    if (!vaultId) return {};
    // TODO: Connect to HashiCorp, AWS Secrets Manager, etc.
    return {
      auth: {
        jwtSecret: 'vault-jwt-secret',
      },
    };
  }

  protected async loadDbConfig(): Promise<any> {
    // TODO: Load per-service config from Postgres or Redis
    return {
      billing: {
        taxRate: 0.19,
      },
    };
  }
}
 