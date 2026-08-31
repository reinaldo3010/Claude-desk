#Requires AutoHotkey v2.0
#SingleInstance Off
; =============================================================================
; Claude Deck — injetor de teclas (Windows)
; -----------------------------------------------------------------------------
; Chamado pelo servidor, uma vez por ação:
;
;   AutoHotkey.exe claude-deck.ahk keys "ahk_exe WindowsTerminal.exe" "1{Enter}"
;   AutoHotkey.exe claude-deck.ahk text "ahk_exe WindowsTerminal.exe" "/compact"
;
; Códigos de saída (o servidor mostra a mensagem crua no painel):
;   0  digitou
;   2  argumentos faltando
;   3  janela alvo não encontrada
;   4  não consegui trazer a janela para frente
;
; A regra mais importante deste arquivo: se a janela alvo não existe, SAI COM
; ERRO. Nunca digita "por perto". Um deck que manda "1{Enter}" para a janela
; errada é pior do que um deck que não faz nada.
; =============================================================================

if A_Args.Length < 3 {
    FileAppend "claude-deck: uso: <keys|text> <alvo> <conteudo>`n", "**"
    ExitApp 2
}

mode    := A_Args[1]
target  := A_Args[2]
payload := A_Args[3]

; A janela precisa existir ANTES de qualquer tecla sair daqui.
if !WinExist(target) {
    FileAppend "claude-deck: janela nao encontrada: " target "`n", "**"
    ExitApp 3
}

try {
    WinActivate target
    ; Espera o foco de verdade: sem isso as primeiras teclas se perdem no
    ; caminho, e "1{Enter}" pode virar só "{Enter}" — aprovando o que não devia.
    if !WinWaitActive(target, , 2) {
        FileAppend "claude-deck: a janela nao ganhou foco em 2s`n", "**"
        ExitApp 4
    }
} catch as err {
    FileAppend "claude-deck: falha ao ativar: " err.Message "`n", "**"
    ExitApp 4
}

Sleep 60  ; respiro para o terminal assumir o foco

if (mode = "text") {
    ; SendText trata o conteúdo como literal: chaves, sinais e acentos vão
    ; como estão, sem virar comando do AutoHotkey.
    SendText payload
    Sleep 40
    Send "{Enter}"
} else {
    ; Modo keys: aqui a notação do AutoHotkey vale ({Enter}, +{Tab}, ^c).
    ; O servidor já validou o conteúdo contra uma lista de caracteres permitidos.
    Send payload
}

ExitApp 0
