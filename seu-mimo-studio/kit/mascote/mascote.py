# Mascote Seu Mimo Studio construído em vetor 2D (caixinha de presente com laço, rosto, braços, pernas, etiqueta e coração).
# Tudo sai das mesmas peças, com parâmetros de pose e expressão -> folha de modelo consistente.
import math
COR={'kraft':'#C9A27B','kraft_esc':'#A98058','kraft_topo':'#D9B48F','oliva':'#2F2E1E','oliva_claro':'#4A4931','cafe':'#3A2E21','cafe_claro':'#5A4636','off':'#EFE6D8','off_esc':'#D4C7B5','rosa':'#D9A08C','fundo':'#E6D9CA'}
W,H=1000,1200   # caixa de desenho
def heart(cx,cy,s,fill,stroke=None,sw=0,rot=0):
    # coração simétrico em cúbicas; s = meia-largura
    d=(f'M{cx},{cy+s*0.95} C{cx-s*0.95},{cy+s*0.25} {cx-s*1.05},{cy-s*0.55} {cx-s*0.5},{cy-s*0.6} '
       f'C{cx-s*0.2},{cy-s*0.62} {cx},{cy-s*0.35} {cx},{cy-s*0.2} C{cx},{cy-s*0.35} {cx+s*0.2},{cy-s*0.62} {cx+s*0.5},{cy-s*0.6} '
       f'C{cx+s*1.05},{cy-s*0.55} {cx+s*0.95},{cy+s*0.25} {cx},{cy+s*0.95} Z')
    st=f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    tr=f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<path d="{d}" fill="{fill}"{st}{tr}/>'
def rrect(x,y,w,h,r,fill,extra=''):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" fill="{fill}" {extra}/>'
def tubo(pts,cor,larg):
    # membro: polilinha suave com pontas redondas
    d='M'+' L'.join(f'{x},{y}' for x,y in pts)
    return f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round"/>'
def olho(cx,cy,tipo,esc=1.0,cor=COR['cafe']):
    r=22*esc
    if tipo=='feliz':   # arco para cima (olho fechado sorrindo)
        return f'<path d="M{cx-r*1.3},{cy+r*0.2} Q{cx},{cy-r*1.6} {cx+r*1.3},{cy+r*0.2}" fill="none" stroke="{cor}" stroke-width="{14*esc}" stroke-linecap="round"/>'
    if tipo=='aberto':  # bolinha
        return f'<circle cx="{cx}" cy="{cy}" r="{r*0.75}" fill="{cor}"/>'
    if tipo=='piscando':  # traço curvo pra baixo
        return f'<path d="M{cx-r*1.2},{cy} Q{cx},{cy+r*0.9} {cx+r*1.2},{cy}" fill="none" stroke="{cor}" stroke-width="{14*esc}" stroke-linecap="round"/>'
    if tipo=='grande':  # surpreso: círculo maior com brilho
        return f'<circle cx="{cx}" cy="{cy}" r="{r*1.15}" fill="{cor}"/><circle cx="{cx+r*0.35}" cy="{cy-r*0.4}" r="{r*0.3}" fill="{COR["off"]}"/>'
    if tipo=='coracao':
        return heart(cx,cy+2,r*1.1,cor)
    if tipo=='determinado':  # meio fechado com sobrancelha inclinada
        return f'<path d="M{cx-r*0.9},{cy-r*0.2} Q{cx},{cy-r*0.9} {cx+r*0.9},{cy-r*0.2}" fill="none" stroke="{cor}" stroke-width="{14*esc}" stroke-linecap="round"/>'
    return ''
def boca(cx,cy,tipo,esc=1.0,cor=COR['cafe']):
    if tipo=='sorriso': return f'<path d="M{cx-18*esc},{cy} Q{cx},{cy+26*esc} {cx+18*esc},{cy}" fill="none" stroke="{cor}" stroke-width="{12*esc}" stroke-linecap="round"/>'
    if tipo=='aberto':  return f'<path d="M{cx-26*esc},{cy-4*esc} Q{cx},{cy+48*esc} {cx+26*esc},{cy-4*esc} Z" fill="{cor}"/>'
    if tipo=='o':       return f'<ellipse cx="{cx}" cy="{cy+8*esc}" rx="{14*esc}" ry="{18*esc}" fill="{cor}"/>'
    if tipo=='linha':   return f'<path d="M{cx-16*esc},{cy+6*esc} L{cx+16*esc},{cy+6*esc}" fill="none" stroke="{cor}" stroke-width="{12*esc}" stroke-linecap="round"/>'
    return ''
