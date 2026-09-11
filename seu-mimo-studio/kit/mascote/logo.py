import os
# Constrói o letreiro "Seu Mimo" (DM Serif Display) + "STUDIO" (Montserrat 500) e compara com a prancha.
import sys, re, numpy as np
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from tipo import compor, S
from PIL import Image
DM=f'{S}/fontes/DMSerifDisplay-Regular.ttf'; MONT=f'{S}/fontes/Montserrat[wght].ttf'
def letreiro(tam=300, track=-0.012, escala_x=1.0, ajustes=None):
    gl,larg,asc=compor('Seu Mimo', DM, tam, track, ajustes=ajustes)
    paths=''.join(f'<path d="{d}"/>' for _,d,_ in gl)
    return f'<g id="seu-mimo" transform="scale({escala_x} 1)">{paths}</g>', larg*escala_x
def studio(tam=100, track=0.62, wght=500):
    gl,larg,asc=compor('STUDIO', MONT, tam, track, axes={'wght':wght})
    larg-=track*tam  # sem o tracking final
    return f'<g id="studio">'+''.join(f'<path d="{d}"/>' for _,d,_ in gl)+'</g>', larg
if __name__=='__main__':
    # alvo: na prancha (4x) o letreiro ocupa 1818 px de largura e ~342 px de altura (S até o pé), STUDIO 1061 px de largura, 124 px de altura
    for track in (-0.02,-0.012,0.0):
        g,larg=letreiro(300,track); print('track',track,'largura',round(larg))
    g,larg=letreiro(300,-0.012)
    esc=1818/larg
    g,larg=letreiro(300*esc,-0.012); print('letreiro final largura', round(larg))
    gs,largs=studio(100,0.62); escs=1061/largs; gs,largs=studio(100*escs,0.62); print('studio largura', round(largs))
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -400 1900 700"><g fill="#000" transform="translate(26 0)">{g}</g><g fill="#000" transform="translate(400 240)">{gs}</g></svg>'
    open(f'{S}/build/letreiro-teste.svg','w').write(svg); print('svg ok')
