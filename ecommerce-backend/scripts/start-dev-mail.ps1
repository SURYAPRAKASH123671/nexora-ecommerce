param(
    [Parameter(Mandatory = $true)]
    [string] $MailUsername,

    [Parameter(Mandatory = $false)]
    [string] $MailPassword,

    [Parameter(Mandatory = $false)]
    [string] $MailFrom = $MailUsername,

    [Parameter(Mandatory = $false)]
    [string] $DbUrl = "jdbc:mysql://localhost:3307/nexora_store?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",

    [Parameter(Mandatory = $false)]
    [string] $DbUsername = "nexora_app",

    [Parameter(Mandatory = $false)]
    [string] $DbPassword = "NexoraDev123",

    [Parameter(Mandatory = $false)]
    [string] $LogPath = ".\logs\dev-mail.log"
)

if ([string]::IsNullOrWhiteSpace($MailPassword)) {
    $securePassword = Read-Host "Gmail app password" -AsSecureString
    $credential = [System.Management.Automation.PSCredential]::new("smtp", $securePassword)
    $MailPassword = $credential.GetNetworkCredential().Password
}

$env:DB_URL = $DbUrl
$env:DB_USERNAME = $DbUsername
$env:DB_PASSWORD = $DbPassword
$env:JPA_DDL_AUTO = "update"

$env:MAIL_ENABLED = "true"
$env:MAIL_HOST = "smtp.gmail.com"
$env:MAIL_PORT = "587"
$env:MAIL_USERNAME = $MailUsername
$env:MAIL_PASSWORD = $MailPassword
$env:MAIL_FROM = $MailFrom
$env:MAIL_SMTP_AUTH = "true"
$env:MAIL_SMTP_STARTTLS = "true"

Write-Host "Starting Nexora backend with MySQL and Gmail SMTP enabled..." -ForegroundColor Green
Write-Host "Database: $DbUsername@$DbUrl" -ForegroundColor Cyan
Write-Host "Mail from: $MailFrom" -ForegroundColor Cyan

$logDirectory = Split-Path -Parent $LogPath
if ($logDirectory) {
    New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
}

.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev,mail" 2>&1 | Tee-Object -FilePath $LogPath
