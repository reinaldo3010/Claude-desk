"""Original, editable botanical/stationery vector illustrations for the existing 67 IDs."""
from pathlib import Path
import math,json,xml.etree.ElementTree as ET
from collections import Counter
import fitz
ROOT=Path(__file__).resolve().parent
SITE=ROOT.parents[3]
DEST=SITE/'marca/kit/svg/colecoes-refinadas';DEST.mkdir(parents=True,exist_ok=True)
PRIMARIOS=json.loads((Path(__file__).parent/'primarios.json').read_text(encoding='utf-8')) if (Path(__file__).parent/'primarios.json').exists() else {}
BASE=json.loads((ROOT/'referencia-geometrica.json').read_text(encoding='utf-8'))
INK='#4A443D';CREAM='#FBF6EF';WHITE='#FFFDF8';SAND='#E7D8C3';GOLD='#C9A57E';PEACH='#FFB59C';RUST='#A25030';SAGE='#A8C5A2';GREEN='#6E8C67'
TOK={INK:'--ink-soft',CREAM:'--paper',WHITE:'--white',SAND:'--sand',GOLD:'--kraft',PEACH:'--peach',RUST:'--peach-ink',SAGE:'--sage',GREEN:'--sage-deep','#171512':'--ink'}
def p(d,f='none',s=INK,w=.9):return f'<path d="{d}" fill="{f}" stroke="{s}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def e(x,y,rx,ry,f='none',s=INK,w=.9):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{f}" stroke="{s}" stroke-width="{w}"/>'
def c(x,y,r,f='none',s=INK,w=.9):return e(x,y,r,r,f,s,w)
def g(a,x=0,y=0,k=1,r=0):return f'<g transform="translate({x} {y}) rotate({r}) scale({k})">{a}</g>'
def rect(x,y,w,h,f='none',s=INK,sw=.9,r=1):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{f}" stroke="{s}" stroke-width="{sw}"/>'
def line(x,y,a,b,s=INK,w=.65):return p(f'M{x} {y} L{a} {b}','none',s,w)
def star(x,y,k=1):return g(p('M0 -8 Q1 -1 8 0 Q1 1 0 8 Q-1 1 -8 0 Q-1 -1 0 -8Z',GOLD,'none'),x,y,k)
def leaf(x=0,y=0,k=1,r=0,col=SAGE):
    a=p('M0 0 C-12 -7 -13 -23 -7 -31 C5 -29 16 -12 0 0Z',col,GREEN,.55)+p('M0 0 Q-6 -16 -7 -27','none',GREEN,.48)
    for i in range(3):a+=p(f'M{-1-i*1.5} {-6-i*6} Q{-5-i*2} {-9-i*6} {-8-i*1.4} {-9-i*6}','none',GREEN,.3)
    return g(a,x,y,k,r)
def branch(x=0,y=0,k=1,r=0):
    a=p('M0 26 C-12 2 3 -23 -5 -47','none',GREEN,.65)
    for i in range(5):a+=leaf((-1)**i*2,17-i*12,.43,(-1)**i*58, SAGE if i%2 else SAND)
    return g(a,x,y,k,r)
def rose(x=0,y=0,k=1):
    a=''
    for i in range(7):a+=g(p('M-2 1 C-23 -1 -21 -21 -9 -22 C0 -25 13 -18 8 -8Z',PEACH,RUST,.48),r=i*360/7)
    a+=p('M-10 2 C-17 -13 5 -19 12 -6 C19 8 2 18 -10 8 C-15 3 -3 -6 4 -3 C12 1 4 8 0 4',SAND,RUST,.65)
    return g(a,x,y,k)
def daisy(x=0,y=0,k=1):
    a=''.join(g(e(0,-10,3.6,10,WHITE,GOLD,.5),r=i*30) for i in range(12))+c(0,0,4.6,GOLD,RUST,.5)
    for i in range(9):a+=c(math.cos(i*2.4)*2.7,math.sin(i*2.4)*2.7,.45,RUST,'none')
    return g(a,x,y,k)
def bouquet():
    a=''.join(line(-10+i*5,44,-29+i*14,-19,GREEN,.9) for i in range(5))
    a+=branch(-12,19,.7,-29)+branch(19,11,.7,34)+leaf(7,28,.7,55)
    a+=rose(-19,-15,.83)+rose(13,-26,.8)+daisy(33,-8,.7)+daisy(-5,0,.65)
    a+=g(bow(),0,29,.4)
    return a
def bow():
    a=p('M-4 -1 C-18 -20 -42 -22 -41 -7 C-40 9 -17 15 -4 4Z',PEACH,RUST,.8)+p('M4 -1 C18 -20 42 -22 41 -7 C40 9 17 15 4 4Z',PEACH,RUST,.8)
    a+=p('M-7 3 Q-9 25 -29 35 L-26 22 L-39 22 Q-19 13 -13 0Z',SAND,RUST,.6)+p('M7 3 Q9 25 29 35 L26 22 L39 22 Q19 13 13 0Z',SAND,RUST,.6)
    a+=p('M-8 -5 Q0 -10 8 -5 L7 7 Q0 11 -7 7Z',PEACH,RUST,.65)
    a+=p('M-12 -1 Q-29 -12 -35 -9 M12 -1 Q29 -12 35 -9 M-7 11 Q-12 23 -25 28 M7 11 Q12 23 25 28','none',RUST,.45)
    return a
