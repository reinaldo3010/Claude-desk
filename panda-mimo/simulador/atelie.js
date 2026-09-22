/** Lote Ateliê: doze composições autorais, em curvas e camadas independentes. */
import { ilustracao } from './desenho.js';
import { foto, fotoRedonda, frase } from './camadas.js';
import { ILUSTRACOES_REFINADAS } from './ilustracoes-refinadas.js';

const P = (d, fill, stroke = '--kraft', w = 0.9) => ({ d, fill, stroke, w });
const C = (x, y, r, fill, stroke = '--kraft', w = 0.9) => ({ circulo: [x,y,r], fill, stroke, w });
const R = (x,y,w,h,fill,raio=2) => ({ retangulo:[x,y,w,h,raio],fill,stroke:'--kraft',w:0.9 });
const L = (d, stroke = '--kraft', w = 0.8) => P(d, undefined, stroke, w);
const folha = (x,y,s=1,lado=1) => [
  P(`M ${x} ${y} C ${x-22*s*lado} ${y-3*s} ${x-29*s*lado} ${y-22*s} ${x-22*s*lado} ${y-30*s} C ${x-2*s*lado} ${y-28*s} ${x+6*s*lado} ${y-12*s} ${x} ${y} Z`,'--sage','--sage-deep',0.7),
  L(`M ${x} ${y} Q ${x-12*s*lado} ${y-12*s} ${x-21*s*lado} ${y-27*s}`,'--sage-deep',0.6),
];

