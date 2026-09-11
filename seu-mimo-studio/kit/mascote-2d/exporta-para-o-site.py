#!/usr/bin/env python3
"""Exporta as poses do mascote para os arquivos que o site usa.

O kit é a fonte da verdade: o site nunca guarda arte original, só as versões
recortadas e redimensionadas que ele precisa. Se a arte do mascote mudar aqui,
rode este programa de novo e os arquivos do site se atualizam.

    cd seu-mimo-studio/kit/mascote-2d
    python exporta-para-o-site.py

O que ele faz, para cada pose da lista abaixo:
  1. recorta a moldura transparente sobrando em volta do desenho, deixando uma
     folga pequena e igual nos quatro lados;
  2. grava em WebP, na largura de exibição (1x) e no dobro dela (@2x), que é o
     que o guardião exige para tela retina.

Precisa do Pillow:  python -m pip install pillow
"""
from pathlib import Path
from PIL import Image

AQUI = Path(__file__).resolve().parent
POSES = AQUI / "poses"
DESTINO = AQUI.parent.parent / "site" / "assets"

# pose do kit -> (nome no site, largura de exibição em 1x)
# a largura sai do tamanho máximo em que a imagem aparece na tela, para o @2x
# cobrir telas retina sem carregar pixel a mais.
EXPORTAR = [
    ("abracando-coracao.png",                  "mascote-abertura",  520),
    ("abracando-coracao-sorrindo-2.png",       "mascote-convite",   260),
    ("abracando-coracao-sereno-com-sombra.png", "mascote-perdido",  240),
]

FOLGA = 0.015  # 1,5% do lado maior, para o desenho não encostar na borda


def recorta(im: Image.Image) -> Image.Image:
    """Tira a transparência sobrando e devolve o desenho com folga igual em volta."""
    caixa = im.split()[3].point(lambda a: 255 if a > 8 else 0).getbbox()
    if caixa is None:
        raise SystemExit("a imagem está inteira transparente")
    im = im.crop(caixa)
    f = round(max(im.size) * FOLGA)
    fundo = Image.new("RGBA", (im.width + 2 * f, im.height + 2 * f), (0, 0, 0, 0))
    fundo.paste(im, (f, f))
    return fundo


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    for arquivo, nome, largura in EXPORTAR:
        origem = POSES / arquivo
        if not origem.exists():
            raise SystemExit(f"não achei {origem}")
        arte = recorta(Image.open(origem).convert("RGBA"))
        for sufixo, escala in (("", 1), ("@2x", 2)):
            w = largura * escala
            h = round(arte.height * w / arte.width)
            saida = DESTINO / f"{nome}{sufixo}.webp"
            arte.resize((w, h), Image.LANCZOS).save(saida, "WEBP", quality=90, method=6)
            print(f"  {saida.name:28s} {w}x{h}  {saida.stat().st_size // 1024} KB")
    # sem caractere especial: o console do Windows usa cp1252 e não engole "✓"
    print("\nOK: arte do mascote exportada do kit para o site")


if __name__ == "__main__":
    main()
