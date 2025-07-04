Get-ChildItem -Path . -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force
Get-ChildItem -Path . -Recurse -File -Filter "pnpm-lock.yaml" | Remove-Item -Force
Remove-Item -Recurse -Force tmp, .nx, dist