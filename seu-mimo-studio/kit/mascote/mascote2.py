# Mascote Seu Mimo Studio, redesenho: caixa em perspectiva com tampa de espessura, laço com alças e nó, fita só na tampa
# e caindo na borda direita, rosto centralizado sobre kraft limpo, braços e mãos-luva, pernas com sapatinhos, etiqueta no canto.
COR={'kraft':'#CFA57C','kraft_som':'#B88A5E','kraft_lat':'#A67B52','tampa':'#DDB58D','tampa_borda':'#C6976B',
     'oliva':'#2F2E1E','oliva_luz':'#4B4A33','oliva_som':'#1F1E13','cafe':'#3A2E21','cafe_luz':'#5B4837',
     'off':'#F1E8DA','off_som':'#D9CCBA','rosa':'#E0A48E','sombra':'#C9B9A4','fundo':'#E6D9CA'}
def P(d,fill,**kw):
    extra=''.join(f' {k.replace("_","-")}="{v}"' for k,v in kw.items())
    return f'<path d="{d}" fill="{fill}"{extra}/>'
def C(cx,cy,r,fill,**kw):
    extra=''.join(f' {k.replace("_","-")}="{v}"' for k,v in kw.items()); return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{extra}/>'
def E(cx,cy,rx,ry,fill,**kw):
    extra=''.join(f' {k.replace("_","-")}="{v}"' for k,v in kw.items()); return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{extra}/>'
def tubo(pts,cor,larg):
    d=f'M{pts[0][0]},{pts[0][1]} '+' '.join(f'Q{a},{b} {c},{e}' if len(p)==4 else f'L{p[0]},{p[1]}' for p in pts[1:] for a,b,c,e in [p if len(p)==4 else (0,0,0,0)])
    return f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round"/>'
def heart(cx,cy,s,fill,rot=0,stroke=None,sw=0):
    d=(f'M{cx},{cy+s*0.98} C{cx-s*0.55},{cy+s*0.55} {cx-s*1.05},{cy+s*0.1} {cx-s*1.0},{cy-s*0.32} '
       f'C{cx-s*0.95},{cy-s*0.75} {cx-s*0.45},{cy-s*0.85} {cx},{cy-s*0.35} '
       f'C{cx+s*0.45},{cy-s*0.85} {cx+s*0.95},{cy-s*0.75} {cx+s*1.0},{cy-s*0.32} '
       f'C{cx+s*1.05},{cy+s*0.1} {cx+s*0.55},{cy+s*0.55} {cx},{cy+s*0.98} Z')
    st=f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"' if stroke else ''
    return f'<path d="{d}" fill="{fill}"{st} transform="rotate({rot} {cx} {cy})"/>'
def olhos(ex,ey,tipo,cor):
    r=26; out=[]
    for sx,t in ((-1,tipo[0]),(1,tipo[1])):
        cx=ex+sx*118
        if t=='feliz':   out.append(f'<path d="M{cx-r*1.35},{ey+r*0.35} C{cx-r*0.9},{ey-r*1.3} {cx+r*0.9},{ey-r*1.3} {cx+r*1.35},{ey+r*0.35}" fill="none" stroke="{cor}" stroke-width="17" stroke-linecap="round"/>')
        elif t=='aberto': out.append(C(cx,ey,r*0.85,cor)+C(cx+7,ey-9,7,COR['off']))
        elif t=='grande': out.append(C(cx,ey,r*1.2,cor)+C(cx+10,ey-11,9,COR['off']))
        elif t=='piscando': out.append(f'<path d="M{cx-r*1.2},{ey-r*0.1} C{cx-r*0.6},{ey+r*0.9} {cx+r*0.6},{ey+r*0.9} {cx+r*1.2},{ey-r*0.1}" fill="none" stroke="{cor}" stroke-width="17" stroke-linecap="round"/>')
        elif t=='coracao': out.append(heart(cx,ey,r*1.05,cor))
        elif t=='determinado': out.append(f'<path d="M{cx-r*1.1},{ey+r*0.1} C{cx-r*0.6},{ey-r*0.9} {cx+r*0.6},{ey-r*0.9} {cx+r*1.1},{ey+r*0.1}" fill="none" stroke="{cor}" stroke-width="17" stroke-linecap="round"/>'+f'<path d="M{cx-r*1.3},{ey-r*1.5} L{cx+r*1.1},{ey-r*1.1}" fill="none" stroke="{cor}" stroke-width="13" stroke-linecap="round" transform="scale({sx} 1) translate({-2*cx if sx<0 else 0} 0)"/>')
    return ''.join(out)