export const ILUSTRACOES_ATELIE = Object.freeze({
  'atelie-casa': ilustracao({primary:'--peach',partes:[
    R(-39,-12,78,59,'--paper'), P('M -48 -12 L 0 -52 L 48 -12 L 43 -6 L 0 -42 L -43 -6 Z','--peach'),
    R(24,-46,9,20,'--sand'), P('M -48 -12 L 0 -52 L 48 -12','--peach', '--peach-ink',1.1),
    P('M -11 46 L -11 17 C -11 1 11 1 11 17 L 11 46 Z','--kraft'), C(5,28,1.1,'--paper'),
    R(-31,3,14,18,'--white'),R(17,3,14,18,'--white'),L('M -24 3 L -24 21 M -31 12 L -17 12 M 24 3 L 24 21 M 17 12 L 31 12'),
    C(0,-25,6,'--white'),L('M 0 -31 L 0 -19 M -6 -25 L 6 -25'),
    R(-34,25,20,5,'--sand'),R(14,25,20,5,'--sand'),...folha(-22,24,.35),...folha(23,24,.35,-1),
    L('M -42 47 L 42 47'),L('M -33 35 L -18 35 M 18 35 L 33 35','--sand'),
  ]}),
  'atelie-chaves': ilustracao({primary:'--kraft',partes:[
    C(-13,-22,15,'--paper','--kraft',2.1), C(-13,-22,7,undefined,'--kraft',1.2),
    P('M -17 -7 L -17 43 L -6 43 L -6 36 L 1 36 L 1 29 L -10 29 L -10 -7 Z','--sand'),
    P('M 8 -4 C -2 -11 3 -27 14 -29 C 29 -34 41 -15 30 -5 L 12 31 L 24 38 L 27 32 L 22 29 L 25 24 L 20 21 L 34 -5 C 48 -26 19 -43 8 -25','--kraft'),
    C(20,-16,7,'--paper'),L('M -9 -37 C -6 -49 18 -47 20 -31'),
    P('M 1 -42 C -19 -60 -34 -42 -20 -37 C -10 -34 -3 -38 1 -42 C 20 -61 35 -44 22 -37 C 13 -33 6 -38 1 -42 Z','--peach'),
    P('M -2 -40 L -12 -18 L -8 -19 L -5 -15 L 3 -39 L 12 -18 L 16 -21 L 20 -19 L 7 -41 Z','--peach'),
  ]}),
  'atelie-planta': ilustracao({primary:'--sage',partes:[
    L('M 0 26 C -5 4 6 -18 0 -45','--sage-deep',1),
    ...folha(0,-22,.75),...folha(1,-6,.75,-1),...folha(-1,12,.65),...folha(0,-40,.5,-1),
    P('M -24 21 L -18 52 Q 0 58 18 52 L 24 21 Z','--paper'),R(-26,17,52,7,'--peach'),
    L('M -13 29 L -10 47 M -4 30 L -3 49 M 5 30 L 4 49 M 14 29 L 11 47','--sand',1),
    P('M -10 38 C -13 30 -23 36 -10 44 C 3 36 -7 30 -10 38 Z','--peach', '--peach-ink',.55),
  ]}),
  'atelie-estetoscopio': ilustracao({primary:'--sage',partes:[
    L('M -30 -41 L -34 -23 C -43 14 14 19 8 -21 L 4 -42','--kraft',3.3),
    L('M -29 -35 L -32 -21 C -37 3 7 7 6 -21 L 3 -35','--sage',4),
    C(-28,-44,4,'--ink-soft'),C(3,-45,4,'--ink-soft'),
    L('M -12 5 L -12 28 C -12 56 37 53 35 21 L 35 3','--sage-deep',3),
    C(35,-5,12,'--paper','--kraft',1.4),C(35,-5,8,'--sage'),C(35,-5,3,'--paper'),
    P('M -27 29 C -35 12 -51 30 -27 45 C -3 30 -19 12 -27 29 Z','--peach','--peach-ink',.8),
    L('M -38 30 L -32 30 L -29 24 L -25 37 L -21 29 L -17 29','--paper',1),
  ]}),
  'atelie-prancheta': ilustracao({primary:'--sage',partes:[
    R(-36,-48,65,97,'--sand',4),R(-31,-40,55,81,'--white',2),R(-15,-52,25,12,'--sage',3),
    L('M -24 -22 L 17 -22 M -24 -12 L 17 -12 M -24 -2 L -8 -2','--sand'),
    P('M -22 30 L -22 12 L -5 -1 L 13 12 L 13 30 Z',undefined,'--sage-deep',1),
    L('M -28 12 L -5 -7 L 19 12 M -9 30 L -9 17 L 0 17 L 0 30','--sage-deep',1),
    P('M 32 -33 L 41 -30 L 20 39 L 13 47 L 13 35 Z','--peach'),
    L('M 36 -31 L 17 36'),P('M 13 40 L 13 47 L 18 42 Z','--ink-soft'),
  ]}),
  'atelie-caderno': ilustracao({primary:'--peach',partes:[
    R(-36,-44,72,89,'--peach',4),R(-29,-38,61,76,'--paper',2),
    ...[-28,-14,0,14,28].map(y=>L(`M -39 ${y} C -48 ${y-8} -26 ${y-8} -29 ${y}`,'--kraft',1.4)),
    R(-17,-23,36,23,'--white',2),L('M -10 -15 L 12 -15 M -7 -8 L 9 -8','--sage-deep'),
    L('M -15 12 L 20 12 M -15 20 L 20 20 M -15 28 L 10 28','--sand'),
    P('M 19 -44 L 27 -44 L 27 5 L 23 0 L 19 5 Z','--sage'),
  ]}),
  'atelie-bicicleta': ilustracao({primary:'--sage',partes:[
    C(-40,22,25,'--white','--kraft',1.8),C(40,22,25,'--white','--kraft',1.8),
    ...[-40,40].flatMap(x=>[L(`M ${x-22} 22 L ${x+22} 22 M ${x} 0 L ${x} 44 M ${x-16} 6 L ${x+16} 38 M ${x-16} 38 L ${x+16} 6`,'--sand',.65),C(x,22,2,'--kraft')]),
    L('M -40 22 L -17 -12 L 4 22 L -40 22 M -17 -12 L 29 -12 L 4 22 M 40 22 L 26 -26','--sage-deep',2.5),
    L('M -40 22 L -17 -12 L 4 22 M -17 -12 L 29 -12','--sage',1.4),
    L('M -17 -12 L -22 -25 M 26 -26 L 25 -32 L 35 -34','--kraft',1.5),
    P('M -31 -27 Q -20 -31 -12 -27 L -13 -23 L -30 -23 Z','--kraft'),
    C(4,22,5,'--paper'),L('M 4 22 L 13 28 L 19 28','--kraft',1.4),
    P('M 29 -30 L 51 -30 L 47 -13 L 33 -13 Z','--sand'),
    L('M 34 -27 L 36 -16 M 40 -27 L 40 -16 M 46 -27 L 44 -16 M 32 -23 L 48 -23','--kraft',.65),
    ...folha(38,-30,.4),...folha(42,-30,.36,-1),C(36,-42,4,'--peach'),C(47,-39,4,'--peach'),
  ]}),
  'atelie-halter': ilustracao({primary:'--sage',partes:[
    R(-25,-4,50,8,'--sand'),R(-40,-19,11,38,'--sage',3),R(-29,-25,11,50,'--sage',3),
    R(18,-25,11,50,'--sage',3),R(29,-19,11,38,'--sage',3),R(-47,-7,7,14,'--kraft'),R(40,-7,7,14,'--kraft'),
    L('M -35 -14 L -35 12 M -24 -19 L -24 18 M 24 -19 L 24 18 M 35 -14 L 35 12','--paper',1),
    L('M -12 -2 L -12 2 M -6 -2 L -6 2 M 0 -2 L 0 2 M 6 -2 L 6 2 M 12 -2 L 12 2','--kraft',.6),
  ]}),
});