def wreath(kind='round'):
    a=''
    for i in range(12):
        ang=-165+i*27;rad=math.radians(ang)
        a+=g(branch(0,0,.48),math.cos(rad)*38,math.sin(rad)*38,1,ang+105)
    a+=rose(-21,30,.55)+daisy(8,40,.48)+rose(31,23,.45)
    return a
def heart():return p('M0 41 C-25 25 -49 4 -43 -17 C-38 -40 -12 -41 0 -22 C12 -41 38 -40 43 -17 C49 4 25 25 0 41Z',PEACH,RUST,.85)+p('M-34 -13 C-32 -30 -15 -31 -8 -21','none',WHITE,1.7)
def paw():
    a=p('M0 -1 C-9 -3 -12 5 -18 10 C-25 19 -18 28 -10 25 Q0 20 10 25 C18 28 25 19 18 10 C12 5 9 -3 0 -1Z',GOLD,RUST,.7)
    for x,y,rx,ry,r in [(-22,-7,5,8,-30),(-9,-20,5.5,8.5,-12),(9,-20,5.5,8.5,12),(22,-7,5,8,30)]:a+=g(e(0,0,rx,ry,GOLD,RUST,.6),x,y,1,r)
    a+=p('M-12 14 Q-6 7 -3 5','none',SAND,1.1)
    return a
def eyes(x=0,y=0,span=12):
    a=''
    for s in [-1,1]:
        a+=p(f'M{x+s*span-4} {y} Q{x+s*span} {y-3.2} {x+s*span+4} {y}','none',INK,.8)
        a+=e(x+s*span,y,2.1,2.5,INK,'none')+c(x+s*span-.6,y-.8,.65,WHITE,'none')
    return a
def dog(head=True):
    a=p('M-24 -28 C-45 -30 -52 -8 -47 17 C-45 30 -35 36 -26 22 C-21 9 -23 -5 -16 -20Z',GOLD,INK,.7)+p('M24 -28 C45 -30 52 -8 47 17 C45 30 35 36 26 22 C21 9 23 -5 16 -20Z',GOLD,INK,.7)
    a+=p('M-27 -20 C-21 -42 -7 -45 0 -40 C9 -46 28 -35 31 -15 C35 -7 34 4 28 13 C26 33 13 40 0 39 C-17 39 -30 29 -31 12 C-38 -2 -34 -9 -27 -20Z',SAND,INK,.8)
    a+=p('M-25 -22 C-12 -39 -4 -31 -6 -12 C-8 2 -16 5 -27 1Z',GOLD,'none')
    a+=p('M-18 15 C-15 1 -3 6 0 9 C5 2 18 4 20 17 C22 33 -18 34 -18 15Z',WHITE,GOLD,.4)+eyes(0,-4,12)
    a+=p('M-6 11 C-8 6 7 6 6 11 Q4 17 0 17 Q-4 17 -6 11Z',INK,'none')+p('M0 17 L0 22 Q-6 29 -12 24 M0 22 Q6 29 12 24','none',INK,.7)
    for x,y in [(-28,-20),(-30,-13),(27,-19),(30,-11),(-39,-4),(-40,4),(40,0),(39,8)]:a+=p(f'M{x} {y} Q{x-1} {y+4} {x+1} {y+7}','none',RUST,.35)
    a+=p('M-5 -30 Q-3 -33 0 -30 M1 -33 Q4 -35 6 -30','none',GOLD,.45)
    if head:return a
    body=p('M21 32 C50 47 56 17 44 6 C50 28 36 31 25 22','none',GOLD,5)
    body+=p('M-16 -11 C-29 -6 -34 13 -33 32 L-39 45 Q-37 55 -21 51 L23 51 Q40 53 38 43 L29 31 C34 13 24 -7 14 -12Z',GOLD,INK,.8)
    body+=p('M-13 2 Q0 14 14 0 L10 36 Q0 49 -10 35Z',SAND,'none')+p('M-18 19 L-20 43 Q-30 39 -28 49 M17 19 L18 44 Q29 41 29 49','none',INK,.65)
    body+=g(a,0,-26,.7)+g(bow(),0,6,.32)
    return body
def cat(head=True):
    a=p('M-28 -9 Q-38 -28 -32 -43 Q-18 -43 -9 -29 Q0 -33 12 -28 Q24 -44 33 -40 Q37 -19 29 -5 C39 18 23 35 0 36 C-25 34 -40 17 -28 -9Z',SAND,INK,.75)
    a+=p('M-28 -33 L-24 -16 L-15 -24Z M27 -31 L24 -15 L16 -23Z',PEACH,RUST,.4)
    a+=p('M-14 -28 Q-10 -18 -7 -15 M0 -30 L1 -17 M14 -27 Q11 -20 9 -15','none',GOLD,2)
    a+=eyes(0,-2,12)+p('M-4 10 Q0 7 4 10 L0 15Z',RUST,'none')+p('M0 15 L0 19 Q-5 24 -9 20 M0 19 Q5 24 9 20','none',INK,.65)
    for s in [-1,1]:
        for yy,ey in [(10,5),(14,14),(18,24)]:a+=p(f'M{s*15} {yy} Q{s*29} {ey-2} {s*43} {ey}','none',GOLD,.6)
    if head:return a
    body=p('M17 44 C60 49 45 0 35 7 C29 12 44 34 25 30','none',GOLD,6)
    body+=p('M-15 -6 C-33 13 -20 28 -28 45 Q-35 54 -16 53 L17 53 Q33 52 25 42 C18 29 32 11 15 -8Z',SAND,INK,.75)
    body+=p('M-8 19 L-7 48 M7 19 L8 48 M-15 50 L-13 45 M15 50 L13 45','none',GOLD,.7)+g(a,0,-20,.72)+g(bow(),0,11,.27)
    return body