def boca(ex,ey,tipo,cor):
    if tipo=='sorriso': return f'<path d="M{ex-20},{ey} C{ex-10},{ey+26} {ex+10},{ey+26} {ex+20},{ey}" fill="none" stroke="{cor}" stroke-width="15" stroke-linecap="round"/>'
    if tipo=='aberto':  return f'<path d="M{ex-30},{ey-2} C{ex-22},{ey+52} {ex+22},{ey+52} {ex+30},{ey-2} Z" fill="{cor}"/>'+f'<path d="M{ex-14},{ey+26} C{ex-6},{ey+40} {ex+6},{ey+40} {ex+14},{ey+26} Z" fill="{COR["rosa"]}"/>'
    if tipo=='o':       return E(ex,ey+12,15,19,cor)
    if tipo=='linha':   return f'<path d="M{ex-18},{ey+8} L{ex+18},{ey+8}" fill="none" stroke="{cor}" stroke-width="14" stroke-linecap="round"/>'
    return ''
def mascote(olhos_t=('feliz','feliz'), boca_t='sorriso', bochechas=True, item='coracao', pose='parado', incl=0, coracoes=0, etiqueta=True):
    # caixa: frente 500x540 em (330,400); lateral esquerda 120 de largura em perspectiva; tampa com espessura 46 e beiral 14
    fx,fy,fw,fh=330,400,500,540; lat=120; pv=52     # pv: recuo vertical da perspectiva
    g=[]
    # sombra no chão
    g.append(E(fx+fw/2-30, fy+fh+205, 300, 26, COR['sombra'], opacity='.55'))
    # pernas
    if pose=='andando':
        g.append(tubo([(fx+150,fy+fh-6),(fx+120,fy+fh+110,fx+70,fy+fh+150)],COR['cafe'],66)); g.append(E(fx+52,fy+fh+166,62,34,COR['cafe']))
        g.append(tubo([(fx+360,fy+fh-6),(fx+390,fy+fh+100,fx+450,fy+fh+150)],COR['cafe'],66)); g.append(E(fx+468,fy+fh+166,62,34,COR['cafe']))
    else:
        g.append(tubo([(fx+150,fy+fh-6),(fx+146,fy+fh+110,fx+130,fy+fh+150)],COR['cafe'],66)); g.append(E(fx+118,fy+fh+168,64,34,COR['cafe']))
        g.append(tubo([(fx+360,fy+fh-6),(fx+364,fy+fh+110,fx+380,fy+fh+150)],COR['cafe'],66)); g.append(E(fx+392,fy+fh+168,64,34,COR['cafe']))
    b=[]
    # lateral esquerda (perspectiva), frente e tampa com espessura + beiral
    b.append(P(f'M{fx-lat},{fy+pv} L{fx},{fy} L{fx},{fy+fh} L{fx-lat},{fy+fh-pv} Z',COR['kraft_lat']))
    b.append(P(f'M{fx-lat},{fy+fh-pv-40} L{fx},{fy+fh-40} L{fx},{fy+fh} L{fx-lat},{fy+fh-pv} Z',COR['oliva_som'],opacity='.10'))  # sombra do chão na lateral
    b.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="18" fill="{COR["kraft"]}"/>')
    b.append(P(f'M{fx},{fy+fh-60} Q{fx+fw/2},{fy+fh-30} {fx+fw},{fy+fh-60} L{fx+fw},{fy+fh-18} Q{fx+fw},{fy+fh} {fx+fw-18},{fy+fh} L{fx+18},{fy+fh} Q{fx},{fy+fh} {fx},{fy+fh-18} Z',COR['kraft_som'],opacity='.35'))
    # tampa: bloco com beiral que avança 14 px sobre a frente e a lateral
    tb=14; te=46
    b.append(P(f'M{fx-lat-tb},{fy+pv-te} L{fx-tb},{fy-te} L{fx+fw+tb},{fy-te} L{fx+fw+tb},{fy-te+te} L{fx-tb},{fy} L{fx-lat-tb},{fy+pv} Z',COR['tampa_borda']))
    b.append(P(f'M{fx-lat-tb},{fy+pv-te} L{fx-lat*0.75-tb},{fy-te-pv*0.85} L{fx+fw*0.92},{fy-te-pv*0.85-18} L{fx+fw+tb},{fy-te} L{fx-tb},{fy-te} Z',COR['tampa']))
    b.append(f'<rect x="{fx-tb}" y="{fy-te}" width="{fw+2*tb}" height="{te}" rx="6" fill="{COR["tampa_borda"]}"/>')
    b.append(f'<rect x="{fx-tb}" y="{fy-te}" width="{fw+2*tb}" height="{10}" fill="{COR["tampa"]}" opacity=".8"/>')
    # fita: sobre a tampa ela vai do laço (centro) até o canto direito e cai pela borda direita da frente, longe do rosto
    topo_y=fy-te-pv*0.85-16; cx_topo=fx+fw*0.5+lat*0.15
    rw=74; rx=fx+fw-rw-14
    b.append(P(f'M{cx_topo-rw/2},{topo_y} L{cx_topo+rw/2},{topo_y} L{rx+rw},{fy-te} L{rx},{fy-te} Z',COR['oliva']))
    b.append(f'<rect x="{rx}" y="{fy-te}" width="{rw}" height="{te}" fill="{COR["oliva_luz"]}"/>')
    b.append(P(f'M{rx},{fy} L{rx+rw},{fy} L{rx+rw-4},{fy+190} L{rx+rw/2},{fy+146} L{rx+4},{fy+190} Z',COR['oliva']))
    # sombra do beiral da tampa sobre a frente
    b.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="22" fill="{COR["oliva_som"]}" opacity=".12"/>')
    # laço grande, assentado na tampa: nó no centro do topo, alças largas apoiadas, pontas curtas caindo sobre a tampa
    bx,by=cx_topo, topo_y-6
    for sg in (-1,1):
        b.append(P(f'M{bx},{by} C{bx+sg*20},{by-230} {bx+sg*400},{by-250} {bx+sg*370},{by-70} C{bx+sg*355},{by+20} {bx+sg*90},{by+30} {bx},{by} Z',COR['oliva']))
        b.append(P(f'M{bx+sg*90},{by-50} C{bx+sg*120},{by-165} {bx+sg*300},{by-175} {bx+sg*290},{by-85} C{bx+sg*280},{by-35} {bx+sg*150},{by-25} {bx+sg*90},{by-50} Z',COR['oliva_luz'],opacity='.42'))
        b.append(P(f'M{bx+sg*10},{by+18} C{bx+sg*70},{by+40} {bx+sg*120},{by+70} {bx+sg*170},{by+112} L{bx+sg*120},{by+128} L{bx+sg*128},{by+100} L{bx+sg*96},{by+118} C{bx+sg*70},{by+80} {bx+sg*36},{by+56} {bx},{by+40} Z',COR['oliva_som']))
    b.append(f'<rect x="{bx-46}" y="{by-40}" width="92" height="70" rx="30" fill="{COR["oliva_luz"]}"/>')
    b.append(f'<rect x="{bx-30}" y="{by-26}" width="60" height="46" rx="20" fill="{COR["oliva"]}" opacity=".55"/>')
    # etiqueta: presa à fita no canto esquerdo da tampa, caindo sobre a lateral
    if etiqueta:
        tx,ty=fx-lat-40, fy+140
        b.append(f'<path d="M{fx-lat*0.5},{fy-te+10} C{fx-lat*0.8},{fy+40} {tx+40},{fy+60} {tx+58},{ty}" fill="none" stroke="{COR["cafe"]}" stroke-width="7" stroke-linecap="round"/>')
        b.append(P(f'M{tx+58},{ty} L{tx+116},{ty+36} L{tx+112},{ty+210} L{tx+4},{ty+210} L{tx},{ty+36} Z',COR['off'],transform=f'rotate(-10 {tx+58} {ty+100})'))
        b.append(P(f'M{tx+4},{ty+196} L{tx+112},{ty+196} L{tx+112},{ty+210} L{tx+4},{ty+210} Z',COR['off_som'],transform=f'rotate(-10 {tx+58} {ty+100})'))
        b.append(C(tx+58,ty+40,9,COR['kraft_lat'],transform=f'rotate(-10 {tx+58} {ty+100})'))
        b.append(heart(tx+58,ty+122,20,'none',rot=-10,stroke=COR['cafe'],sw=7))
    # rosto, centrado na frente (a fita fica na borda direita, longe do rosto)
    ex,ey=fx+fw*0.44, fy+fh*0.45
    b.append(olhos(ex,ey,olhos_t,COR['cafe']))
    if bochechas: b.append(E(ex-150,ey+62,26,17,COR['rosa'],opacity='.75')+E(ex+150,ey+62,26,17,COR['rosa'],opacity='.75'))
    b.append(boca(ex,ey+44,boca_t,COR['cafe']))
    # braços e item
    ay=fy+fh*0.70
    if item=='coracao':
        b.append(heart(ex+10,ay+40,140,COR['oliva']))
        b.append(P(f'M{ex+10-60},{ay-20} C{ex+10-30},{ay-50} {ex+10+20},{ay-50} {ex+10+40},{ay-20}',COR['oliva_luz'],opacity='.5'))
        b.append(tubo([(fx-8,ay-60),(fx+40,ay+90,ex-100,ay+110)],COR['cafe'],60)); b.append(C(ex-98,ay+112,42,COR['cafe']))
        b.append(tubo([(fx+fw+8,ay-60),(fx+fw-40,ay+90,ex+120,ay+110)],COR['cafe'],60)); b.append(C(ex+118,ay+112,42,COR['cafe']))
    elif item=='maos':
        b.append(tubo([(fx-8,ay-60),(fx+80,ay+40,ex-40,ay+20)],COR['cafe'],60)); b.append(tubo([(fx+fw+8,ay-60),(fx+fw-80,ay+40,ex+60,ay+20)],COR['cafe'],60))
        b.append(C(ex-26,ay+22,42,COR['cafe'])); b.append(C(ex+46,ay+22,42,COR['cafe']))
    elif item=='envelope':
        ex2,ey2=ex+30,ay+40
        b.append(tubo([(fx-8,ay-60),(fx+60,ay+80,ex2-120,ey2+50)],COR['cafe'],60)); b.append(tubo([(fx+fw+8,ay-60),(fx+fw-30,ay+70,ex2+130,ey2+40)],COR['cafe'],60))
        b.append(f'<rect x="{ex2-160}" y="{ey2-60}" width="320" height="200" rx="14" fill="{COR["off"]}" transform="rotate(-7 {ex2} {ey2+40})"/>')
        b.append(P(f'M{ex2-160},{ey2-60} L{ex2},{ey2+66} L{ex2+160},{ey2-60}','none',stroke=COR['off_som'],stroke_width='9',stroke_linejoin='round',transform=f'rotate(-7 {ex2} {ey2+40})'))
        b.append(heart(ex2,ey2+98,22,COR['oliva'],rot=-7))
        b.append(C(ex2-120,ey2+52,42,COR['cafe'])); b.append(C(ex2+132,ey2+42,42,COR['cafe']))
    elif item=='aceno':
        b.append(tubo([(fx-8,ay-60),(fx+40,ay+90,ex-100,ay+110)],COR['cafe'],60)); b.append(C(ex-98,ay+112,42,COR['cafe']))
        b.append(tubo([(fx+fw+8,ay-60),(fx+fw+110,ay-130,fx+fw+120,ay-250)],COR['cafe'],60)); b.append(C(fx+fw+124,ay-262,42,COR['cafe']))
    for i in range(coracoes):
        hx,hy,hs=[(fx+fw+180,fy-140,34),(fx+fw+262,fy-40,22),(fx-lat-110,fy-90,26)][i%3]; b.append(heart(hx,hy,hs,COR['oliva'],rot=12*(i+1)))
    g.append(f'<g id="corpo" transform="rotate({incl} {fx+fw/2} {fy+fh+160})">'+''.join(b)+'</g>')
    return ''.join(g)
