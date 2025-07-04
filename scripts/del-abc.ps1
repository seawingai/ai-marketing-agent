Get-Process node | Stop-Process -Force
Get-ChildItem -Path "C:\data\seawingai\git" -Directory -Filter "abc*" | Remove-Item -Recurse -Force 