def rabbit():
    a=g(p('M-8 2 C-24 -28 -15 -61 -5 -61 C9 -61 14 -28 7 2Z',CREAM,GOLD,.8),-14,-13,1,-14)+g(p('M-6 -4 C-15 -28 -9 -52 -5 -51 C0 -40 3 -18 0 -5Z',PEACH,'none'),-14,-13,1,-14)
    a+=g(p('M-8 2 C-17 -26 -7 -60 3 -59 C18 -54 19 -27 7 2Z',CREAM,GOLD,.8),15,-12,1,13)
    a+=p('M-24 10 C-38 40 -21 52 0 52 C29 50 37 31 23 9Z',CREAM,GOLD,.8)+e(0,9,29,24,CREAM,GOLD,.8)+eyes(0,7,10)+p('M-3 17 Q0 15 3 17 L0 21Z',RUST,'none')+p('M0 21 L0 25 M-7 26 Q0 31 7 26','none',GOLD,.6)
    a+=g(bow(),0,35,.36)+e(-16,49,12,6,CREAM,GOLD,.7)+e(17,49,12,6,CREAM,GOLD,.7)
    return a
def bear():
    a=e(-20,-28,12,12,GOLD,INK,.7)+e(20,-28,12,12,GOLD,INK,.7)+e(-20,-28,7,7,SAND,'none')+e(20,-28,7,7,SAND,'none')
    a+=e(0,27,25,29,GOLD,INK,.8)+e(0,27,17,20,SAND,'none')+g(e(0,0,10,23,GOLD,INK,.7),-27,18,1,28)+g(e(0,0,10,23,GOLD,INK,.7),27,18,1,-28)
    a+=e(0,-12,28,25,GOLD,INK,.8)+e(0,-2,13,10,SAND,'none')+eyes(0,-14,11)+p('M-4 -7 Q0 -10 4 -7 Q4 -3 0 -2 Q-4 -3 -4 -7Z',INK,'none')+p('M0 -2 L0 2 Q-4 7 -7 3 M0 2 Q4 7 7 3','none',INK,.55)
    for x in [-17,17]:a+=e(x,48,14,11,GOLD,INK,.7)+e(x,49,8,6,SAND,GOLD,.4)
    return a+g(bow(),0,12,.34)
def house(church=False):
    a=rect(-33,-3,66,47,CREAM,GOLD,.8)+p('M-43 1 L0 -32 L43 1 L37 7 L0 -20 L-37 7Z',PEACH,RUST,.8)
    for y in [9,17,25,33]:a+=line(-31,y,31,y,SAND,.55)
    a+=p('M-10 44 V22 C-10 8 10 8 10 22 V44Z',GOLD,INK,.7)
    a+=c(0,-8,5,SAGE,GREEN,.6)+line(0,-13,0,-3,GREEN,.5)+line(-5,-8,5,-8,GREEN,.5)
    if church:a+=rect(-8,-57,16,29,CREAM,GOLD,.7)+p('M-12 -55 L0 -75 L12 -55Z',SAGE,GREEN,.7)+line(0,-82,0,-72,GREEN,1)+line(-4,-78,4,-78,GREEN,1)+g(branch(),-39,35,.45,-15)+g(branch(),39,35,.45,15)
    else:a+=g(branch(),-36,42,.45,-10)+g(daisy(),30,35,.35)
    return a
def cup(motif='flower'):
    a=e(0,35,38,6,SAND,GOLD,.65)+p('M23 -12 C55 -22 56 19 23 20 L23 13 C42 15 43 -10 25 -5Z',CREAM,GOLD,.8)+p('M-27 -18 L-22 21 Q0 36 22 21 L27 -18Z',CREAM,GOLD,.8)+e(0,-18,27,7,WHITE,GOLD,.7)+e(0,-18,22,4,SAND,'none')
    a+=p('M-20 -8 L-16 13 M-9 -34 C-21 -44 -3 -46 -9 -57 M7 -34 C-5 -44 13 -46 7 -57','none',GOLD,.7)
    a+=g(paw() if motif=='paw' else rose(),0,6,.33)
    return a
def basket(flowers=False):
    a=p('M-31 -4 C-34 -57 35 -57 31 -4','none',GOLD,3)+p('M-36 -4 L-27 39 Q0 48 27 39 L36 -4Z',SAND,GOLD,.9)
    for yy in range(2,39,6):a+=p(f'M{-34+yy*.18} {yy} Q0 {yy+6} {34-yy*.18} {yy}','none',GOLD,.55)
    for xx in range(-25,26,7):a+=p(f'M{xx} -1 L{xx*.72} 41','none',GOLD,.45)
    if flowers:a+=rose(-20,-9,.55)+daisy(1,-17,.7)+rose(23,-7,.6)+leaf(34,-6,.45,65)
    else:
        for x,y,k,r in [(-18,-5,.55,-22),(5,-11,.67,9),(23,-1,.53,26)]:a+=g(egg(),x,y,k,r)
    return a+g(bow(),0,19,.38)
