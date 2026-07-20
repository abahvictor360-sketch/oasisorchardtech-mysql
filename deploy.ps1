# deploy.ps1 — build and push to hostinger-deploy branch on GitHub
# Run with: npm run deploy
$ErrorActionPreference = "Stop"

# Capture git identity from the current repo before we leave its directory
$gitUser  = git config user.name
$gitEmail = git config user.email
$remote   = git remote get-url origin
$sha      = git rev-parse --short HEAD 2>$null

Write-Host "`n==> Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

Write-Host "`n==> Assembling deploy folder..." -ForegroundColor Cyan
if (Test-Path "deploy") { Remove-Item -Recurse -Force "deploy" }
New-Item -ItemType Directory -Path "deploy\api" -Force | Out-Null

Copy-Item -Path "dist\*" -Destination "deploy\" -Recurse

# Copy entire api/ folder, excluding secrets that must never be deployed
Copy-Item -Path "api\*" -Destination "deploy\api\" -Recurse -Exclude "oasis-config.php"

Write-Host "`n==> Pushing to hostinger-deploy branch..." -ForegroundColor Cyan
Push-Location deploy
try {
    git init -b hostinger-deploy
    git config user.name  $gitUser
    git config user.email $gitEmail
    git add -A
    git commit -m "Deploy $sha $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    git remote add origin $remote
    git push -f origin hostinger-deploy
    Write-Host "`nDone! Hostinger will pull the new build automatically." -ForegroundColor Green
} finally {
    Pop-Location
}
