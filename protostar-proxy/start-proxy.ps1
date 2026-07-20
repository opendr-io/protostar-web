# Starts (or reloads) the protostar-proxy Caddy.
#
# Coraza mode is a runtime toggle for troubleshooting:
#   .\start-proxy.ps1                      # start, WAF enforcing (On)
#   .\start-proxy.ps1 -CorazaMode DetectionOnly -Reload   # log-not-block, hot reload
#   .\start-proxy.ps1 -CorazaMode Off -Reload             # WAF bypassed
#
# (Env placeholders are not honored inside Coraza's `directives` block, so the
# mode is applied by patching the SecRuleEngine line and reloading via the admin
# API on localhost:2019 — no dropped connections.)
param(
    [ValidateSet('On', 'DetectionOnly', 'Off')]
    [string]$CorazaMode = 'On',
    [switch]$Reload
)
$ErrorActionPreference = 'Stop'
$here  = $PSScriptRoot
$caddy = Join-Path $here 'caddy.exe'
$conf  = Join-Path $here 'Caddyfile'

if (-not (Test-Path $caddy)) { Write-Error "caddy.exe not found. Run .\build-proxy.ps1 first." }

# Caddy resolves relative `root` paths against its working dir — run from here so
# ../protostar-react/dist etc. resolve regardless of where the script is invoked.
Set-Location $here

# Gate credential: the Caddyfile ships with a __GATE__ placeholder (no password by
# default). Prompt for a username/password on first run and write the hashed
# credential in. Skip entirely if a real credential is already present.
if ((Get-Content $conf -Raw) -match '__GATE__') {
    Write-Host "No perimeter-gate credential set. Enter one to populate the Caddyfile:"
    $user = Read-Host "  Gate username"
    $secure = Read-Host "  Gate password" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $hash = (& $caddy hash-password --plaintext $plain | Out-String).Trim()
    # .Replace (not -replace) so the '$' in the bcrypt hash isn't treated as a regex backreference
    ((Get-Content $conf -Raw).Replace('__GATE__', "$user $hash")) | Set-Content $conf -Encoding utf8
    Write-Host "  Gate credential written to the Caddyfile (user: $user)."
}

# Apply the Coraza mode.
(Get-Content $conf -Raw) -replace 'SecRuleEngine (On|DetectionOnly|Off)', "SecRuleEngine $CorazaMode" |
    Set-Content $conf -Encoding utf8

if ($Reload) {
    & $caddy reload --config $conf --address localhost:2019
    Write-Host "Reloaded proxy (Coraza=$CorazaMode)."
}
else {
    Write-Host "Starting proxy (Coraza=$CorazaMode) on https://localhost:8443 (all interfaces). Ctrl+C to stop."
    & $caddy run --config $conf
}