def egg():
    a=p('M0 -38 C-20 -38 -33 -8 -30 13 C-28 40 28 40 30 13 C33 -8 20 -38 0 -38Z',CREAM,GOLD,.8)
    a+=p('M-27 -8 Q0 -2 27 -8 M-30 10 Q0 19 30 10','none',PEACH,2)
    a+=g(rose(),0,1,.42)+leaf(-9,5,.3,-55)+leaf(13,9,.3,55)
    for xx in [-14,0,14]:a+=c(xx,25,1.3,GOLD,'none')
    return a
def rings():
    a=g(e(0,0,21,29,'none',GOLD,4),-16,5,1,-23)+g(e(0,0,21,29,'none',SAND,1),-16,5,1,-23)+g(e(0,0,21,29,'none',GOLD,4),17,5,1,23)
    return a+g(branch(),-29,39,.45,-47)+g(rose(),29,27,.42)+star(23,-34,.6)
def balloon(heartshape=False):
    a=g(heart(),0,-10,.75) if heartshape else e(0,-15,29,37,PEACH,RUST,.7)+p('M-18 -28 Q-18 -42 -5 -45','none',WHITE,2)
    a+=p('M-3 22 L3 22 L5 29 L-5 29Z',PEACH,RUST,.65)+p('M0 29 C-15 42 15 46 0 63','none',GOLD,.75)+g(bow(),0,28,.28)
    return a
def envelope():
    a=rect(-45,-26,90,58,CREAM,GOLD,.8)+p('M-45 -26 L0 9 L45 -26 M-45 32 L-9 2 M45 32 L9 2','none',GOLD,.65)+c(0,8,10,PEACH,RUST,.6)+g(rose(),0,8,.27)
    return a+branch(-41,29,.6,-35)+leaf(42,-15,.52,52)
def dress():
    a=p('M-14 -45 Q0 -35 14 -45 L24 -32 L14 -14 Q18 19 43 45 Q0 60 -43 45 Q-18 19 -14 -14 L-24 -32Z',CREAM,GOLD,.8)
    a+=p('M-14 -45 Q0 -24 14 -45 M-14 -14 Q0 -8 14 -14 M-12 -6 Q-15 21 -29 44 M0 -7 L0 48 M12 -6 Q15 21 29 44','none',GOLD,.65)+g(bow(),0,-11,.36)
    for xx in [-26,-13,0,13,26]:a+=g(daisy(),xx,39,.13)
    return a
def candle():
    a=rect(-13,-22,26,65,CREAM,GOLD,.7)+e(0,-22,13,4,WHITE,GOLD,.6)+p('M0 -32 C-13 -41 -2 -48 0 -60 C14 -47 12 -36 0 -32Z',GOLD,RUST,.55)+p('M0 -33 Q-3 -43 2 -46','none',WHITE,1)+line(0,-31,0,-23,INK,.7)
    return a+g(branch(),-17,43,.62,-28)+g(rose(),16,33,.42)
def cloud():return p('M-33 11 C-57 5 -41 -21 -26 -13 C-27 -42 13 -45 19 -22 C40 -31 56 2 35 12Z',WHITE,GOLD,.8)+p('M-33 6 C-40 4 -42 -2 -39 -7','none',SAND,1.8)
def moon():return p('M17 -45 C-39 -18 -31 39 22 44 C-39 62 -66 7 -37 -29 C-22 -45 -6 -48 17 -45Z',SAND,GOLD,.85)+p('M-27 -27 Q-46 -8 -35 17','none',WHITE,1.2)+g(rose(),-12,38,.5)+star(35,-17,.75)+star(39,21,.45)
def carriage():
    a=p('M-40 -1 C-39 -39 -19 -49 4 -48 L4 2Z',PEACH,RUST,.7)+p('M-40 -1 H39 Q38 33 -3 34 Q-39 28 -40 -1Z',CREAM,GOLD,.8)
    a+=p('M-29 -4 Q-28 -31 1 -43 M-15 -3 Q-13 -27 2 -43 M5 2 L32 -28 L45 -28','none',GOLD,.75)
    a+=line(-17,30,-25,46,GOLD,1)+line(15,29,25,46,GOLD,1)
    for x in [-26,27]:
        a+=c(x,48,10,WHITE,GOLD,1)+c(x,48,3,PEACH,GOLD,.5)
        for deg in range(0,360,60):a+=line(x,48,x+math.cos(math.radians(deg))*9,48+math.sin(math.radians(deg))*9,GOLD,.5)
    return a+g(bow(),1,12,.36)
def bottle():
    a=p('M-6 -36 C-11 -54 10 -54 6 -36Z',SAND,GOLD,.6)+rect(-15,-36,30,10,PEACH,RUST,.7,3)+p('M-15 -26 Q-22 -20 -22 -10 V38 Q-22 46 -12 46 H12 Q22 46 22 38 V-10 Q22 -20 15 -26Z',CREAM,GOLD,.8)
    for y in range(-9,33,7):a+=line(9,y,17,y,GOLD,.6)
    return a+g(rose(),-5,10,.4)+p('M-16 -13 V25','none',WHITE,2)
def boot():
    a=p('M-26 -20 L1 -20 L4 1 Q29 -2 32 14 Q35 31 4 31 H-26 Q-37 29 -35 13Z',CREAM,GOLD,.8)+p('M-28 -20 V-30 H0 V-20 M-32 23 Q0 33 30 21','none',GOLD,.65)+rect(-30,-29,31,12,SAND,GOLD,.7,2)
    for x in range(-26,0,5):a+=line(x,-27,x,-19,WHITE,.7)
    return a+g(bow(),-6,-4,.3)