def mascote(pose='feliz', olhos=('feliz','feliz'), boca_t='sorriso', bochechas=True, etiqueta=True, item='coracao', incl=0, coracoes_soltos=0, so_rosto=False):
    """Devolve o conteúdo SVG (sem <svg>) do mascote em pose. Caixa: 1000 x 1200, pés em y≈1150."""
    g=[]
    # geometria base da caixa (vista 3/4 leve): frente 520x560, lateral esquerda 110 de largura, topo 60
    fx,fy,fw,fh=300,380,520,560
    lat=110; topo=58
    # pernas (atrás do corpo, saem da base)
    if pose=='entregando':
        g.append(tubo([(fx+150,fy+fh-10),(fx+120,fy+fh+110),(fx+60,fy+fh+150)],COR['cafe'],52)); g.append(f'<ellipse cx="{fx+40}" cy="{fy+fh+158}" rx="46" ry="30" fill="{COR["cafe"]}"/>')
        g.append(tubo([(fx+370,fy+fh-10),(fx+400,fy+fh+100),(fx+470,fy+fh+150)],COR['cafe'],52)); g.append(f'<ellipse cx="{fx+490}" cy="{fy+fh+158}" rx="46" ry="30" fill="{COR["cafe"]}"/>')
    else:
        g.append(tubo([(fx+150,fy+fh-10),(fx+140,fy+fh+120),(fx+120,fy+fh+150)],COR['cafe'],52)); g.append(f'<ellipse cx="{fx+112}" cy="{fy+fh+160}" rx="50" ry="30" fill="{COR["cafe"]}"/>')
        g.append(tubo([(fx+370,fy+fh-10),(fx+380,fy+fh+120),(fx+400,fy+fh+150)],COR['cafe'],52)); g.append(f'<ellipse cx="{fx+410}" cy="{fy+fh+160}" rx="50" ry="30" fill="{COR["cafe"]}"/>')
    corpo=[]
    # lateral esquerda (mais escura) e topo
    corpo.append(f'<path d="M{fx-lat},{fy+40} L{fx},{fy} L{fx},{fy+fh} L{fx-lat},{fy+fh-40} Z" fill="{COR["kraft_esc"]}"/>')
    corpo.append(f'<path d="M{fx-lat},{fy+40} L{fx},{fy} L{fx+fw},{fy} L{fx+fw-lat*0.15},{fy-topo} L{fx-lat*0.85},{fy-topo+40} Z" fill="{COR["kraft_topo"]}"/>')
    # frente
    corpo.append(rrect(fx,fy,fw,fh,26,COR['kraft']))
    # fita: faixa vertical na frente e na lateral, subindo até o laço
    # fita sobre a tampa (faixa no topo), sem faixa na frente: o rosto fica limpo no kraft, como na prancha
    rx0=fx+fw*0.56
    corpo.append(f'<path d="M{rx0},{fy} L{rx0+78},{fy} L{rx0+78-lat*0.15},{fy-topo} L{rx0-lat*0.15},{fy-topo} Z" fill="{COR["oliva"]}"/>')
    corpo.append(f'<path d="M{fx-lat*0.55},{fy+22} L{fx-lat*0.55+30},{fy+10} L{fx-lat*0.55+30},{fy+fh-30} L{fx-lat*0.55},{fy+fh-42} Z" fill="{COR["oliva_claro"]}"/>')
    # aresta da tampa e ponta da fita caindo da tampa, em andorinha (como na prancha)
    corpo.append(f'<path d="M{fx+4},{fy+62} L{fx+fw-4},{fy+62}" fill="none" stroke="{COR["kraft_esc"]}" stroke-width="6" stroke-linecap="round" opacity=".6"/>')
    px=fx+fw*0.56
    corpo.append(f'<path d="M{px},{fy+2} L{px+78},{fy+2} L{px+66},{fy+150} L{px+39},{fy+112} L{px+12},{fy+150} Z" fill="{COR["oliva"]}"/>')
    # laço em cima: duas alças redondas com dobra interna, nó e duas pontas em andorinha
    bx,by=fx+fw*0.56+39-lat*0.15, fy-topo-6
    for sgn in (-1,1):
        corpo.append(f'<path d="M{bx},{by} C{bx+sgn*40},{by-210} {bx+sgn*330},{by-230} {bx+sgn*300},{by-60} C{bx+sgn*285},{by+20} {bx+sgn*90},{by+30} {bx},{by} Z" fill="{COR["oliva"]}"/>')
        corpo.append(f'<path d="M{bx+sgn*70},{by-40} C{bx+sgn*110},{by-150} {bx+sgn*250},{by-150} {bx+sgn*240},{by-70} C{bx+sgn*225},{by-25} {bx+sgn*120},{by-15} {bx+sgn*70},{by-40} Z" fill="{COR["oliva_claro"]}" opacity=".55"/>')
    corpo.append(f'<path d="M{bx-44},{by-30} C{bx-50},{by+30} {bx+50},{by+30} {bx+44},{by-30} C{bx+30},{by-48} {bx-30},{by-48} {bx-44},{by-30} Z" fill="{COR["oliva_claro"]}"/>')
    # etiqueta pendurada à esquerda
    if etiqueta:
        tx,ty=fx-lat-10,fy+150
        corpo.append(f'<path d="M{tx+52},{fy+40} Q{tx+40},{ty-40} {tx+56},{ty}" fill="none" stroke="{COR["cafe"]}" stroke-width="7"/>')
        corpo.append(f'<path d="M{tx+56},{ty} L{tx+112},{ty+32} L{tx+112},{ty+200} L{tx},{ty+200} L{tx},{ty+32} Z" fill="{COR["off"]}" transform="rotate(-8 {tx+56} {ty+100})"/>')
        corpo.append(f'<circle cx="{tx+56}" cy="{ty+40}" r="8" fill="{COR["kraft_esc"]}" transform="rotate(-8 {tx+56} {ty+100})"/>')
        corpo.append(heart(tx+56,ty+120,22,'none',COR['cafe'],7))
    # rosto
    ex,ey=fx+fw*0.5, fy+fh*0.46
    corpo.append(olho(ex-110,ey,olhos[0])); corpo.append(olho(ex+110,ey,olhos[1]))
    if bochechas: corpo.append(f'<circle cx="{ex-135}" cy="{ey+58}" r="20" fill="{COR["rosa"]}" opacity=".7"/><circle cx="{ex+135}" cy="{ey+58}" r="20" fill="{COR["rosa"]}" opacity=".7"/>')
    corpo.append(boca(ex,ey+40,boca_t))
    # braços e item
    ay=fy+fh*0.72
    if item=='coracao':
        corpo.append(heart(ex,ay+30,130,COR['oliva']))
        corpo.append(tubo([(fx-10,ay-40),(fx+50,ay+80),(ex-105,ay+70)],COR['cafe'],54))
        corpo.append(tubo([(fx+fw+10,ay-40),(fx+fw-50,ay+80),(ex+105,ay+70)],COR['cafe'],54))
        corpo.append(f'<circle cx="{ex-108}" cy="{ay+72}" r="36" fill="{COR["cafe"]}"/><circle cx="{ex+108}" cy="{ay+72}" r="36" fill="{COR["cafe"]}"/>')
    elif item=='maos':   # agradecido: mãos juntas no peito
        corpo.append(tubo([(fx-10,ay-40),(fx+80,ay+30),(ex-30,ay+10)],COR['cafe'],54))
        corpo.append(tubo([(fx+fw+10,ay-40),(fx+fw-80,ay+30),(ex+30,ay+10)],COR['cafe'],54))
        corpo.append(f'<circle cx="{ex-22}" cy="{ay+10}" r="34" fill="{COR["cafe"]}"/><circle cx="{ex+22}" cy="{ay+10}" r="34" fill="{COR["cafe"]}"/>')
    elif item=='envelope':  # entregando: os dois braços à frente segurando um envelope grande, levemente inclinado
        ex2,ey2=ex+40,ay+30
        corpo.append(tubo([(fx-10,ay-40),(fx+70,ay+70),(ex2-110,ey2+40)],COR['cafe'],54))
        corpo.append(tubo([(fx+fw+10,ay-40),(fx+fw-40,ay+60),(ex2+120,ey2+30)],COR['cafe'],54))
        corpo.append(rrect(ex2-150,ey2-50,300,190,14,COR['off'],f'transform="rotate(-8 {ex2} {ey2+45})"'))
        corpo.append(f'<path d="M{ex2-150},{ey2-50} L{ex2},{ey2+70} L{ex2+150},{ey2-50}" fill="none" stroke="{COR["kraft_esc"]}" stroke-width="8" stroke-linejoin="round" transform="rotate(-8 {ex2} {ey2+45})"/>')
        corpo.append(heart(ex2,ey2+95,22,COR['oliva'],rot=-8))
        corpo.append(f'<circle cx="{ex2-112}" cy="{ey2+44}" r="34" fill="{COR["cafe"]}"/><circle cx="{ex2+122}" cy="{ey2+34}" r="34" fill="{COR["cafe"]}"/>')
    elif item=='nenhum':
        pass
    elif item=='aceno':  # surpreso / piscando: um braço levantado
        corpo.append(tubo([(fx-10,ay-40),(fx+60,ay+60),(ex-60,ay+70)],COR['cafe'],54)); corpo.append(f'<circle cx="{ex-64}" cy="{ay+72}" r="34" fill="{COR["cafe"]}"/>')
        corpo.append(tubo([(fx+fw+10,ay-40),(fx+fw+90,ay-120),(fx+fw+110,ay-230)],COR['cafe'],54)); corpo.append(f'<circle cx="{fx+fw+112}" cy="{ay-240}" r="34" fill="{COR["cafe"]}"/>')
    for i in range(coracoes_soltos):
        g_h=[(fx+fw+150,fy-120,34),(fx+fw+230,fy-30,22),(fx-lat-90,fy-80,26)][i%3]
        corpo.append(heart(g_h[0],g_h[1],g_h[2],COR['oliva']))
    body=f'<g id="corpo" transform="rotate({incl} {fx+fw/2} {fy+fh})">'+''.join(corpo)+'</g>'
    g.append(body)
    return ''.join(g)
