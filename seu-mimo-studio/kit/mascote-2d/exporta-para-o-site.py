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
    ("abracando-coracao.png",                     "mascote-abertura", 520),
    ("abracando-coracao-sorrindo-2.png",          "mascote-convite",  260),
    ("abracando-coracao-sereno-com-sombra.png",   "mascote-perdido",  240),
    ("abracando-coracao-sorrindo-coracoes.png",   "mascote-empresas", 190),
    ("abracando-coracao-sereno-andando.png",      "mascote-duvidas",  190),
    ("abracando-coracao-sorrindo-3.png",          "mascote-vazio",    150),
]

# Ornamentos pequenos, colhidos da folha de poses por colhe-da-folha.py. A célula tem
# cerca de 250 px, então 120 px de exibição é o teto: a @2x fica em 240 px e ainda cabe
# no que existe. Pose grande só com arquivo em alta do ilustrador.
ORNAMENTOS = [
    ("cel-20.png", "pose-ideia"),       # com a lâmpada acesa
    ("cel-13.png", "pose-entregando"),  # entregando um presente
    ("cel-21.png", "pose-carta"),       # com um cartão nas mãos
    ("cel-25.png", "pose-comemorando"), # comemorando, com confete
    ("cel-19.png", "pose-dormindo"),    # deitada, dormindo
    ("cel-24.png", "pose-de-costas"),   # de costas
    ("cel-05.png", "pose-apaixonada"),  # olhos de coração
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


def grava(origem: Path, nome: str, largura: int) -> None:
    """Grava a versão 1x e a maior que a arte aguentar, sem nunca ampliar.

    Ampliar é o que deixa a imagem macia sem o guardião perceber: o arquivo fica com os
    pixels pedidos, só que inventados. Então o programa olha quanto pixel a arte tem e
    escolhe o maior descritor honesto — 3x se couber, 2x se não. Se nem 2x couber, a
    largura de exibição encolhe até caber.

    Imprime a linha de srcset pronta para colar no HTML.
    """
    if not origem.exists():
        raise SystemExit(f"não achei {origem}")
    arte = recorta(Image.open(origem).convert("RGBA"))
    dens = 3 if arte.width >= largura * 3 else 2
    if arte.width < largura * 2:
        largura = arte.width // 2
        print(f"  (a arte de {nome} tem {arte.width}px: exibir a {largura}px)")
    saidas = []
    for sufixo, w in (("", largura), (f"@{dens}x", largura * dens)):
        h = round(arte.height * w / arte.width)
        saida = DESTINO / f"{nome}{sufixo}.webp"
        arte.resize((w, h), Image.LANCZOS).save(saida, "WEBP", quality=90, method=6)
        saidas.append((saida, w, h))
    a, b = saidas
    print(f"  {a[0].name:26s} {a[1]}x{a[2]}   +{b[0].name}  ({b[1]}x{b[2]})")
    print(f'      srcset="assets/{a[0].name} 1x, assets/{b[0].name} {dens}x" width="{a[1]}" height="{a[2]}"')


def grava_ornamento(origem: Path, nome: str) -> None:
    """Ornamento pequeno: aparece a um terço da arte, e o arquivo cheio entra como 3x.

    O recorte da folha tem pouco pixel. Exibi-lo maior do que é sairia macio num celular
    retina, então ele ocupa um terço e a tela de 3x recebe pixel de verdade.
    """
    if not origem.exists():
        raise SystemExit(f"não achei {origem}")
    arte = recorta(Image.open(origem).convert("RGBA"))
    saidas = []
    for sufixo, w in (("", arte.width // 3), ("@3x", arte.width)):
        h = round(arte.height * w / arte.width)
        saida = DESTINO / f"{nome}{sufixo}.webp"
        arte.resize((w, h), Image.LANCZOS).save(saida, "WEBP", quality=90, method=6)
        saidas.append((saida, w, h))
    a, b = saidas
    print(f"  {a[0].name:26s} {a[1]}x{a[2]}   +{b[0].name}  ({b[1]}x{b[2]})")
    print(f'      srcset="assets/{a[0].name} 1x, assets/{b[0].name} 3x" width="{a[1]}" height="{a[2]}"')


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    print("poses grandes:")
    for arquivo, nome, largura in EXPORTAR:
        grava(POSES / arquivo, nome, largura)
    print()
    print("ornamentos colhidos da folha (exibir no tamanho 1x impresso abaixo):")
    for arquivo, nome in ORNAMENTOS:
        grava_ornamento(AQUI / "colhidas-da-folha" / arquivo, nome)
    # sem caractere especial: o console do Windows usa cp1252 e não engole "✓"
    print("\nOK: arte do mascote exportada do kit para o site")


if __name__ == "__main__":
    main()
