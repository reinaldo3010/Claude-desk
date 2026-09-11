#!/usr/bin/env python3
"""Recorta as poses soltas de dentro da folha de poses transparente.

A entrega trouxe as poses em prancha, e só uma delas veio como arquivo solto em alta
resolução. Este programa separa as células da prancha transparente em arquivos
individuais, para as poses pequenas poderem ser usadas como ornamento no site.

    cd seu-mimo-studio/kit/mascote-2d
    python colhe-da-folha.py

Cada célula sai com cerca de 250 px de lado. Isso serve para exibição de até ~120 px
em tela retina, e **não** serve para pose grande — para isso são necessários os
arquivos em alta do ilustrador (pendência da seção 8 do manual).

Precisa do Pillow:  python -m pip install pillow
"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
FOLHA = AQUI / "folha-de-poses-transparente.png"
DESTINO = AQUI / "colhidas-da-folha"

MIN_LADO = 60      # menor que isso é sujeira, não pose
FOLGA = 6          # margem transparente em volta do recorte


def componentes(alpha, limite=24):
    """Acha cada desenho separado da folha.

    Varredura por linhas e colunas não serve aqui: as poses se tocam de fileira em
    fileira (um braço invade a coluna vizinha) e quatro fileiras viram um bloco só.
    Então rotulamos componentes conexos de verdade, com busca em largura sobre uma
    versão reduzida da máscara — reduzir é o que mantém isto rápido — e as caixas
    voltam para a escala original no fim.
    """
    W, H = alpha.size
    ESC = 3                                     # rotula em 1/3 do tamanho
    w, h = W // ESC, H // ESC
    peq = alpha.resize((w, h), Image.NEAREST)
    px = peq.load()
    visto = bytearray(w * h)
    caixas = []

    for sy in range(h):
        for sx in range(w):
            if visto[sy * w + sx] or px[sx, sy] <= limite:
                continue
            fila = [(sx, sy)]
            visto[sy * w + sx] = 1
            x0 = x1 = sx
            y0 = y1 = sy
            while fila:
                cx, cy = fila.pop()
                if cx < x0: x0 = cx
                if cx > x1: x1 = cx
                if cy < y0: y0 = cy
                if cy > y1: y1 = cy
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and not visto[ny * w + nx] and px[nx, ny] > limite:
                        visto[ny * w + nx] = 1
                        fila.append((nx, ny))
            cx0, cy0 = x0 * ESC, y0 * ESC
            cx1, cy1 = min(W, (x1 + 1) * ESC), min(H, (y1 + 1) * ESC)
            if cx1 - cx0 >= MIN_LADO and cy1 - cy0 >= MIN_LADO:
                caixas.append((cx0, cy0, cx1, cy1))
    # de cima para baixo, da esquerda para a direita, como se lê
    caixas.sort(key=lambda c: (c[1] // 100, c[0]))
    return caixas


# Células onde o vizinho invadiu perto demais do corpo para a regra automática
# distinguir: nestas, todo bloco solto que encosta na borda sai. Conferido a olho,
# uma a uma, na prancha de conferência.
LIMPEZA_FORTE = {11, 17, 18, 21, 22}


def limpa_invasores(corte, forte=False):
    """Apaga pedaços de poses vizinhas que entraram no recorte.

    Na prancha as poses se tocam, então um pé ou uma ponta de laço do vizinho sobra
    dentro da célula. O que distingue invasor de desenho legítimo: o invasor **encosta
    na borda** do recorte e está **longe** do corpo principal. Linha de movimento,
    lâmpada e confete também são blocos soltos, mas ficam perto do corpo e não vêm
    coladas na borda — e por isso sobrevivem.
    """
    W, H = corte.size
    alpha = corte.split()[3]
    blocos = componentes(alpha, limite=24)
    if len(blocos) <= 1:
        return corte
    principal = max(blocos, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))
    perto = max(W, H) * 0.10
    apagar = []
    for b in blocos:
        if b is principal:
            continue
        encosta = b[0] <= 2 or b[1] <= 2 or b[2] >= W - 2 or b[3] >= H - 2
        dx = max(principal[0] - b[2], b[0] - principal[2], 0)
        dy = max(principal[1] - b[3], b[1] - principal[3], 0)
        longe = (dx * dx + dy * dy) ** 0.5 > perto
        if encosta and (longe or forte):
            apagar.append(b)
    if not apagar:
        return corte
    corte = corte.copy()
    vazio = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for x0, y0, x1, y1 in apagar:
        corte.paste(vazio.crop((x0, y0, x1, y1)), (x0, y0))
    return corte


def main() -> None:
    if not FOLHA.exists():
        raise SystemExit(f"nao achei {FOLHA}")
    DESTINO.mkdir(exist_ok=True)
    for antigo in DESTINO.glob("*.png"):
        antigo.unlink()

    folha = Image.open(FOLHA).convert("RGBA")
    caixas = componentes(folha.split()[3])
    print(f"{len(caixas)} recorte(s) na folha de {folha.width}x{folha.height}\n")

    for i, (x0, y0, x1, y1) in enumerate(caixas, 1):
        corte = limpa_invasores(folha.crop((x0, y0, x1, y1)), forte=i in LIMPEZA_FORTE)
        # reaperta na arte e devolve uma folga igual nos quatro lados
        caixa = corte.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
        if caixa is None:
            continue
        corte = corte.crop(caixa)
        fundo = Image.new("RGBA", (corte.width + 2 * FOLGA, corte.height + 2 * FOLGA), (0, 0, 0, 0))
        fundo.paste(corte, (FOLGA, FOLGA))
        nome = DESTINO / f"cel-{i:02d}.png"
        fundo.save(nome)
        print(f"  {nome.name}  {fundo.width}x{fundo.height}")

    print(f"\nOK: recortes em {DESTINO.name}/. Renomeie pelo que cada um mostra antes de usar.")


if __name__ == "__main__":
    main()
