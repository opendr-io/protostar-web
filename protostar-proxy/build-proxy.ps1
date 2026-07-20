# Downloads a plugin-enabled Caddy (Coraza WAF + rate-limit) into this folder.
#
# We fetch a standalone binary from Caddy's download server rather than
# `caddy add-package`, because add-package tries to replace the system binary
# in-place (C:\ProgramData\chocolatey\...) which needs admin on Windows.
# The proxy runs THIS binary; the host's Chocolatey Caddy is left untouched.
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$out  = Join-Path $here 'caddy.exe'

$plugins = @(
    'github.com/corazawaf/coraza-caddy/v2'
    'github.com/mholt/caddy-ratelimit'
) -join '&p='
$url = "https://caddyserver.com/api/download?os=windows&arch=amd64&p=$plugins"

Write-Host "Downloading plugin-enabled Caddy (Coraza + rate-limit)..."
Invoke-WebRequest -Uri $url -OutFile $out
Write-Host "Modules present:"
& $out list-modules | Select-String -Pattern 'http.handlers.waf|http.handlers.rate_limit'

# OWASP Core Rule Set — the WAF rules the Caddyfile Includes. Downloaded and
# gitignored (not vendored), same as caddy.exe above. Pinned to a release version.
$crsVersion = '4.28.0'
$crsDir = Join-Path $here "coreruleset-$crsVersion"
if (-not (Test-Path (Join-Path $crsDir 'crs-setup.conf'))) {
    Write-Host "Downloading OWASP CRS $crsVersion..."
    $crsZip = Join-Path $here "crs-$crsVersion.zip"
    $crsUrl = "https://github.com/coreruleset/coreruleset/releases/download/v$crsVersion/coreruleset-$crsVersion-minimal.zip"
    Invoke-WebRequest -Uri $crsUrl -OutFile $crsZip
    Expand-Archive -Path $crsZip -DestinationPath $here -Force   # zip's top dir is coreruleset-$crsVersion
    Remove-Item $crsZip
    # crs-setup.conf ships as .example; the Caddyfile Includes crs-setup.conf
    Copy-Item (Join-Path $crsDir 'crs-setup.conf.example') (Join-Path $crsDir 'crs-setup.conf')
    Write-Host "  CRS installed -> $crsDir"
} else {
    Write-Host "OWASP CRS $crsVersion already present."
}

# Self-signed TLS cert. A bare-port site with `tls internal` can't present a cert
# for the client's SNI, so we pin an explicit cert with SANs. This auto-includes
# localhost, the machine hostname, loopback, and the primary LAN IP so it works
# for network access. CA:TRUE makes it importable into a trust store (no warning).
$cert = Join-Path $here 'tls-cert.pem'
$key  = Join-Path $here 'tls-key.pem'
if (-not (Test-Path $cert)) {
    $hn = [System.Net.Dns]::GetHostName()
    $lan = Get-NetIPAddress -AddressFamily IPv4 -EA SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
        Select-Object -First 1 -ExpandProperty IPAddress
    $san = "DNS:localhost,DNS:$hn,IP:127.0.0.1,IP:0:0:0:0:0:0:0:1"
    if ($lan) { $san += ",IP:$lan" }
    Write-Host "Generating self-signed TLS cert (CN=$hn, SANs: $san)..."
    $env:MSYS_NO_PATHCONV = '1'  # keep mingw openssl from mangling /CN= and IP: args
    & openssl req -x509 -newkey rsa:2048 -nodes -keyout $key -out $cert -days 825 `
        -subj "/CN=$hn" `
        -addext "basicConstraints=critical,CA:TRUE" `
        -addext "subjectAltName=$san"
}
Write-Host "Done -> $out (+ tls-cert.pem/tls-key.pem)"
