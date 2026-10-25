# Windows equivalent of deploy.sh: build locally, upload the build, restart the service on the server.
# Requires ssh/scp/tar on PATH (bundled with Git for Windows or Windows 10+ OpenSSH).
# Usage: powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# load only the DEPLOY_SCRIPT_* values from .env
$envVars = @{}
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*(DEPLOY_SCRIPT_[A-Z_]+)\s*=\s*(.*)$') {
        $value = ($Matches[2] -replace '\s+#.*$', '').Trim().Trim('"').Trim("'")
        $envVars[$Matches[1]] = $value
    }
}

$sshHost = $envVars['DEPLOY_SCRIPT_SSH_HOST']
$baseDir = $envVars['DEPLOY_SCRIPT_BASE_DIR']
$sshUser = $envVars['DEPLOY_SCRIPT_SSH_USER']
if (-not $sshHost -or -not $baseDir) {
    Write-Error 'DEPLOY_SCRIPT_SSH_HOST and DEPLOY_SCRIPT_BASE_DIR must be set in .env'
}
$target = if ($sshUser) { "$sshUser@$sshHost" } else { $sshHost }

pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Build failed. Exiting.'
    exit 1
}

# rsync isn't available on Windows, so ship everything as one tarball
$archive = 'wa-bot-release.tar.gz'
tar -czf $archive dist package.json pnpm-lock.yaml pnpm-workspace.yaml start-app.sh wa-bot.service
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Failed to create release archive. Exiting.'
    exit 1
}

try {
    ssh $target "mkdir -p $baseDir && rm -rf $baseDir/dist"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to prepare remote directory.' }

    scp $archive "${target}:$baseDir/$archive"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to upload release archive.' }

    # sed strips CRLF in case the scripts were checked out with Windows line endings
    $remoteCmd = @(
        "cd $baseDir",
        "tar -xzf $archive",
        "rm -f $archive",
        'sed -i ''s/\r$//'' start-app.sh wa-bot.service',
        '(rm /etc/systemd/system/wa-bot.service 2>/dev/null || true)',
        'source $HOME/.nvm/nvm.sh',
        'export CI=true',
        'pnpm i',
        'chmod +x start-app.sh',
        "sudo ln -sf $baseDir/wa-bot.service /etc/systemd/system/wa-bot.service",
        'sudo systemctl daemon-reload',
        'sudo systemctl restart wa-bot'
    ) -join ' && '
    ssh $target $remoteCmd
    if ($LASTEXITCODE -ne 0) { throw 'Failed to restart the service.' }
}
catch {
    Write-Host "$_ Exiting."
    exit 1
}
finally {
    Remove-Item -Force $archive -ErrorAction SilentlyContinue
}

Write-Host 'Deployment successful and service restarted.'
