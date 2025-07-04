# TODO

## SAAS

- set new saas to @awing from @some-saas-name/source

## COMMON

- add @src in tsconfig.app.json

```json
    "paths": {
      "@marketing-service/*": ["apps/services/marketing-service/src/*"]
    }
```

## SERVICE

## LIBS

- always change to lib

```bash
export function lib(): string {
  return 'marketing-agent';
}
```

- "type": "module", in package.json

- esbuild

```bash
"build": {
  "executor": "@nx/esbuild:esbuild",
  "options": {
    "assets": [
      "*.md",
      {
        "input": "src/assets",
        "glob": "**/*",
        "output": "assets"
      }
    ]
  }
}
```

- tsconfig.lib.json add assets

```bash
"exclude": ["assets", "jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
```

- tsconfig.spec.json change to module

```bash
"module": "module",
```

## Commands

```sh
npx create-nx-workspace@latest ai-marketing-agent --name=ai-marketing-agent --preset=apps --unitTestRunner=none --eslint=false --prettier=false --ci=skip --cache=true --packageManager=pnpm --defaultBase=main --useProjectJson=true --workspaces=true --workspaceType=integrated --tags=saas --no-interactive 

npx nx g @nx/node:app --directory=apps/services/marketing-service --framework=fastify --unitTestRunner=none --docker=true --packageManager=pnpm --tags=service --no-interactive

npx nx g @nx/node:lib --directory=libs/marketing-agent --unitTestRunner=jest --docker=true --packageManager=pnpm --tags=lib --no-interactive
npx nx g @nx/node:lib --directory=libs/node-cron-plugin --unitTestRunner=jest --docker=true --packageManager=pnpm --tags=lib --no-interactive
npx nx g @nx/node:lib --directory=libs/config-plugin --unitTestRunner=jest --docker=true --packageManager=pnpm --tags=lib --no-interactive

npx nx serve marketing-service

nx run-many --target=build --all
```