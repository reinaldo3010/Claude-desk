# Compõe texto em curvas a partir de uma fonte (fontTools), devolvendo caminhos SVG em unidades de fonte -> px.
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import os
S=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
_cache={}
def fonte(path, axes=None):
    k=(path,tuple(sorted((axes or {}).items())))
    if k in _cache: return _cache[k]
    f=TTFont(path)
    if axes and 'fvar' in f: f=instancer.instantiateVariableFont(f,axes,inplace=False)
    _cache[k]=f; return f
def compor(texto, path, tamanho_px, tracking_em=0.0, axes=None, kern=True, ajustes=None):
    """Devolve (lista de (glifo, path_d, x_avanco), largura_total, ascender_px). Caminhos já em px com y para baixo, baseline em y=0."""
    f=fonte(path,axes); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upm=f['head'].unitsPerEm; e=tamanho_px/upm
    hmtx=f['hmtx']; ajustes=ajustes or {}
    x=0.0; out=[]
    for i,ch in enumerate(texto):
        if ch==' ': x+=hmtx[cmap[ord(' ')]][0]*e if ord(' ') in cmap else tamanho_px*0.25; continue
        gn=cmap[ord(ch)]; g=gs[gn]
        dx=ajustes.get(i,0.0)*tamanho_px; x+=dx
        pen=SVGPathPen(gs); tp=TransformPen(pen,(e,0,0,-e,x,0)); g.draw(tp)
        out.append((ch,pen.getCommands(),x))
        x+=hmtx[gn][0]*e + tracking_em*tamanho_px
    return out, x, f['hhea'].ascent*e
