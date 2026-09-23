"""
Prepara as imagens do acervo ilustrado para o estúdio da caneca.

Mestres (PNG com alpha, gerados a pedido do dono em 22/09/2026 e aprovados para as canecas em
23/09/2026). Ficam no kit, que não é publicado:
  marca/kit/png/pandinha-temas-20/   20 poses do Pandinha (profissões e paixões)
  marca/kit/png/pandinha-temas-35/   mais 35 poses e 4 adesivos (laço, coração, margaridas, presente)
  marca/kit/png/piloto-aquarela/     6 ilustrações em aquarela

Saídas, publicadas com o site:
  assets/panda-<tema>.webp          a pose inteira, na resolução do mestre (nada é ampliado)
  assets/aquarela-<nome>.webp       idem
  assets/mini/<mesmo nome>.webp     320 px no lado maior, para a miniatura da lista e as grades
  simulador/imagens-do-acervo.js    tabela gerada com o tamanho real de toda imagem que o estúdio usa

O recorte tira a sobra transparente e devolve uma folga igual em volta (2% do lado maior). É o que
faz a caixa de seleção do estúdio abraçar o desenho: a caixa segue a proporção do arquivo, e um
arquivo com sobra torta daria alça no vazio.

A tabela existe porque o estúdio precisa da proporção de cada imagem antes de ela chegar — é com ela
que desenha a caixa, acha a camada no clique e limita o tamanho a 300 dpi. O teste
`qa/imagens-unit.test.mjs` confere a tabela contra os arquivos, então ela não envelhece calada.

Rodar de panda-mimo/:   python marca/kit/prepara-imagens-do-estudio.py   (pula o que já está pronto;
                        --refaz refaz tudo)
Só a tabela, sem refazer as imagens:   python marca/kit/prepara-imagens-do-estudio.py --so-tabela
"""
from pathlib import Path
import re
import sys

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]  # panda-mimo/
MESTRES = RAIZ / 'marca' / 'kit' / 'png'
ASSETS = RAIZ / 'assets'
MINI = ASSETS / 'mini'
TABELA = RAIZ / 'simulador' / 'imagens-do-acervo.js'

