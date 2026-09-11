import os
# Corações desenhados à mão do logo, em curvas limpas (monolinha, pontas redondas), no espírito da prancha.
def coracao_duplo(cx,cy,s,cor,larg):
    # coração grande em contorno com um coração pequeno dentro, deslocado (como o rabisco acima do "M")
    g=(f'M{cx-s*0.05},{cy+s*0.9} C{cx-s*0.9},{cy+s*0.3} {cx-s*1.15},{cy-s*0.45} {cx-s*0.55},{cy-s*0.62} '
       f'C{cx-s*0.25},{cy-s*0.7} {cx-s*0.05},{cy-s*0.45} {cx},{cy-s*0.25} C{cx+s*0.08},{cy-s*0.5} {cx+s*0.3},{cy-s*0.72} {cx+s*0.6},{cy-s*0.6} '
       f'C{cx+s*1.15},{cy-s*0.4} {cx+s*0.85},{cy+s*0.35} {cx-s*0.05},{cy+s*0.9}')
    p=(f'M{cx+s*0.05},{cy+s*0.35} C{cx-s*0.3},{cy+s*0.1} {cx-s*0.42},{cy-s*0.2} {cx-s*0.18},{cy-s*0.27} '
       f'C{cx-s*0.06},{cy-s*0.3} {cx+s*0.02},{cy-s*0.2} {cx+s*0.05},{cy-s*0.1} C{cx+s*0.1},{cy-s*0.25} {cx+s*0.22},{cy-s*0.32} {cx+s*0.32},{cy-s*0.25} '
       f'C{cx+s*0.52},{cy-s*0.1} {cx+s*0.35},{cy+s*0.15} {cx+s*0.05},{cy+s*0.35}')
    st=f'fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round"'
    return f'<g id="coracao"><path d="{g}" {st}/><path d="{p}" {st}/></g>'
def coracao_simples(cx,cy,s,cor,larg,rot=-12):
    d=(f'M{cx},{cy+s*0.9} C{cx-s*0.9},{cy+s*0.3} {cx-s*1.1},{cy-s*0.5} {cx-s*0.5},{cy-s*0.62} '
       f'C{cx-s*0.2},{cy-s*0.66} {cx},{cy-s*0.4} {cx},{cy-s*0.22} C{cx},{cy-s*0.4} {cx+s*0.2},{cy-s*0.66} {cx+s*0.5},{cy-s*0.62} '
       f'C{cx+s*1.1},{cy-s*0.5} {cx+s*0.9},{cy+s*0.3} {cx},{cy+s*0.9}')
    return f'<path d="{d}" fill="none" stroke="{cor}" stroke-width="{larg}" stroke-linecap="round" stroke-linejoin="round" transform="rotate({rot} {cx} {cy})"/>'