def pacifier():return e(0,11,33,17,PEACH,RUST,.8)+p('M-10 8 C-19 -20 -8 -27 -6 -41 C-4 -48 5 -48 7 -41 C9 -25 19 -18 10 8Z',SAND,GOLD,.7)+e(0,17,16,19,'none',GOLD,2)+e(0,17,12,15,'none',WHITE,.6)
def onesie():return p('M-17 -43 L-35 -31 L-23 -12 L-15 -18 L-17 18 L-8 39 Q0 28 8 39 L17 18 L15 -18 L23 -12 L35 -31 L17 -43 Q0 -34 -17 -43Z',CREAM,GOLD,.8)+p('M-17 -43 Q0 -19 17 -43 M-16 19 Q0 27 16 19','none',GOLD,.6)+g(rose(),0,-3,.45)+c(-4,29,1,GOLD,'none')+c(4,29,1,GOLD,'none')
def foot():
    a=p('M-8 -8 C-18 -5 -13 7 -11 15 C-7 29 6 28 8 17 C11 4 7 -6 3 -9Z',GOLD,RUST,.6)
    for i in range(5):a+=e(-12+i*6,-17-5*math.sin(i*.65),3.3-i*.35,4.7-i*.35,GOLD,RUST,.5)
    return a
def mobile():
    a=p('M-43 -30 Q0 -49 43 -30 M0 -41 V-60','none',GOLD,1.1)
    for x,y in [(-33,-6),(0,14),(33,-1)]:a+=line(x,-32,x,y-4,GOLD,.6)+g(star(0,0,1.4),x,y)
    return a+g(cloud(),0,43,.58)
def swaddle():return p('M0 -45 Q-29 -40 -27 -13 L-36 18 Q-30 56 0 59 Q30 56 36 18 L27 -13 Q29 -40 0 -45Z',CREAM,GOLD,.8)+e(0,-18,19,20,SAND,GOLD,.55)+p('M-28 -1 L25 31 M28 -1 L-25 31 M-25 31 L14 50','none',GOLD,.65)+p('M-10 -19 Q-7 -22 -4 -19 M4 -19 Q7 -22 10 -19 M-3 -9 Q0 -7 3 -9','none',INK,.6)+g(rose(),0,27,.45)
def shell():
    a=p('M-5 36 C-32 21 -49 -5 -40 -22 Q-29 -36 -19 -29 Q-8 -46 2 -35 Q18 -42 25 -25 Q43 -27 43 -12 C43 10 18 32 5 36Z',CREAM,GOLD,.8)
    for x,y in [(-38,-19),(-24,-27),(-10,-32),(4,-32),(20,-24),(37,-12)]:a+=p(f'M0 33 Q{x*.7} 9 {x} {y}','none',GOLD,.6)
    return a+e(0,35,10,4,SAND,GOLD,.6)
def dove():return p('M-4 5 C-22 -21 -11 -38 -25 -50 C-38 -20 -24 11 -7 20 L-39 37 L-18 35 L-28 46 L0 31 C23 26 28 9 34 -1 L44 -6 L35 -9 C34 -21 16 -22 13 -10 L10 -3 C14 -23 3 -41 -2 -43 C-14 -23 -5 -5 -4 5Z',CREAM,GOLD,.8)+p('M-18 -28 Q-20 -7 -4 13 M-2 -24 Q-2 -5 4 4','none',GOLD,.6)+c(29,-12,1.3,INK,'none')+g(branch(),41,17,.3,65)
def tree():
    a=rect(-5,27,10,22,GOLD,RUST,.5)+p('M0 -54 Q-14 -30 -22 -21 L-13 -21 Q-27 2 -37 11 L-22 10 Q-35 30 -46 35 Q0 46 46 35 Q35 30 22 10 L37 11 Q27 2 13 -21 H22 Q14 -30 0 -54Z',SAGE,GREEN,.85)
    a+=p('M-14 -14 Q0 -5 20 -4 M-26 9 Q0 23 34 25','none',GOLD,1)
    for x,y in [(-12,3),(5,-18),(16,18),(-22,26)]:a+=c(x,y,3,PEACH,RUST,.4)
    return a+star(0,-57,1)+p('M-28 29 L-33 34 M-8 21 L-12 27 M10 3 L14 9','none',GREEN,.45)
