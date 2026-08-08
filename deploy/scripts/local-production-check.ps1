[CmdletBinding()]
param(
    [switch]$Build,
    [switch]$Start
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = Join-Path $root '.env.production'
$composeFile = Join-Path $root 'docker-compose.production.yml'

if (-not (Test-Path -LiteralPath $envFile -PathType Leaf)) {
    throw 'Missing .env.production. Copy .env.production.example and configure local-only values.'
}

$values = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
    $name, $value = $line -split '=', 2
    $values[$name.Trim()] = $value.Trim()
}

$required = @('DOMAIN', 'MSSQL_SA_PASSWORD', 'JWT_SECRET', 'RABBITMQ_USER', 'RABBITMQ_PASSWORD')
$placeholderPattern = '(?i)(replace-with|change-me|changeme|example-password|your-secret)'
$invalid = @($required | Where-Object {
    -not $values.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($values[$_]) -or $values[$_] -match $placeholderPattern
})
if ($invalid.Count -gt 0) {
    throw ('Missing or placeholder production variables: ' + ($invalid -join ', '))
}

if ($values['MSSQL_SA_PASSWORD'].Length -lt 12) { throw 'MSSQL_SA_PASSWORD must be at least 12 characters.' }
if ($values['JWT_SECRET'].Length -lt 32) { throw 'JWT_SECRET must be at least 32 characters.' }
if ($values['RABBITMQ_PASSWORD'].Length -lt 16) { throw 'RABBITMQ_PASSWORD must be at least 16 characters.' }
if ($values['DOMAIN'] -notmatch '^[A-Za-z0-9.-]+$') { throw 'DOMAIN contains unsupported characters.' }

$compose = @('compose', '--env-file', $envFile, '-f', $composeFile)
Push-Location $root
try {
    Write-Host 'Validated required production variables (values hidden).'
    & docker @compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'docker compose config failed.' }
    Write-Host 'Compose config: PASS'

    if ($Build) {
        & docker @compose build --no-cache
        if ($LASTEXITCODE -ne 0) { throw 'docker compose build failed.' }
        Write-Host 'Compose build: PASS'
    }

    if ($Start) {
        if ($values['DOMAIN'] -eq 'localhost') {
            $certificateCommand = 'set -eu; d=/etc/letsencrypt/live/localhost; if [ ! -s "$d/fullchain.pem" ] || [ ! -s "$d/privkey.pem" ]; then mkdir -p "$d"; openssl req -x509 -nodes -newkey rsa:3072 -days 365 -keyout "$d/privkey.pem" -out "$d/fullchain.pem" -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" >/dev/null 2>&1; fi'
            & docker @compose run --rm --no-deps --entrypoint /bin/sh certbot -c $certificateCommand
            if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the local TLS certificate.' }
            Write-Host 'Local TLS certificate: READY'
        }
        & docker @compose up -d
        if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed.' }
        & docker @compose ps
    }
}
finally {
    Pop-Location
}
