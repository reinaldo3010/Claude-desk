/** Matrizes autorais do lote Pequenos Prazeres: curvas nativas, paleta da casa. */
import { ilustracao } from './desenho.js';
const P=(d,fill,stroke='--kraft',w=.9)=>({d,fill,stroke,w});
const L=(d,stroke='--kraft',w=.8)=>P(d,undefined,stroke,w);
const C=(x,y,r,fill,stroke='--kraft',w=.9)=>({circulo:[x,y,r],fill,stroke,w});
const R=(x,y,w,h,fill,raio=2)=>({retangulo:[x,y,w,h,raio],fill,stroke:'--kraft',w:.9});
const folha=(x,y,k=1)=>[
 P(`M ${x} ${y} C ${x-22*k} ${y-2*k} ${x-24*k} ${y-24*k} ${x-17*k} ${y-30*k} C ${x+2*k} ${y-23*k} ${x+8*k} ${y-10*k} ${x} ${y} Z`,'--sage','--sage-deep',.65),
 L(`M ${x} ${y} L ${x-16*k} ${y-27*k} M ${x-5*k} ${y-8*k} L ${x-14*k} ${y-9*k} M ${x-10*k} ${y-16*k} L ${x-10*k} ${y-24*k}`,'--sage-deep',.45),
];
const flor=(x,y,k=1)=>[
 ...Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7;return C(x+Math.cos(a)*6*k,y+Math.sin(a)*6*k,4.6*k,'--peach','--peach-ink',.45);}),
 C(x,y,3.5*k,'--sand'),C(x,y,1.1*k,'--kraft'),
];
export const ILUSTRACOES_HOBBIES=Object.freeze({
 'hobby-livro':ilustracao({primary:'--sage',partes:[
  P('M -48 -28 Q -22 -39 0 -24 Q 22 -39 48 -28 L 48 33 Q 20 24 0 38 Q -20 24 -48 33 Z','--sage'),
  P('M -44 -33 Q -20 -40 0 -25 L 0 32 Q -20 19 -44 27 Z','--white'),
  P('M 0 -25 Q 20 -40 44 -33 L 44 27 Q 20 19 0 32 Z','--paper'),
  ...[-20,-11,-2,7,16].flatMap(y=>[L(`M -37 ${y} Q -20 ${y-4} -7 ${y+4}`,'--sand'),L(`M 7 ${y+4} Q 20 ${y-4} 37 ${y}`,'--sand')]),
  P('M 24 -35 L 31 -35 L 31 4 L 27 -1 L 24 4 Z','--peach'),
  L('M -44 30 Q -20 22 0 35 Q 20 22 44 30','--paper'),
 ]}),
 'hobby-marcador':ilustracao({primary:'--peach',partes:[
  P('M -17 -42 L 17 -42 L 17 43 L 0 32 L -17 43 Z','--paper'),
  P('M -13 -38 L 13 -38 L 13 35 L 0 26 L -13 35 Z',undefined,'--sand',.6),
  C(0,-33,2,'--kraft'),L('M 0 -35 C -13 -62 20 -61 5 -37','--peach-ink',1.2),
  L('M 0 25 L 0 -10','--sage-deep'),...folha(0,18,.38),...flor(0,-6,1),
 ]}),
 'hobby-prensa':ilustracao({primary:'--sage',partes:[
  P('M 18 -26 C 55 -34 53 33 20 30 L 20 23 C 39 27 43 -21 20 -19 Z','--sage'),
  R(-26,-28,49,64,'--paper',3),P('M -22 0 Q 0 5 19 0 L 19 29 Q 0 34 -22 29 Z','--kraft'),
  R(-29,-34,55,8,'--sage'),R(-28,32,53,7,'--sage'),L('M -23 -25 L -23 30 M 19 -25 L 19 30','--sage-deep',1.5),
  L('M -2 -25 L -2 25 M -19 25 L 16 25','--paper',1),
  L('M -2 -32 L -2 -48','--kraft',1.6),R(-10,-53,16,6,'--kraft',3),
  L('M -16 -20 L -16 -5','--white',1.6),L('M -14 -42 C -26 -50 -9 -55 -17 -64','--kraft',.7),
 ]}),
 'hobby-graos':ilustracao({primary:'--kraft',partes:[
  P('M -5 -21 C -27 -44 -48 -8 -24 7 C -5 19 11 -7 -5 -21 Z','--kraft','--peach-ink'),
  L('M -12 -24 C -32 -10 -11 -5 -25 4','--paper',1.3),
  P('M 29 -8 C 2 -22 -7 20 18 27 C 44 35 51 6 29 -8 Z','--sand'),
  L('M 29 -4 C 9 0 30 19 16 23','--peach-ink',1.1),...folha(18,-23,.65),
 ]}),
 'hobby-violao':ilustracao({primary:'--peach',partes:[
  P('M -9 -11 C -35 -21 -44 4 -29 15 C -56 40 -22 66 0 48 C 26 65 53 38 28 15 C 44 -8 19 -23 9 -10 Z','--peach'),
  P('M -7 -9 C -29 -15 -35 3 -22 16 C -44 39 -18 56 0 41 C 19 56 42 38 21 16 C 33 0 26 -16 7 -9 Z',undefined,'--paper',1),
  R(-5,-48,10,57,'--kraft',1),P('M -8 -66 L 8 -66 L 6 -45 L -6 -45 Z','--sand'),
  ...[-62,-55,-48].flatMap(y=>[C(-10,y,2,'--kraft'),C(10,y,2,'--kraft')]),
  C(0,14,9,'--peach-ink'),C(0,14,11,undefined,'--kraft',.65),R(-11,34,22,4,'--kraft',1),
  ...[-3,-1.8,-.6,.6,1.8,3].map(x=>L(`M ${x} -60 L ${x} 35`,'--paper',.3)),
  ...[-36,-27,-18,-9].map(y=>L(`M -4 ${y} L 4 ${y}`,'--paper',.45)),
 ]}),
 'hobby-vinil':ilustracao({primary:'--sage',partes:[
  R(-46,-45,90,90,'--paper',3),P('M -46 22 L 17 -45 L 44 -45 L 44 45 L -46 45 Z','--sage'),
  C(0,0,38,'--ink-soft','--kraft'),...[31,27,23,19].map(r=>C(0,0,r,undefined,'--kraft',.4)),
  C(0,0,13,'--peach'),C(0,0,3,'--paper'),L('M -24 -20 Q -33 -5 -25 14','--paper',.8),
  ...flor(29,30,.6),
 ]}),
 'hobby-regador':ilustracao({primary:'--sage',partes:[
  P('M 19 -23 C 65 -52 69 28 25 19 L 24 12 C 54 25 57 -36 20 -15 Z','--sage'),
  P('M -23 -14 L -41 -30 L -47 -19 L -29 16 Z','--sage'),
  P('M -53 -34 L -36 -29 L -41 -16 L -57 -23 Z','--sand'),
  P('M -28 -21 Q 0 -27 28 -21 L 23 31 Q 0 43 -23 31 Z','--sage'),
  P('M -28 -21 Q 0 -32 28 -21 Q 0 -14 -28 -21 Z','--paper'),
  L('M -19 -9 L -15 25','--paper',1.1),...flor(4,7,1),
  L('M -55 -12 L -59 -5 M -49 -10 L -52 -2 M -43 -6 L -46 2','--sage-deep',.9),
 ]}),
 'hobby-ferramentas':ilustracao({primary:'--peach',partes:[
  P('M -31 0 Q -49 -20 -24 -38 Q 1 -20 -17 0 Z','--sage'),
  L('M -24 -30 L -24 11','--sage-deep',1),R(-29,1,10,40,'--peach',4),C(-24,32,2,'--paper'),
  L('M 14 -36 L 14 -14 Q 24 0 34 -14 L 34 -36 M 24 -36 L 24 1','--kraft',2),
  R(19,1,10,40,'--peach',4),C(24,32,2,'--paper'),...folha(0,39,.55),
 ]}),
 'hobby-mala':ilustracao({primary:'--peach',partes:[
  P('M -13 -33 L -13 -43 Q 0 -49 13 -43 L 13 -33','--paper','--kraft',2),
  R(-47,-32,94,68,'--peach',6),R(-40,-26,80,55,undefined,4),
  R(-31,-32,8,68,'--sand',1),R(23,-32,8,68,'--sand',1),R(-34,-5,14,12,'--kraft'),R(20,-5,14,12,'--kraft'),
  R(-30,-2,6,5,'--paper',0),R(24,-2,6,5,'--paper',0),
  P('M -13 -16 L 14 -12 L 10 15 L -16 11 Z','--paper'),
  P('M -12 6 L -3 -4 L 3 2 L 7 -1 L 11 10 Z','--sage'),C(6,-6,3,'--sand'),
  C(-29,40,4,'--kraft'),C(29,40,4,'--kraft'),
 ]}),
 'hobby-camera':ilustracao({primary:'--sage',partes:[
  P('M -44 -20 L -20 -20 L -13 -31 L 13 -31 L 20 -20 L 44 -20 L 44 31 L -44 31 Z','--sage'),
  R(-41,-4,82,31,'--paper',2),C(0,4,25,'--kraft'),C(0,4,21,'--ink-soft'),C(0,4,14,'--sage-deep'),C(0,4,8,'--sage'),
  L('M -14 2 Q -10 -12 3 -11','--paper',1.3),C(7,12,3,'--paper'),
  R(-35,-15,13,7,'--sand',1),R(25,-17,11,7,'--white',1),R(-30,-25,11,5,'--kraft',1),
  L('M -43 -10 C -71 -20 -57 49 -40 31 M 43 -10 C 64 -20 59 45 43 31','--kraft',1.3),
 ]}),
 'hobby-avental':ilustracao({primary:'--peach',partes:[
  L('M -13 -30 C -22 -68 22 -68 13 -30','--kraft',3),
  P('M -14 -32 L 14 -32 Q 14 -10 31 -7 L 37 49 Q 0 57 -37 49 L -31 -7 Q -14 -10 -14 -32 Z','--peach'),
  L('M -26 -3 L -31 43 Q 0 50 31 43 L 26 -3','--paper',.8),
  P('M -15 16 L 15 16 L 14 31 Q 0 42 -14 31 Z','--paper'),...flor(0,25,.7),
  L('M -29 -5 C -54 -13 -54 4 -32 1 M 29 -5 C 54 -13 54 4 32 1','--kraft',1.5),
 ]}),
 'hobby-fouet':ilustracao({primary:'--paper',partes:[
  P('M -1 -2 C -38 -30 -26 -59 0 -60 C 26 -59 38 -30 1 -2 Z','--paper'),
  L('M 0 -3 C -25 -32 -16 -58 0 -60 C 16 -58 25 -32 0 -3 M 0 -59 L 0 -3','--kraft',.9),
  R(-6,-2,12,51,'--sage',4),R(-7,-3,14,7,'--sand',1),C(0,41,2,'--paper'),
  L('M -3 10 L -3 33','--paper',.8),
 ]}),
});
