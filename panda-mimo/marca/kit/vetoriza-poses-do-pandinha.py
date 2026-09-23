"""
Vetoriza as 20 poses do Pandinha de profissões e paixões para o kit (manual 13.5).

Segue o processo dos traçados que já estão em `svg/` (ver `LEIAME.md`, "Como os vetores foram feitos"):
a borda é endurecida antes do traçado (o que tem menos de 50% de opacidade vira transparente), o
vtracer traça em camadas de cor empilhadas, e cada arquivo fica com o traçado **mais leve** que ainda
reproduz o original: renderizado de volta e comparado pixel a pixel, 24 dB de PSNR ou mais na área com
tinta e mais de 98% de coincidência de silhueta.

Uma diferença, dita às claras: os traçados antigos saíram de uma ampliação 2x por super-resolução
(Real-ESRGAN), porque a fonte tinha uns 800 px. Estes mestres já têm 1100 a 1300 px e a ferramenta de
super-resolução não está nesta máquina, então o traçado sai da resolução nativa.

As aquarelas não entram: aquarela é como fotografia, e o PNG mestre é o arquivo de referência.

Rodar de panda-mimo/:   python marca/kit/vetoriza-poses-do-pandinha.py   (uma pose só: ... panda-yoga)
Saídas: `marca/kit/svg/pandinha-temas/<pose>.svg` e a tabela de fidelidade no fim de `fidelidade.md`.
"""
import io
import re
import sys
from pathlib import Path

import numpy as np
import resvg_py
import vtracer
from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
KIT = RAIZ / 'marca' / 'kit'
DESTINO = KIT / 'svg' / 'pandinha-temas'
FIDELIDADE = KIT / 'fidelidade.md'
PSNR_MINIMO = 24.0
SILHUETA_MINIMA = 0.98

# do mais leve para o mais fino: fica o primeiro que passa. Medido em 23/09/2026 na pose do yoga:
# 'fino' dá 23,0 dB (1,3 MB) e só 'extrafino' passa, com 26,0 dB e 3,5 MB — por isso ficou a decisão
# com o dono (manual 13.5).
TRACADOS = {
    'leve': dict(filter_speckle=8, color_precision=5, layer_difference=24, corner_threshold=60,
                 length_threshold=5.0, max_iterations=10, splice_threshold=45, path_precision=2),
    'medio': dict(filter_speckle=4, color_precision=6, layer_difference=16, corner_threshold=60,
                  length_threshold=4.0, max_iterations=10, splice_threshold=45, path_precision=3),
    'fino': dict(filter_speckle=2, color_precision=7, layer_difference=8, corner_threshold=45,
                 length_threshold=3.5, max_iterations=10, splice_threshold=45, path_precision=3),
    'extrafino': dict(filter_speckle=1, color_precision=8, layer_difference=4, corner_threshold=45,
                      length_threshold=3.5, max_iterations=10, splice_threshold=45, path_precision=3),
}


def poses():
    """As poses do Pandinha na lista do preparador, para as duas listas não se desencontrarem."""
    texto = (KIT / 'prepara-imagens-do-estudio.py').read_text(encoding='utf-8')
    return re.findall(r"\('(pandinha-temas-20/[a-z0-9-]+)', '(panda-[a-z]+)'\)", texto)


def endurece(imagem):
    rgba = np.asarray(imagem.convert('RGBA')).copy()
    opaco = rgba[..., 3] >= 128
    rgba[..., 3] = np.where(opaco, 255, 0)
    rgba[~opaco, :3] = 0
    return Image.fromarray(rgba, 'RGBA')


def compara(fonte, svg):
    largura, altura = fonte.size
    png = resvg_py.svg_to_bytes(svg_string=svg, width=largura, height=altura)
    volta = np.asarray(Image.open(io.BytesIO(bytes(png))).convert('RGBA')).astype(float)
    ref = np.asarray(fonte).astype(float)
    tinta = ref[..., 3] > 128
    mse = ((ref[..., :3][tinta] - volta[..., :3][tinta]) ** 2).mean()
    psnr = 10 * np.log10(255 ** 2 / max(mse, 1e-9))
    a, b = tinta, volta[..., 3] > 128
    silhueta = (a & b).sum() / max((a | b).sum(), 1)
    return psnr, silhueta


def vetoriza(so=None):
    DESTINO.mkdir(parents=True, exist_ok=True)
    linhas = []
    for mestre, nome in poses():
        if so and nome != so:
            continue
        fonte = endurece(Image.open(KIT / 'png' / f'{mestre}.png'))
        buffer = io.BytesIO()
        fonte.save(buffer, 'PNG')
        escolhido = None
        for rotulo, ajuste in TRACADOS.items():
            svg = vtracer.convert_raw_image_to_svg(buffer.getvalue(), img_format='png', colormode='color',
                                                   hierarchical='stacked', mode='spline', **ajuste)
            psnr, silhueta = compara(fonte, svg)
            escolhido = (rotulo, svg, psnr, silhueta)
            if psnr >= PSNR_MINIMO and silhueta >= SILHUETA_MINIMA:
                break
        rotulo, svg, psnr, silhueta = escolhido
        passou = psnr >= PSNR_MINIMO and silhueta >= SILHUETA_MINIMA
        (DESTINO / f'{nome}.svg').write_text(svg, encoding='utf-8')
        tamanho = (DESTINO / f'{nome}.svg').stat().st_size / 1024 / 1024
        linhas.append(f'| `pandinha-temas/{nome}.svg` | Pandinha, profissões e paixões | mestre nativo · {fonte.width}×{fonte.height} px '
                      f'| {rotulo} | {tamanho:.1f} MB | {psnr:.1f} dB | {silhueta * 100:.1f}% |' + ('' if passou else ' **abaixo do mínimo** |'))
        print(f'  {nome:22} {rotulo:5} {psnr:5.1f} dB  silhueta {silhueta * 100:5.1f}%  {tamanho:4.1f} MB' + ('' if passou else '  ABAIXO DO MÍNIMO'))
    return linhas


def registra(linhas):
    texto = FIDELIDADE.read_text(encoding='utf-8')
    marca = '\n## Poses de profissões e paixões (23/09/2026)\n'
    texto = texto.split(marca)[0].rstrip('\n') + '\n' + marca + (
        '\nTraçadas da resolução nativa do mestre (sem a ampliação por super-resolução dos traçados antigos),\n'
        'com o mesmo critério: o traçado mais leve que passa de 24 dB na tinta e 98% de silhueta.\n\n'
        '| Arquivo | Grupo | Fonte | Traçado | Tamanho | PSNR na tinta | Silhueta |\n'
        '|---|---|---|---|---|---|---|\n' + '\n'.join(linhas) + '\n')
    FIDELIDADE.write_text(texto, encoding='utf-8', newline='\n')


if __name__ == '__main__':
    # Com o nome de uma pose (ex.: panda-yoga), traça só ela e não mexe na tabela de fidelidade.
    if len(sys.argv) > 1:
        vetoriza(sys.argv[1])
    else:
        registra(vetoriza())