def gift():return rect(-34,-14,68,53,CREAM,GOLD,.8)+rect(-37,-22,74,13,SAND,GOLD,.7)+rect(-5,-21,10,60,PEACH,RUST,.5)+g(bow(),0,-23,.72)+p('M-26 -3 L-26 30 M20 1 L25 1 M20 10 L25 10 M20 19 L25 19','none',GOLD,.4)
def stocking():return p('M-18 -39 H17 V8 Q43 8 40 26 C38 42 8 40 -12 31 Q-28 23 -21 8Z',PEACH,RUST,.8)+rect(-23,-46,46,15,CREAM,GOLD,.65,4)+p('M-16 17 Q-4 13 2 32 M25 12 Q20 21 26 33','none',GOLD,.55)+g(rose(),0,-8,.5)+leaf(14,6,.34,50)
def snowman():return e(0,25,31,29,CREAM,GOLD,.75)+c(0,-15,21,CREAM,GOLD,.7)+rect(-21,-45,42,18,SAGE,GREEN,.7,2)+rect(-30,-28,60,6,GREEN,GREEN,.6,2)+p('M-22 3 Q0 10 22 3 L23 12 L5 11 L9 34 L-2 33 L-6 10 L-22 11Z',PEACH,RUST,.65)+eyes(0,-18,7)+p('M0 -11 L17 -7 L0 -5Z',GOLD,RUST,.55)+p('M-7 -3 Q0 2 7 -3','none',GOLD,.6)+c(3,20,1.7,GREEN,'none')+c(5,32,1.7,GREEN,'none')+branch(-34,18,.43,-50)+branch(34,18,.43,50)
def tie():return p('M-13 -45 H13 L8 -30 L20 32 L0 49 L-20 32 L-8 -30Z',SAGE,GREEN,.8)+p('M-8 -30 H8 M-12 -9 L12 -18 M-16 10 L16 -1 M-17 29 L19 18','none',WHITE,1.1)
def glasses():return e(-23,0,20,15,CREAM,GOLD,1.2)+e(23,0,20,15,CREAM,GOLD,1.2)+p('M-3 -3 Q0 -7 3 -3 M-43 -4 L-49 -10 M43 -4 L49 -10','none',GOLD,1.2)+p('M0 22 C-13 13 -18 35 -38 22 C-30 47 -5 40 0 30 C5 40 30 47 38 22 C18 35 13 13 0 22Z',INK,'none')
def hammer():return g(rect(-5,-12,10,59,GOLD,RUST,.6,3)+p('M-27 -33 L2 -36 L10 -28 L27 -27 L28 -14 L9 -14 L2 -22 L-7 -20 L-9 -8 L-20 -8 L-15 -24 L-28 -23Z',SAGE,GREEN,.8)+line(-1,4,-1,37,SAND,1),r=27)
def grill():
    a=e(0,-5,38,9,INK,GOLD,.8)+p('M-38 -5 Q-28 35 0 35 Q28 35 38 -5Z',SAGE,GREEN,.8)+line(-18,30,-27,58,GOLD,1.5)+line(18,30,27,58,GOLD,1.5)+line(-22,49,22,49,GOLD,1)
    for x in range(-25,26,10):a+=line(x,-11,x,-1,SAND,.6)
    return a+p('M-13 -22 C-27 -35 -3 -39 -13 -54 M7 -23 C-7 -37 17 -42 7 -57','none',GOLD,.85)
def lock():return p('M-19 -8 V-28 C-19 -57 19 -57 19 -28 V-8','none',GOLD,5)+p('M-19 -8 V-28 C-19 -57 19 -57 19 -28 V-8','none',SAND,1)+rect(-29,-10,58,51,CREAM,GOLD,.8,10)+g(heart(),0,12,.44)+c(0,11,3.3,RUST,'none')+p('M-1 13 L-2 21 H2 L1 13Z',RUST,'none')
def apple():return p('M0 -27 C-40 -47 -48 -3 -25 32 C-13 48 -3 39 0 39 C6 42 19 46 30 28 C50 -11 32 -43 0 -27Z',PEACH,RUST,.8)+p('M-1 -27 Q-2 -45 8 -49','none',GOLD,2)+leaf(6,-30,.7,64)+p('M-27 -17 C-38 -7 -27 18 -22 21','none',WHITE,1.8)
def books():
    a=''
    for i,col in enumerate([SAGE,SAND,PEACH]):
        y=24-i*20;a+=rect(-42+i*3,y,78,16,CREAM,GOLD,.7,3)+p(f'M-40 {y} H38 V{y+4} H-33 V{y+12} H38 V{y+16} H-40Z',col,GOLD,.65)
        for j in [6,9,12]:a+=line(-28,y+j,31,y+j,SAND,.4)
    return a+g(rose(),22,-21,.45)+leaf(35,-7,.34,50)
def pencil():return g(p('M-8 -43 H8 V29 L0 48 L-8 29Z',GOLD,RUST,.7)+p('M-8 29 H8 L0 48Z',SAND,GOLD,.6)+p('M-2 42 L0 48 L2 42Z',INK,'none')+rect(-8,-52,16,12,PEACH,RUST,.6,3)+line(-3,-38,-3,25,WHITE,.7)+line(3,-38,3,25,RUST,.5),r=24)
def chalkboard():return rect(-47,-30,94,63,GOLD,RUST,.8,3)+rect(-41,-24,82,49,GREEN,GOLD,.6,1)+p('M-26 0 Q0 -13 26 0 M-18 10 H18','none',SAND,.7)+g(rose(),-38,23,.52)+leaf(-28,37,.45,58)+rect(23,25,12,3,WHITE,GOLD,.4,1)
def carrot():return g(p('M-11 -20 Q0 -28 11 -20 Q17 -6 0 48 Q-17 -6 -11 -20Z',PEACH,RUST,.7)+p('M-9 -5 L1 -3 M9 7 L1 10 M-6 21 L1 22','none',RUST,.6)+branch(0,-23,.65,0),r=19)
def bowl():return e(0,-8,38,10,SAGE,GREEN,.8)+p('M-38 -8 Q-30 29 0 31 Q30 29 38 -8 Q0 8 -38 -8Z',SAGE,GREEN,.8)+e(0,-8,30,5,SAND,GOLD,.6)+g(paw(),0,16,.33)+line(-25,20,-20,22,WHITE,1.2)
def bone():return p('M-30 -8 C-38 -22 -53 -11 -43 0 C-53 11 -38 22 -30 8 H30 C38 22 53 11 43 0 C53 -11 38 -22 30 -8Z',CREAM,GOLD,.8)+p('M-28 -3 H27 M-39 -8 Q-43 -10 -44 -6','none',SAND,1)+g(bow(),0,1,.33)
def collar():return p('M-44 -13 Q0 -29 44 -13 L42 1 Q0 -13 -42 1Z',PEACH,RUST,.7)+p('M-41 -9 Q0 -22 41 -9 M-40 -3 Q0 -16 40 -3','none',CREAM,.5)+rect(-7,-19,14,18,'none',GOLD,1.5,2)+c(0,5,4,'none',GOLD,1)+g(heart(),0,24,.37)
def yarn():
    a=c(0,0,32,SAGE,GREEN,.7)
    for i in range(-2,3):a+=p(f'M{-26+i*2} {-17+i*5} Q{-15+i*7} {-4+i*7} {22+i*2} {19+i*4}','none',GREEN,.6)
    a+=p('M-15 -28 C-28 -7 -24 9 -13 28 M-3 -31 C-19 -6 -9 19 3 32 M10 -29 C-3 -11 9 8 26 18 M26 18 C49 22 46 50 63 32','none',GREEN,.65)
    return a