POSES={
 'feliz':      dict(olhos_t=('feliz','feliz'), boca_t='sorriso', item='coracao'),
 'piscando':   dict(olhos_t=('feliz','piscando'), boca_t='sorriso', item='aceno', coracoes=1),
 'agradecido': dict(olhos_t=('feliz','feliz'), boca_t='sorriso', item='maos'),
 'entregando': dict(olhos_t=('feliz','feliz'), boca_t='sorriso', item='envelope', pose='andando', incl=-5, coracoes=1),
 'surpreso':   dict(olhos_t=('grande','grande'), boca_t='o', item='aceno', bochechas=False, coracoes=2),
}
EXPRESSOES={'feliz':('feliz','feliz','sorriso'),'surpreso':('grande','grande','o'),'piscando':('feliz','piscando','sorriso'),
 'encantado':('coracao','coracao','sorriso'),'sorrindo':('feliz','feliz','aberto'),'determinado':('determinado','determinado','linha')}
def svg(c,fundo=None,vb='40 40 1200 1180'):
    x,y,w,h=vb.split(); return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'+(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fundo}"/>' if fundo else '')+c+'</svg>'
if __name__=='__main__':
    import os; S=os.path.dirname(os.path.abspath(__file__))
    for n,p in POSES.items(): open(f'{S}/m2-{n}.svg','w').write(svg(mascote(**p),COR['fundo']))
    print('m2 ok')