/** Largura física em mm; preserva a proporção nativa, sem a adaptação dos modelos antigos. */
const I = (id,forma,x,y,mm,rotacao=0) => ({id,tipo:'enfeite',rotulo:forma.replace('atelie-','').replaceAll('-',' '),forma,x,y,tamanho:mm/90,rotacao,
  cor:(ILUSTRACOES_ATELIE[forma] || ILUSTRACOES_REFINADAS[forma]).primary});
const T = (id,texto,x,y,mm,largura=.3,fonte='Nunito',cor='--ink-soft') => frase(id,texto,texto,x,y,mm,{largura,fonte,cor});
const F = (id,x,y,w,h,forma='arredondado') => foto(id,'Sua foto',forma,x,y,w,h);
const D = (id,x,y,w) => fotoRedonda(id,'Sua foto',x,y,w);
const M = (id,categoria,nome,descricao,camadas,semente,fundo='--white') => ({id:`atelie-${id}`,categoria,nome,descricao,camadas,semente,fundo,
  enfeites:{formas:['bolinha'],cores:['--sand'],quantidade:7,tamanho:[1.3,2.1]}});

export const CATEGORIAS_ATELIE = Object.freeze([
  {id:'profissoes',grupo:'Profissões e vocações',nome:'Profissões e vocações',descricao:'Saúde, educação, projetos e quem empreende'},
  {id:'casa-nova',grupo:'Momentos',nome:'Casa nova',descricao:'Primeiras chaves, plantas e histórias do novo lar'},
]);