# mestre → nome publicado. Pose do Pandinha segue a regra do manual (6.4): `panda-<pose>.webp`.
IMAGENS = [
    ('pandinha-temas-20/01-ciclista', 'panda-ciclismo'),
    ('pandinha-temas-20/02-academia', 'panda-academia'),
    ('pandinha-temas-20/03-engenheiro', 'panda-engenharia'),
    ('pandinha-temas-20/04-medico', 'panda-medicina'),
    ('pandinha-temas-20/05-professor', 'panda-professor'),
    ('pandinha-temas-20/06-corredor', 'panda-corrida'),
    ('pandinha-temas-20/07-yoga', 'panda-yoga'),
    ('pandinha-temas-20/08-cross-training', 'panda-treino'),
    ('pandinha-temas-20/09-futebol', 'panda-futebol'),
    ('pandinha-temas-20/10-nadador', 'panda-natacao'),
    ('pandinha-temas-20/11-enfermagem', 'panda-enfermagem'),
    ('pandinha-temas-20/12-dentista', 'panda-odontologia'),
    ('pandinha-temas-20/13-veterinario', 'panda-veterinaria'),
    ('pandinha-temas-20/14-chef', 'panda-cozinha'),
    ('pandinha-temas-20/15-confeiteiro', 'panda-confeitaria'),
    ('pandinha-temas-20/16-jardineiro', 'panda-jardinagem'),
    ('pandinha-temas-20/17-artista', 'panda-pintura'),
    ('pandinha-temas-20/18-musico', 'panda-musica'),
    ('pandinha-temas-20/19-fotografo', 'panda-fotografia'),
    ('pandinha-temas-20/20-leitor', 'panda-leitura'),
    ('piloto-aquarela/01-buque-botanico', 'aquarela-buque'),
    ('piloto-aquarela/02-cachorrinho', 'aquarela-cachorrinho'),
    ('piloto-aquarela/03-bicicleta-floral', 'aquarela-bicicleta'),
    ('piloto-aquarela/04-cafe-leitura', 'aquarela-cafe'),
    ('piloto-aquarela/05-ursinho-bebe', 'aquarela-ursinho'),
    ('piloto-aquarela/06-casa-jardim', 'aquarela-casa'),
    # segundo lote de 23/09/2026: 35 poses e 4 adesivos do acervo
    ('pandinha-temas-35/21-arquiteto', 'panda-arquitetura'),
    ('pandinha-temas-35/22-programador', 'panda-programacao'),
    ('pandinha-temas-35/23-cientista', 'panda-ciencia'),
    ('pandinha-temas-35/24-advogado', 'panda-direito'),
    ('pandinha-temas-35/25-psicologo', 'panda-psicologia'),
    ('pandinha-temas-35/26-nutricionista', 'panda-nutricao'),
    ('pandinha-temas-35/27-fisioterapeuta', 'panda-fisioterapia'),
    ('pandinha-temas-35/28-farmaceutico', 'panda-farmacia'),
    ('pandinha-temas-35/29-cabeleireiro', 'panda-salao'),
    ('pandinha-temas-35/30-costureiro', 'panda-costura'),
    ('pandinha-temas-35/31-florista', 'panda-flores'),
    ('pandinha-temas-35/32-barista', 'panda-barista'),
    ('pandinha-temas-35/33-tenista', 'panda-tenis'),
    ('pandinha-temas-35/34-basquete', 'panda-basquete'),
    ('pandinha-temas-35/35-volei', 'panda-volei'),
    ('pandinha-temas-35/36-skate', 'panda-skate'),
    ('pandinha-temas-35/37-patinacao', 'panda-patinacao'),
    ('pandinha-temas-35/38-trilha', 'panda-trilha'),
    ('pandinha-temas-35/39-pilates', 'panda-pilates'),
    ('pandinha-temas-35/40-surf', 'panda-surf'),
    ('pandinha-temas-35/41-formatura', 'panda-formatura'),
    ('pandinha-temas-35/42-aniversario', 'panda-aniversario'),
    ('pandinha-temas-35/43-natal', 'panda-natal'),
    ('pandinha-temas-35/44-pascoa', 'panda-pascoa'),
    ('pandinha-temas-35/45-padrinho', 'panda-padrinho'),
    ('pandinha-temas-35/46-madrinha', 'panda-madrinha'),
    ('pandinha-temas-35/47-bebe', 'panda-bebe'),
    ('pandinha-temas-35/48-casa-nova', 'panda-casa'),
    ('pandinha-temas-35/49-amizade', 'panda-amizade'),
    ('pandinha-temas-35/50-obrigado', 'panda-obrigado'),
    ('pandinha-temas-35/51-viajante', 'panda-viagem'),
    ('pandinha-temas-35/52-acampamento', 'panda-acampamento'),
    ('pandinha-temas-35/53-cinema', 'panda-cinema'),
    ('pandinha-temas-35/54-gamer', 'panda-games'),
    ('pandinha-temas-35/55-cartinha', 'panda-cartinha'),
    ('pandinha-temas-35/e01-laco', 'laco-pessego'),
    ('pandinha-temas-35/e02-coracao', 'coracao-botanico'),
    ('pandinha-temas-35/e03-margaridas', 'margaridas'),
    ('pandinha-temas-35/e04-presente', 'presente-carinho'),
]

LIMIAR_DO_ALFA = 8      # abaixo disso é ruído de geração, não desenho
FOLGA = 0.02            # da maior dimensão, em volta toda
LADO_DA_MINI = 320
QUALIDADE = 92          # a mesma do kit em WebP
QUALIDADE_DA_MINI = 86


def recorta(imagem):
    """Tira a sobra transparente e devolve uma folga igual nos quatro lados."""
    alfa = imagem.getchannel('A').point(lambda v: 255 if v > LIMIAR_DO_ALFA else 0)
    caixa = alfa.getbbox()
    if not caixa:
        raise ValueError('imagem sem desenho')
    desenho = imagem.crop(caixa)
    folga = max(12, round(max(desenho.size) * FOLGA))
    quadro = Image.new('RGBA', (desenho.width + 2 * folga, desenho.height + 2 * folga), (0, 0, 0, 0))
    quadro.paste(desenho, (folga, folga))
    return quadro