def fish():return p('M-38 0 Q-9 -34 24 -12 L43 -25 L39 0 L43 25 L24 12 Q-9 34 -38 0Z',SAGE,GREEN,.8)+p('M-14 -16 Q-25 0 -14 16 M3 -21 Q-4 -31 11 -29 L21 -17 M-1 21 L15 28 L20 17','none',GREEN,.7)+c(-23,-1,1.8,INK,'none')+p('M-32 6 Q-28 9 -25 6 M27 -8 L36 -17 M27 8 L36 17','none',GREEN,.6)
def tummy():return p('M-14 -54 C-35 -40 -34 -21 -23 -4 C-38 9 -38 47 -28 51 H19 Q39 41 25 13 C42 -2 18 -21 3 -24 L0 -45Z',CREAM,GOLD,.8)+p('M-23 -4 Q-10 -16 9 -7 C27 0 33 14 21 23 Q9 35 -3 27 M-22 0 Q-8 11 10 6 M-28 43 Q-2 51 23 39','none',GOLD,.75)+g(rose(),1,12,.4)
def goblet():return p('M-16 -49 H16 L14 -16 Q12 0 0 0 Q-12 0 -14 -16Z',CREAM,GOLD,.85)+p('M-15 -28 H15 L13 -14 Q0 -1 -13 -14Z',SAND,GOLD,.5)+line(0,0,0,35,GOLD,1)+e(0,37,18,3,CREAM,GOLD,.75)+p('M-11 -44 L-10 -33','none',WHITE,1.3)

ART={
'pet-cao-rosto':dog(),'pet-cao-sentado':dog(False),'pet-ossinho':bone(),'pet-casinha':house(),
'pet-gato-rosto':cat(),'pet-gato-sentado':cat(False),'pet-novelo':yarn(),'pet-peixinho':fish(),
'pet-patinha':paw(),'pet-coracao-pata':heart()+g(paw(),0,-2,.65),'pet-coleira':collar(),'pet-potinho':bowl(),
'pet-pegadas':g(paw(),-20,15,.65,-20)+g(paw(),24,-18,.65,18),'pet-arco-folhas':wreath(),'pet-estrela':star(0,0,3)+p('M-8 9 Q-25 38 -52 39 M0 14 Q-18 46 -39 51','none',GOLD,1)+star(34,-17,.6),'pet-xicara-pata':cup('paw'),
'data-arvore':tree(),'data-meia':stocking(),'data-boneco-neve':snowman(),'data-presente':gift(),'data-guirlanda':wreath(),
'data-buque':bouquet(),'data-moldura-coracao':g(heart(),0,0,1)+g(heart(),0,-1,.85)+rose(-32,15,.55)+leaf(-20,35,.5,-40),
'data-xicara-flor':cup(),'data-gravata':tie(),'data-oculos-bigode':glasses(),'data-martelo':hammer(),'data-churrasqueira':grill(),
'data-coracoes-ligados':g(heart(),-23,0,.65,-15)+g(heart(),24,3,.65,15),'data-balao-coracao':balloon(True),
'data-canecas-casal':g(cup(),-33,0,.63,-8)+g(cup(),34,4,.63,8),'data-cadeado':lock(),'data-maca':apple(),'data-livros':books(),'data-lapis':pencil(),'data-quadro':chalkboard(),'data-coelho':rabbit(),'data-ovo':egg(),'data-cesta':basket(),'data-cenoura':carrot(),
'bebe-chupeta':pacifier(),'bebe-sapatinhos':g(boot(),-13,-7,.75,-15)+g(boot(),15,17,.75,12),'bebe-carrinho':carriage(),'bebe-mamadeira':bottle(),'bebe-macacao':onesie(),'bebe-ursinho':bear(),'bebe-lua':moon(),'bebe-nuvem':cloud()+g(heart(),-16,32,.19)+g(heart(),16,45,.21),'bebe-coracao-pes':heart()+g(foot(),-12,0,.5,-15)+g(foot(),13,0,.5,15),'bebe-balao':balloon(),'bebe-barriga':tummy(),'bebe-movel':mobile(),'bebe-trouxinha':swaddle(),
'convite-aliancas':rings(),'convite-tacas':g(goblet(),-23,0,1,-12)+g(goblet(),23,0,1,12)+star(0,-62,.75),'convite-gravata-borboleta':bow(),'convite-vestido':dress(),'convite-igreja':house(True),'convite-vela':candle(),'convite-concha':shell(),'convite-pomba':dove(),'convite-cestinha':basket(True),'convite-envelope':envelope(),'convite-laco':bow(),'convite-arco':g(branch(),-40,28,1.3,-18)+g(branch(),40,28,1.3,18)+p('M-38 -5 C-40 -75 40 -75 38 -5','none',GOLD,1)+rose(-26,-45,.6)+daisy(11,-51,.6),'convite-coroa':wreath(),'convite-cruz':p('M-6 -50 H6 V-25 H27 V-13 H6 V45 H-6 V-13 H-27 V-25 H-6Z',CREAM,GOLD,.8)+branch(-11,32,.7,-40)+rose(15,29,.48)
}
assert set(ART)==set(BASE['ilustracoes']),set(BASE['ilustracoes'])-set(ART)