export const MODELOS_ATELIE = Object.freeze([
  M('cuidar','profissoes','Cuidar floresce','Enfermagem e saúde: retrato em círculo, estetoscópio e dedicatória botânica',[
    I('ramo','convite-coroa',.2,.43,64),D('foto',.2,.43,.19),
    T('titulo','Cuidar é um dom',.66,.28,12,.42,'Caveat','--peach-ink'),
    T('nome','Enf. Mariana',.66,.48,8,.34),T('dedicatoria','carinho em cada cuidado',.66,.65,4.8,.38),
    I('esteto','atelie-estetoscopio',.9,.81,17),I('flor','data-buque',.43,.81,15),
  ],901),
  M('ensinar','profissoes','Quem ensina, semeia','Professoras e professores: título em duas linhas e retrato acompanhado de livros',[
    T('linha1','Quem ensina,',.26,.27,10,.4),T('linha2','semeia futuros.',.26,.45,11,.43,'Caveat','--peach-ink'),
    T('nome','Profa. Helena',.26,.68,5.5,.32),I('livros','data-livros',.49,.83,20),
    F('foto',.75,.4,.29,.6),T('legenda','com carinho, sua turma',.75,.79,5.3,.31,'Caveat'),I('folhas','atelie-planta',.94,.75,13),
  ],902,'--paper'),
  M('projetar','profissoes','Ideias que viram lar','Arquitetura: dois registros do projeto e assinatura com prancheta ilustrada',[
    F('foto1',.19,.39,.2,.5,'retangulo'),F('foto2',.44,.39,.2,.5,'retangulo'),
    T('legenda','do primeiro traço à vida real',.315,.76,5.8,.47,'Caveat','--peach-ink'),
    I('prancheta','atelie-prancheta',.77,.3,24),T('nome','Arq. Laura',.77,.62,7.5,.32),T('linha','ideias que acolhem',.77,.79,4.7,.3),I('planta','atelie-planta',.59,.86,11),
  ],903),
  M('empreender','profissoes','Feito por mim','Empreendedorismo e artesanato: fotografia ampla do trabalho com caderno e assinatura autoral',[
    F('foto',.34,.37,.51,.55),T('legenda','feito à mão, com o coração',.34,.8,7,.5,'Caveat','--peach-ink'),
    I('caderno','atelie-caderno',.79,.26,21),I('laco','convite-laco',.91,.54,15),
    T('nome','Ateliê da Bia',.78,.62,7.5,.3),T('linha','meu sonho ganhou forma',.78,.79,4.4,.31),
  ],904,'--paper'),
  M('primeiras-chaves','casa-nova','Nossas primeiras chaves','Chaveiro ilustrado, retrato e data da mudança',[
    I('chaves','atelie-chaves',.18,.42,34),I('ramo','convite-arco',.49,.45,57),D('foto',.49,.43,.19),
    T('titulo','Nosso novo lar',.81,.3,10,.3,'Caveat','--peach-ink'),T('nomes','Lia & Pedro',.81,.5,6.8,.3),T('data','22 de setembro · 2026',.81,.69,4.1,.3),
  ],905),
  M('endereco','casa-nova','Aqui mora a gente','Uma casinha como protagonista, endereço e foto de lembrança',[
    I('casa','atelie-casa',.24,.36,50),T('frase','aqui mora a gente',.24,.79,7.5,.39,'Caveat','--peach-ink'),
    T('nome','Família Oliveira',.63,.23,7.7,.34),T('endereco','Rua das Flores, 120',.63,.41,4.8,.34),
    D('foto',.78,.73,.13),I('planta','atelie-planta',.48,.72,20),
  ],906,'--paper'),
  M('casa-viva','casa-nova','Onde a vida floresce','Duas fotos verticais como díptico, plantas e dedicatória',[
    I('planta','atelie-planta',.13,.4,30),F('foto1',.37,.42,.2,.63),F('foto2',.62,.42,.2,.63),
    T('frase','onde a vida floresce',.495,.85,6.8,.48,'Caveat','--peach-ink'),
    I('chaves','atelie-chaves',.87,.32,19),T('ano','desde 2026',.87,.65,4.5,.19),
  ],907),
  M('cafe-em-casa','casa-nova','Café de casa nova','Três lembranças do lar e uma cena de café nas pontas',[
    I('cafe','data-xicara-flor',.1,.6,29),D('foto1',.31,.39,.15),D('foto2',.52,.39,.15),D('foto3',.73,.39,.15),
    I('planta','atelie-planta',.91,.5,20),T('frase','o café fica melhor aqui',.52,.72,9,.47,'Caveat','--peach-ink'),T('nomes','Bia e Caio · nosso cantinho',.52,.88,4.4,.46),
  ],908,'--paper'),
  M('pedalar','ciclismo','Flores pelo caminho','Bicicleta com cestinha, retrato e frase para quem ama pedalar',[
    I('bike','atelie-bicicleta',.23,.5,72),T('linha','colecionando caminhos',.23,.82,5.8,.4,'Caveat','--peach-ink'),
    T('nome','Clara',.55,.27,9,.18),T('frase','vai de bike',.55,.48,6.5,.2,'Caveat'),
    D('foto',.81,.42,.21),I('flor','data-buque',.81,.81,17),
  ],909),
  M('mais-forte','musculacao','Forte do meu jeito','Composição tipográfica com retrato e halter delicado',[
    F('foto',.21,.43,.27,.65),T('linha1','FORTE',.64,.23,13,.4),T('linha2','do meu jeito',.64,.44,11,.44,'Caveat','--peach-ink'),
    T('nome','Marina · um dia de cada vez',.64,.64,4.8,.43),I('halter','atelie-halter',.61,.84,38),I('folhas','convite-arco',.9,.76,18),
  ],910,'--paper'),
  M('padrinhos','casamento','Ao nosso lado','Convite em destaque, retrato do casal e ramos nas laterais',[
    I('ramo','convite-arco',.19,.37,61),F('foto',.19,.38,.16,.45,'coracao'),
    T('titulo','Ao nosso lado',.65,.24,12,.49,'Caveat','--peach-ink'),T('convite','aceitam ser nossos padrinhos?',.65,.45,6.1,.53),
    T('nomes','Ana & Miguel',.65,.65,7,.36),T('data','18 · 04 · 2027',.65,.82,4.3,.3),I('aliancas','convite-aliancas',.91,.8,18),
  ],911),
  M('amizade','amizade','Nossos pequenos infinitos','Três retratos diferentes e uma dedicatória entre flores',[
    F('foto1',.15,.39,.2,.55,'retangulo'),D('foto2',.42,.39,.2),F('foto3',.69,.39,.2,.55,'coracao'),
    I('flores','data-buque',.91,.42,25),T('frase','nossos pequenos infinitos',.4,.77,8.5,.6,'Caveat','--peach-ink'),
    T('nomes','Lia, Bia & Ju',.83,.83,5.2,.26),I('laco','convite-laco',.08,.84,15),
  ],912,'--paper'),
]);