def salva_webp(imagem, destino, qualidade):
    destino.parent.mkdir(parents=True, exist_ok=True)
    imagem.save(destino, 'WEBP', quality=qualidade, alpha_quality=100, method=6)


def prepara():
    MINI.mkdir(parents=True, exist_ok=True)
    geradas = {}
    refaz = '--refaz' in sys.argv
    for mestre, nome in IMAGENS:
        geradas[f'assets/{nome}.webp'] = f'assets/mini/{nome}.webp'
        # O WebP no modo mais caprichado leva uns 20 s por imagem: o que já saiu não se refaz.
        if not refaz and (ASSETS / f'{nome}.webp').exists() and (MINI / f'{nome}.webp').exists():
            continue
        origem = MESTRES / f'{mestre}.png'
        imagem = recorta(Image.open(origem).convert('RGBA'))
        salva_webp(imagem, ASSETS / f'{nome}.webp', QUALIDADE)
        mini = imagem.copy()
        mini.thumbnail((LADO_DA_MINI, LADO_DA_MINI), Image.LANCZOS)
        salva_webp(mini, MINI / f'{nome}.webp', QUALIDADE_DA_MINI)
        geradas[f'assets/{nome}.webp'] = f'assets/mini/{nome}.webp'
        print(f'  {nome:24} {imagem.width} × {imagem.height} px')
    return geradas


def referencias_do_estudio():
    """Toda imagem do acervo que o código do estúdio cita, para a tabela não depender de lista à mão."""
    achadas = set()
    for arquivo in (RAIZ / 'simulador').glob('*.js'):
        if arquivo == TABELA:
            continue
        achadas.update(re.findall(r"'(assets/[a-z0-9@_-]+\.webp)'", arquivo.read_text(encoding='utf-8')))
    return achadas


def mini_da_imagem_antiga(arquivo):
    """Versão leve de uma imagem que já existia no site, feita da própria imagem (que não é tocada)."""
    destino = MINI / Path(arquivo).name
    with Image.open(RAIZ / arquivo) as imagem:
        if max(imagem.size) <= LADO_DA_MINI:
            return None
        mini = imagem.convert('RGBA')
        mini.thumbnail((LADO_DA_MINI, LADO_DA_MINI), Image.LANCZOS)
    salva_webp(mini, destino, QUALIDADE_DA_MINI)
    return f'assets/mini/{destino.name}'


def escreve_tabela(geradas):
    arquivos = sorted(referencias_do_estudio() | set(geradas))
    linhas = []
    for arquivo in arquivos:
        with Image.open(RAIZ / arquivo) as imagem:
            largura, altura = imagem.size
        # As imagens que já existiam também ganham versão leve: a miniatura de um modelo desenha o
        # Pandinha com uns 30 px, e baixar o arquivo inteiro para isso pesava 60 KB por modelo.
        leve = geradas.get(arquivo) or mini_da_imagem_antiga(arquivo)
        mini = f", mini: '{leve}'" if leve else ''
        linhas.append(f"  '{arquivo}': Object.freeze({{ largura: {largura}, altura: {altura}{mini} }}),")
    TABELA.write_text(
        '/*\n'
        '  Gerado por marca/kit/prepara-imagens-do-estudio.py — não edite à mão.\n\n'
        '  O tamanho real, em pixels, de toda imagem do acervo que o estúdio usa. É com ele que a caixa\n'
        '  da camada segue a proporção do desenho e que o limite de tamanho segura os 300 dpi, antes de\n'
        '  a imagem chegar. `mini` é a versão leve, para a miniatura da lista e as grades.\n'
        '*/\n'
        'export const IMAGENS_DO_ACERVO = Object.freeze({\n' + '\n'.join(linhas) + '\n});\n',
        encoding='utf-8', newline='\n')
    print(f'  tabela: {len(arquivos)} imagens em {TABELA.relative_to(RAIZ)}')


if __name__ == '__main__':
    if '--so-tabela' in sys.argv:
        escreve_tabela({f'assets/{nome}.webp': f'assets/mini/{nome}.webp' for _, nome in IMAGENS})
    else:
        escreve_tabela(prepara())
