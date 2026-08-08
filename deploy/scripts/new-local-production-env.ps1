[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$template = Join-Path $root '.env.production.example'
$destination = Join-Path $root '.env.production'

if (Test-Path -LiteralPath $destination) {
    Write-Host '.env.production already exists; left unchanged.'
    exit 0
}

function New-RandomToken([int]$bytes = 32) {
    $buffer = [byte[]]::new($bytes)
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }
    return [Convert]::ToBase64String($buffer).TrimEnd('=').Replace('+', 'A').Replace('/', 'b')
}

function Set-EnvValue([string]$content, [string]$name, [string]$value) {
    return [regex]::Replace($content, "(?m)^$([regex]::Escape($name))=.*$", "$name=$value")
}

$content = Get-Content -LiteralPath $template -Raw
$content = Set-EnvValue $content 'COMPOSE_PROJECT_NAME' 'tvu-student-project-portal-prod'
$content = Set-EnvValue $content 'DOMAIN' 'localhost'
$content = Set-EnvValue $content 'PROXY_BIND_IP' '127.0.0.1'
$content = Set-EnvValue $content 'LETSENCRYPT_EMAIL' 'local@example.invalid'
$content = Set-EnvValue $content 'MSSQL_PID' 'Developer'
$content = Set-EnvValue $content 'MSSQL_SA_PASSWORD' (('Lo1!' + (New-RandomToken 30)))
$content = Set-EnvValue $content 'JWT_SECRET' (New-RandomToken 48)
$content = Set-EnvValue $content 'RABBITMQ_USER' 'local_notification_worker'
$content = Set-EnvValue $content 'RABBITMQ_PASSWORD' (('Mq1!' + (New-RandomToken 30)))
$content = Set-EnvValue $content 'GRAFANA_ADMIN_PASSWORD' (('Gf1!' + (New-RandomToken 30)))
$content = Set-EnvValue $content 'DEPLOY_REF' 'local-only'

[IO.File]::WriteAllText($destination, $content, [Text.UTF8Encoding]::new($false))
Write-Host 'Created ignored .env.production with local-only generated secrets (values hidden).'