POSES={
 'feliz':      dict(pose='feliz', olhos=('feliz','feliz'), boca_t='sorriso', item='coracao'),
 'piscando':   dict(pose='piscando', olhos=('feliz','piscando'), boca_t='sorriso', item='aceno', coracoes_soltos=1),
 'agradecido': dict(pose='agradecido', olhos=('feliz','feliz'), boca_t='sorriso', item='maos', bochechas=True),
 'entregando': dict(pose='entregando', olhos=('feliz','feliz'), boca_t='sorriso', item='envelope', incl=-6, coracoes_soltos=1),
 'surpreso':   dict(pose='surpreso', olhos=('grande','grande'), boca_t='o', item='aceno', bochechas=False, coracoes_soltos=2),
}
EXPRESSOES={
 'feliz':('feliz','feliz','sorriso'),'surpreso':('grande','grande','o'),'piscando':('feliz','piscando','sorriso'),
 'encantado':('coracao','coracao','sorriso'),'sorrindo':('feliz','feliz','aberto'),'determinado':('determinado','determinado','linha'),
}
import re as _re
def linha(conteudo, cor='#2F2E1E', larg=16):
    """Versão monolinha do mascote: todo preenchimento vira contorno na cor pedida; bochechas e sombras somem."""
    c=_re.sub(r'<circle[^>]*opacity="\.7"[^>]*/>','',conteudo)              # bochechas
    c=_re.sub(r'<path[^>]*opacity="\.55"[^>]*/>','',c)                       # dobra interna do laço
    c=_re.sub(r'<path[^>]*stroke-width="6"[^>]*/>','',c)                      # aresta da tampa
    def troca(m):
        tag=m.group(0)
        tag=_re.sub(r'\sfill="[^"]*"','',tag); tag=_re.sub(r'\sstroke="[^"]*"','',tag); tag=_re.sub(r'\sstroke-width="[^"]*"','',tag); tag=_re.sub(r'\sopacity="[^"]*"','',tag)
        return tag.replace('<path','<path fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="round" stroke-linecap="round"'%(cor,larg),1).replace('<rect','<rect fill="none" stroke="%s" stroke-width="%d" stroke-linejoin="round"'%(cor,larg),1).replace('<ellipse','<ellipse fill="none" stroke="%s" stroke-width="%d"'%(cor,larg),1).replace('<circle','<circle fill="none" stroke="%s" stroke-width="%d"'%(cor,larg),1)
    c=_re.sub(r'<(path|rect|ellipse|circle)\b[^>]*/>',troca,c)
    # olhos e boca e mãos voltam a ser sólidos (são traços/pontos por natureza)
    return c
