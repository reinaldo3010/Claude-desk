<#
.SYNOPSIS
  Instala o Claude Deck no Windows.

.DESCRIPTION
  Faz o mínimo necessário e conta o que fez:
    1. confere Node 18+
    2. registra statusLine e hooks no ~/.claude/settings.json (com backup)
    3. descobre a janela do Claude Code e sugere o DECK_TARGET
    4. libera a porta no firewall
    5. cria o atalho de inicialização, se você pedir

  Nada aqui é irreversível: `node bin\claude-deck.js uninstall` desfaz o
  passo 2, e o backup do settings.json fica ao lado do original.

.EXAMPLE
  .\instalar.ps1
  .\instalar.ps1 -Porta 8788 -Inicializar
#>
param(
  [int]$Porta = 8788,
  [switch]$Inicializar,
  [switch]$Portao,
  [switch]$SemFirewall
)

$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $PSScriptRoot

function Titulo($t) { Write-Host "`n  $t" -ForegroundColor Cyan; Write-Host "  $('─' * 54)" -ForegroundColor DarkGray }
function Ok($t)     { Write-Host "  [ok] $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "  [!]  $t" -ForegroundColor Yellow }
function Erro($t)   { Write-Host "  [x]  $t" -ForegroundColor Red }

Titulo "Claude Deck — instalação"

# --- 1. Node -----------------------------------------------------------------
try {
  $v = (node --version) -replace 'v',''
  $maior = [int]($v -split '\.')[0]
  if ($maior -lt 18) { Erro "Node $v encontrado; o deck precisa da versão 18 ou superior."; exit 1 }
  Ok "Node $v"
} catch {
  Erro "Node não encontrado no PATH. Instale em https://nodejs.org e abra um terminal novo."
  exit 1
}

# --- 2. settings.json --------------------------------------------------------
$argsInstall = @("$raiz\bin\claude-deck.js", "install")
if ($Portao) { $argsInstall += "--gate" }
$env:DECK_PORT = $Porta
& node @argsInstall
if ($LASTEXITCODE -ne 0) { Erro "A instalação no settings.json falhou."; exit 1 }

# --- 3. janela alvo ----------------------------------------------------------
Titulo "Janela do Claude Code"
$janelas = Get-Process | Where-Object { $_.MainWindowTitle -ne '' } |
  Select-Object -First 15 @{n='Alvo';e={"ahk_exe $($_.ProcessName).exe"}}, MainWindowTitle
if ($janelas) {
  $janelas | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "  Copie o valor da coluna Alvo da janela onde você roda o Claude Code." -ForegroundColor DarkGray
} else {
  Aviso "Nenhuma janela com título encontrada. Abra o Claude Code e rode de novo."
}

$alvo = Read-Host "  DECK_TARGET (Enter para 'ahk_exe WindowsTerminal.exe')"
if ([string]::IsNullOrWhiteSpace($alvo)) { $alvo = "ahk_exe WindowsTerminal.exe" }

# --- 4. AutoHotkey -----------------------------------------------------------
$ahk = "C:\Program Files\AutoHotkey\v2\AutoHotkey.exe"
if (Test-Path $ahk) { Ok "AutoHotkey v2 em $ahk" }
else { Aviso "AutoHotkey v2 não encontrado. Baixe em https://autohotkey.com — sem ele os botões de digitar não funcionam (o resto do painel funciona)." }

# --- 5. configuração local ---------------------------------------------------
$cfg = @{ port = $Porta; target = $alvo } | ConvertTo-Json
Set-Content -Path "$raiz\deck.config.json" -Value $cfg -Encoding UTF8
Ok "deck.config.json gravado (fora do git, é só desta máquina)"

# --- 6. firewall -------------------------------------------------------------
if (-not $SemFirewall) {
  Titulo "Firewall"
  try {
    $regra = Get-NetFirewallRule -DisplayName "ClaudeDeck" -ErrorAction SilentlyContinue
    if ($regra) { Ok "regra ClaudeDeck já existe" }
    else {
      New-NetFirewallRule -DisplayName "ClaudeDeck" -Direction Inbound -Action Allow `
        -Protocol TCP -LocalPort $Porta -Profile Private | Out-Null
      Ok "porta $Porta liberada apenas no perfil de rede Privada"
    }
  } catch {
    Aviso "Não consegui criar a regra (precisa de PowerShell como administrador)."
    Write-Host "     netsh advfirewall firewall add rule name=`"ClaudeDeck`" dir=in action=allow protocol=TCP localport=$Porta profile=private" -ForegroundColor DarkGray
  }
}

# --- 7. inicialização automática --------------------------------------------
if ($Inicializar) {
  $startup = [Environment]::GetFolderPath('Startup')
  $atalho = Join-Path $startup "ClaudeDeck.lnk"
  $ws = New-Object -ComObject WScript.Shell
  $lnk = $ws.CreateShortcut($atalho)
  $lnk.TargetPath = "powershell.exe"
  $lnk.Arguments = "-WindowStyle Hidden -NoProfile -Command `"cd '$raiz'; node bin\claude-deck.js start`""
  $lnk.WorkingDirectory = $raiz
  $lnk.Save()
  Ok "atalho criado em $atalho"
}

Titulo "Pronto"
Write-Host "  1. Reinicie o Claude Code (os hooks só valem em sessão nova)."
Write-Host "  2. node bin\claude-deck.js doctor    confere se ficou tudo de pé"
Write-Host "  3. node bin\claude-deck.js start     sobe o painel"
Write-Host ""