def rgb(c):return '#'+''.join(f'{round(v*255):02X}' for v in c) if c else None
def token(c):
    if not c:return None
    h=rgb(c)
    if h not in TOK:
        vals=lambda v:[int(v[i:i+2],16) for i in (1,3,5)]
        h=min(TOK,key=lambda k:sum((a-b)**2 for a,b in zip(vals(k),vals(h))))
    return TOK[h]

specs={};ratios={}
for name,body in ART.items():
    s=f'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="-100 -100 200 200">{body}</svg>'
    doc=fitz.open(stream=s.encode(),filetype='svg');pdf=fitz.open('pdf',doc.convert_to_pdf());draws=pdf[0].get_drawings();scale=200/pdf[0].rect.width
    bounds=fitz.Rect(draws[0]['rect'])
    for drawing in draws[1:]: bounds |= drawing['rect']
    bw=bounds.width*scale;bh=bounds.height*scale
    vx=bounds.x0*scale-100-bw*.075;vy=bounds.y0*scale-100-bh*.075
    master=s.replace('viewBox="-100 -100 200 200"',f'viewBox="{vx:.4f} {vy:.4f} {bw*1.15:.4f} {bh*1.15:.4f}"')
    (DEST/f'{name}.svg').write_text(master,encoding='utf-8')
    parts=[]
    point=lambda a:(a.x*scale-100,a.y*scale-100)
    xy=lambda a:' '.join(f'{v:.4f}' for v in point(a))
    for d in draws:
        commands=[];last=None
        for item in d['items']:
            if item[0] in ['l','c']:
                if point(item[1])!=last:commands.append('M '+xy(item[1]))
                commands.append(item[0].upper()+' '+' '.join(xy(v) for v in item[2:]));last=point(item[-1])
            elif item[0]=='re':
                r=item[1];pts=[r.tl,r.tr,r.br,r.bl] if item[2]==1 else [r.tl,r.bl,r.br,r.tr]
                commands.append('M '+xy(pts[0])+' '+' '.join('L '+xy(v) for v in pts[1:])+' Z');last=None
            elif item[0]=='qu':
                q=item[1];commands.append('M '+xy(q.ul)+' L '+xy(q.ur)+' L '+xy(q.lr)+' L '+xy(q.ll)+' Z');last=None
            else:raise ValueError(item[0])
        if d.get('closePath'):commands.append('Z')
        obj={'d':' '.join(commands)}
        if d.get('fill') is not None:obj['fill']=token(d['fill'])
        if d.get('color') is not None:obj.update(stroke=token(d['color']),w=round((d.get('width') or 1)*scale,4))
        if d.get('even_odd'):obj['evenOdd']=True
        parts.append(obj)
    old=BASE['ilustracoes'][name]
    # A cor principal e a que recebe a tinta escolhida pela pessoa no estudio, entao precisa ser a
    # que cobre o CORPO do desenho. A regra antiga mantinha a cor antiga se ela aparecesse em
    # qualquer lugar, ate num tracinho: 37 desenhos ficaram com a recoloracao morta e a aposta do
    # cha revelacao saiu com os dois baloes rosa. A tabela abaixo foi medida por area renderizada
    # (qa/colecoes-unit.test.mjs cobra que ao menos um preenchimento use a cor principal).
    primary=PRIMARIOS.get(name)
    if primary is None:
        fills=Counter(p['fill'] for p in parts if p.get('fill'))
        primary=fills.most_common(1)[0][0] if fills else old['primary']
        print(f'  aviso: {name} nao esta em primarios.json; escolhi {primary} pelo preenchimento mais comum')
    specs[name]={'primary':primary,'partes':parts}
    ratios[name]=old['altura']/old['largura']
    pdf.close();doc.close()

js="// Matrizes autorais de papelaria, substituindo os mesmos IDs. Gerado por marca/kit/fontes/colecoes-refinadas/gerar.py.\nimport { ilustracao } from './desenho.js';\nconst fontes = "+json.dumps(specs,ensure_ascii=False,separators=(',',':'))+";\nexport const ILUSTRACOES_REFINADAS = Object.freeze(Object.fromEntries(Object.entries(fontes).map(([id,s]) => [id,ilustracao(s)])));\nexport const PROPORCOES_ANTERIORES = "+json.dumps(ratios,separators=(',',':'))+";\n"
(SITE/'simulador/ilustracoes-refinadas.js').write_text(js,encoding='utf-8')
print('67 ilustrações reconstruídas; SVGs mestres e curvas nativas gerados.')