def svg(conteudo,w=W,h=H,fundo=None,vb=None):
    vb=vb or f'0 0 {w} {h}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'+(f'<rect x="{vb.split()[0]}" y="{vb.split()[1]}" width="{vb.split()[2]}" height="{vb.split()[3]}" fill="{fundo}"/>' if fundo else '')+conteudo+'</svg>'
if __name__=='__main__':
    import os
    S=os.path.dirname(os.path.abspath(__file__))
    for nome,p in POSES.items(): open(f'{S}/masc-{nome}.svg','w').write(svg(mascote(**p),fundo=COR['fundo']))
    print('poses ok')

def simbolo(cor=COR['oliva'], larg=18, coracao_solto=True):
    """Símbolo monolinha: mesma caixa, laço, fita, rosto, braços, pernas, etiqueta e coração, em traço único."""
    fx,fy,fw,fh=300,380,520,560; lat=110; topo=58
    st=f'fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round"'
    g=[]
    # caixa: frente, lateral e topo
    g.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="26" {st}/>')
    g.append(f'<path d="M{fx},{fy} L{fx-lat},{fy+40} L{fx-lat},{fy+fh-40} L{fx},{fy+fh}" {st}/>')
    g.append(f'<path d="M{fx-lat},{fy+40} L{fx-lat*0.85},{fy-topo+40} L{fx+fw-lat*0.15},{fy-topo} L{fx+fw},{fy}" {st}/>')
    # fita vertical (duas linhas) e ponta em andorinha
    rx=fx+fw*0.56
    g.append(f'<path d="M{rx},{fy} L{rx-lat*0.15},{fy-topo}" {st}/><path d="M{rx+78},{fy} L{rx+78-lat*0.15},{fy-topo}" {st}/>')
    g.append(f'<path d="M{rx},{fy} L{rx+78},{fy} L{rx+66},{fy+150} L{rx+39},{fy+112} L{rx+12},{fy+150} Z" {st}/>')
    # laço
    bx,by=rx+39-lat*0.15, fy-topo-6
    for sg in (-1,1):
        g.append(f'<path d="M{bx},{by} C{bx+sg*40},{by-210} {bx+sg*330},{by-230} {bx+sg*300},{by-60} C{bx+sg*285},{by+20} {bx+sg*90},{by+30} {bx},{by} Z" {st}/>')
    g.append(f'<ellipse cx="{bx}" cy="{by-6}" rx="40" ry="30" fill="{cor}"/>')
    # etiqueta
    tx,ty=fx-lat-10,fy+150
    g.append(f'<path d="M{tx+52},{fy+40} Q{tx+40},{ty-40} {tx+56},{ty}" {st}/>')
    g.append(f'<path d="M{tx+56},{ty} L{tx+112},{ty+32} L{tx+112},{ty+200} L{tx},{ty+200} L{tx},{ty+32} Z" {st} transform="rotate(-8 {tx+56} {ty+100})"/>')
    g.append(heart(tx+56,ty+120,22,'none',cor,larg*0.6))
    # rosto
    ex,ey=fx+fw*0.5, fy+fh*0.46
    g.append(olho(ex-110,ey,'feliz',cor=cor)); g.append(olho(ex+110,ey,'feliz',cor=cor)); g.append(boca(ex,ey+40,'sorriso',cor=cor))
    # coração e braços
    ay=fy+fh*0.72
    g.append(heart(ex,ay+30,130,'none',cor,larg))
    g.append(f'<path d="M{fx-10},{ay-40} Q{fx+50},{ay+90} {ex-105},{ay+70}" {st}/><path d="M{fx+fw+10},{ay-40} Q{fx+fw-50},{ay+90} {ex+105},{ay+70}" {st}/>')
    g.append(f'<circle cx="{ex-108}" cy="{ay+72}" r="30" fill="{cor}"/><circle cx="{ex+108}" cy="{ay+72}" r="30" fill="{cor}"/>')
    # pernas e pés
    g.append(f'<path d="M{fx+150},{fy+fh} L{fx+128},{fy+fh+140}" {st}/><path d="M{fx+370},{fy+fh} L{fx+392},{fy+fh+140}" {st}/>')
    g.append(f'<ellipse cx="{fx+116}" cy="{fy+fh+156}" rx="46" ry="26" fill="{cor}"/><ellipse cx="{fx+404}" cy="{fy+fh+156}" rx="46" ry="26" fill="{cor}"/>')
    if coracao_solto: g.append(heart(fx+fw+170,fy-150,36,'none',cor,larg*0.8,rot=14))
    return '<g id="simbolo">'+''.join(g)+'</g>'