def simbolo(cor=COR['oliva'], larg=18, coracao_solto=True):
    fx,fy,fw,fh=330,400,500,540; lat=120; pv=52; tb=14; te=46
    st=f'fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round"'
    g=[]
    g.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="18" {st}/>')
    g.append(f'<path d="M{fx},{fy} L{fx-lat},{fy+pv} L{fx-lat},{fy+fh-pv} L{fx},{fy+fh}" {st}/>')
    # tampa: só o contorno do topo (sem espessura, para o traço ficar limpo)
    g.append(f'<path d="M{fx-lat-tb},{fy+pv-te} L{fx-lat*0.75-tb},{fy-te-pv*0.85} L{fx+fw*0.92},{fy-te-pv*0.85-18} L{fx+fw+tb},{fy-te} L{fx+fw+tb},{fy} L{fx-tb},{fy} L{fx-lat-tb},{fy+pv}" {st}/>')
    g.append(f'<path d="M{fx-lat-tb},{fy+pv-te} L{fx-tb},{fy-te} L{fx+fw+tb},{fy-te}" {st}/>')
    # fita: só a ponta em andorinha na borda direita
    topo_y=fy-te-pv*0.85-16; cx_topo=fx+fw*0.5+lat*0.15; rw=74; rx=fx+fw-rw-14
    g.append(f'<path d="M{rx},{fy} L{rx+rw-4},{fy} L{rx+rw-4},{fy+190} L{rx+rw/2},{fy+146} L{rx+4},{fy+190} Z" {st}/>')
    # laço
    bx,by=cx_topo, topo_y-6
    for sg in (-1,1):
        g.append(f'<path d="M{bx},{by} C{bx+sg*20},{by-230} {bx+sg*400},{by-250} {bx+sg*370},{by-70} C{bx+sg*355},{by+20} {bx+sg*90},{by+30} {bx},{by} Z" {st}/>')
    g.append(f'<rect x="{bx-46}" y="{by-40}" width="92" height="70" rx="30" fill="{cor}"/>')
    # etiqueta
    tx,ty=fx-lat-40, fy+140
    g.append(f'<path d="M{fx-lat*0.5},{fy-te+10} C{fx-lat*0.8},{fy+40} {tx+40},{fy+60} {tx+58},{ty}" {st}/>')
    g.append(f'<path d="M{tx+58},{ty} L{tx+116},{ty+36} L{tx+112},{ty+210} L{tx+4},{ty+210} L{tx},{ty+36} Z" {st} transform="rotate(-10 {tx+58} {ty+100})"/>')
    g.append(heart(tx+58,ty+122,20,'none',rot=-10,stroke=cor,sw=larg*0.55))
    # rosto
    ex,ey=fx+fw*0.44, fy+fh*0.45
    g.append(olhos(ex,ey,('feliz','feliz'),cor)); g.append(boca(ex,ey+44,'sorriso',cor))
    # coração e braços
    ay=fy+fh*0.70
    g.append(heart(ex+10,ay+40,140,'none',stroke=cor,sw=larg))
    g.append(f'<path d="M{fx-8},{ay-60} Q{fx+40},{ay+90} {ex-100},{ay+110} M{fx+fw+8},{ay-60} Q{fx+fw-40},{ay+90} {ex+120},{ay+110}" {st}/>')
    g.append(C(ex-98,ay+112,34,cor)); g.append(C(ex+118,ay+112,34,cor))
    # pernas e sapatos
    g.append(f'<path d="M{fx+150},{fy+fh} Q{fx+146},{fy+fh+110} {fx+130},{fy+fh+150} M{fx+360},{fy+fh} Q{fx+364},{fy+fh+110} {fx+380},{fy+fh+150}" {st}/>')
    g.append(E(fx+118,fy+fh+168,58,30,cor)); g.append(E(fx+392,fy+fh+168,58,30,cor))
    if coracao_solto: g.append(heart(fx+fw+200,fy-200,36,'none',rot=14,stroke=cor,sw=larg*0.8))
    return '<g id="simbolo">'+''.join(g)+'</g>'
