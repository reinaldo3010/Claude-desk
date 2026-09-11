import os
# Monta o kit construído do Seu Mimo Studio: logos, símbolo, mascote (poses, expressões, folha de modelo), versões mono e sobre oliva.
import sys, os, re, json, shutil
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import mascote2 as M, coracoes as C
from logo import letreiro, studio
K=sys.argv[1]; SV=f'{K}/svg'
COR={'oliva':'#2F2E1E','cafe':'#3A2E21','bege':'#C0966D','offwhite':'#D4C7B5','preto':'#050505','branco':'#FFFFFF','fundo':'#E6D9CA'}
# os traçados automáticos da primeira rodada ficam em tracados-referencia/ (restaurados do histórico; nunca são sobrescritos)
os.makedirs(SV,exist_ok=True)
def svg(vb,conteudo,titulo,fundo=None):
    x,y,w,h=vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}" role="img" aria-label="{titulo}">\n<title>{titulo}</title>\n'
            +(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fundo}"/>' if fundo else '')+conteudo+'\n</svg>\n')
def salva(nome,txt): open(f'{SV}/{nome}.svg','w').write(txt); print('  ',nome, os.path.getsize(f'{SV}/{nome}.svg')//1024,'KB')
# ---- letreiro: "Seu Mimo" 1818 de largura, "STUDIO" 1061, mesmas proporções da prancha ----
g_w,larg_w=letreiro(300,-0.012); esc=1818/larg_w; g_w,larg_w=letreiro(300*esc,-0.012)
g_s,larg_s=studio(100,0.62); escs=1061/larg_s; g_s,larg_s=studio(100*escs,0.62)
# baseline do letreiro em y=0; altura de caixa alta ≈ 0.72*tam; STUDIO fica 77 px abaixo da linha de base do letreiro na prancha (4x)
ALT=300*esc*0.72; STUDIO_Y=0+92+100*escs*0.7; STUDIO_X=(1818-1061)/2
def letreiro_svg(fill):
    return f'<g fill="{fill}"><g transform="translate(0 0)">{g_w}</g><g transform="translate({STUDIO_X:.1f} {STUDIO_Y:.1f})">{g_s}</g></g>'
def variantes(nome, fn, m):
    # fn(fill) -> conteúdo; m = margem
    for suf,fill,fundo in (('',COR['oliva'],None),('-preto',COR['preto'],None),('-branco',COR['branco'],None),('-sobre-oliva',COR['offwhite'],COR['oliva'])):
        vb,conteudo=fn(fill); x,y,w,h=vb; salva(nome+suf, svg((x-m,y-m,w+2*m,h+2*m),conteudo,'Seu Mimo Studio',fundo))
# 1) logotipo principal: coração duplo acima do "M" (centro ≈ x 1120), coração pequeno à esquerda do "S"
def principal(fill):
    hearts=C.coracao_duplo(1085,-ALT-150,88,fill,15)+C.coracao_simples(-95,-ALT+40,42,fill,13,rot=-14)
    return (-150,-ALT-260,1818+150+40,ALT+260+STUDIO_Y+40), hearts+letreiro_svg(fill)
variantes('logo-principal',principal,80)
# 2) letreiro
def let(fill): return (0,-ALT-10,1818,ALT+10+STUDIO_Y+40), letreiro_svg(fill)
variantes('letreiro',let,60)
# 3) símbolo (monolinha, do mascote)
def sim(fill): return (100,20,1060,1200), M.simbolo(fill)
variantes('simbolo',sim,60)
# 4) logotipo vertical: símbolo (~48% da largura do letreiro) em cima do letreiro
def vert(fill):
    sw=1060; esc_s=(1818*0.48)/sw; alt_s=1200*esc_s
    c=f'<g transform="translate({(1818-sw*esc_s)/2:.1f} 0) scale({esc_s:.4f}) translate(-100 -20)">{M.simbolo(fill)}</g>'
    c+=f'<g transform="translate(0 {alt_s+ALT+80:.1f})">{letreiro_svg(fill)}</g>'
    return (0,0,1818,alt_s+ALT+80+STUDIO_Y+40), c
variantes('logo-vertical',vert,100)
# 5) avatar: símbolo dentro de círculo oliva (redes sociais)
c=f'<circle cx="600" cy="600" r="600" fill="{COR["oliva"]}"/><g transform="translate(600 640) scale(0.74) translate(-630 -620)">{M.simbolo(COR["offwhite"],20,coracao_solto=False)}</g>'
salva('avatar', svg((0,0,1200,1200),c,'Avatar Seu Mimo Studio'))
c=f'<circle cx="600" cy="600" r="600" fill="{COR["offwhite"]}"/><g transform="translate(600 640) scale(0.74) translate(-630 -620)">{M.simbolo(COR["oliva"],20,coracao_solto=False)}</g>'
salva('avatar-claro', svg((0,0,1200,1200),c,'Avatar Seu Mimo Studio'))
# 6) mascote: poses (transparente e sobre fundo da marca)
for nome,p in M.POSES.items():
    corpo=M.mascote(**p)
    salva(f'mascote-{nome}', svg((40,40,1200,1180),f'<g id="mascote-{nome}">{corpo}</g>',f'Mascote Seu Mimo Studio, {nome}'))
    salva(f'mascote-{nome}-fundo', svg((40,40,1200,1180),f'<g id="mascote-{nome}">{corpo}</g>',f'Mascote Seu Mimo Studio, {nome}',COR['fundo']))
# 7) expressões: rosto em círculo (recorte da caixa, sem braços)
for nome,(oe,od,bc) in M.EXPRESSOES.items():
    corpo=M.mascote(olhos_t=(oe,od),boca_t=bc,item='nenhum',etiqueta=False,bochechas=(nome not in ('surpreso','determinado')))
    c=f'<defs><clipPath id="cp"><circle cx="560" cy="560" r="330"/></clipPath></defs><circle cx="560" cy="560" r="330" fill="{COR["fundo"]}"/><g clip-path="url(#cp)"><g transform="translate(560 560) scale(1.15) translate(-550 -643)">{corpo}</g></g>'
    salva(f'expressao-{nome}', svg((220,220,680,680),c,f'Expressão {nome}'))
# 8) folha de modelo: 5 poses + 6 expressões + símbolo, com nomes
def rotulo(x,y,t): return f'<text x="{x}" y="{y}" font-family="Montserrat, Arial, sans-serif" font-size="34" letter-spacing="6" fill="{COR["cafe"]}" text-anchor="middle">{t.upper()}</text>'
c=f'<rect width="5400" height="2350" fill="{COR["fundo"]}"/>'
c+=f'<text x="120" y="140" font-family="DM Serif Display, Georgia, serif" font-size="96" fill="{COR["oliva"]}">Folha de modelo do mascote</text>'
c+=f'<text x="120" y="210" font-family="Montserrat, Arial, sans-serif" font-size="34" letter-spacing="4" fill="{COR["cafe"]}">SEU MIMO STUDIO · MESMAS PEÇAS EM TODAS AS POSES · PROPORÇÕES FIXAS</text>'
for i,(nome,p) in enumerate(M.POSES.items()):
    x=120+i*1000; c+=f'<g transform="translate({x} 260) scale(0.8)">{M.mascote(**p)}</g>'+rotulo(x+470,1260,nome)
for i,(nome,(oe,od,bc)) in enumerate(M.EXPRESSOES.items()):
    x=120+i*560; corpo=M.mascote(olhos_t=(oe,od),boca_t=bc,item='nenhum',etiqueta=False,bochechas=(nome not in ('surpreso','determinado')))
    c+=f'<defs><clipPath id="cp{i}"><circle cx="{x+220}" cy="1620" r="200"/></clipPath></defs><circle cx="{x+220}" cy="1620" r="200" fill="{COR["offwhite"]}"/><g clip-path="url(#cp{i})"><g transform="translate({x+220} 1620) scale(0.7) translate(-550 -643)">{corpo}</g></g>'+rotulo(x+220,1900,nome)
c+=f'<g transform="translate(3760 1330) scale(0.44) translate(-100 -20)">{M.simbolo(COR["oliva"])}</g>'+rotulo(3985,1900,'símbolo')
c+=f'<text x="120" y="2150" font-family="Montserrat, Arial, sans-serif" font-size="30" fill="{COR["cafe"]}">Cores: kraft {M.COR["kraft"]} · lateral {M.COR["kraft_lat"]} · tampa {M.COR["tampa"]} · fita {M.COR["oliva"]} · membros {M.COR["cafe"]} · etiqueta {M.COR["off"]} · bochechas {M.COR["rosa"]}</text>'
c+=f'<text x="120" y="2210" font-family="Montserrat, Arial, sans-serif" font-size="30" fill="{COR["cafe"]}">Regras: laço sempre no topo da fita · etiqueta à esquerda · rosto no terço médio da frente · braços e pernas em café, pontas redondas · um coração solto no máximo por pose</text>'
salva('folha-de-modelo', svg((0,0,5400,2350),c,'Folha de modelo do mascote Seu Mimo Studio'))
json.dump({**COR,'mascote':M.COR}, open(f'{K}/cores.json','w'), indent=2, ensure_ascii=False)
print('kit ok')
