param(
  [string]$CatalogPath = (Join-Path $PSScriptRoot '..\app\catalog.ts'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\product-image-search-results.json')
)

$ErrorActionPreference = 'Stop'
$source = Get-Content -Raw -LiteralPath $CatalogPath
$matches = [regex]::Matches($source, '(?m)^\s+\["([^"]+)",')
if ($matches.Count -ne 80) {
  throw "Expected 80 products, found $($matches.Count)"
}

$results = [ordered]@{}
$index = 0
foreach ($match in $matches) {
  $index++
  $name = $match.Groups[1].Value
  $query = [uri]::EscapeDataString("$name product photo")
  $html = (Invoke-WebRequest -UseBasicParsing -Uri "https://www.bing.com/images/search?q=$query&form=HDRSC2" -TimeoutSec 25).Content
  $imageMatch = [regex]::Match($html, 'murl&quot;:&quot;(.*?)&quot;')
  if (-not $imageMatch.Success) {
    throw "No product image result for $name"
  }
  $results[$name] = [Net.WebUtility]::HtmlDecode($imageMatch.Groups[1].Value)
  Write-Output "[$('{0:d2}' -f $index)/80] resolved $name"
  Start-Sleep -Milliseconds 120
}

$results | ConvertTo-Json | Set-Content -LiteralPath $OutputPath -Encoding utf8
