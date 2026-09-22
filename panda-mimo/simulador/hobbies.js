/** Pequenos Prazeres: seis categorias, quatro composições diferentes em cada uma. */
import { foto, fotoRedonda, frase } from './camadas.js';
import { ILUSTRACOES_HOBBIES } from './hobbies-desenhos.js';
import { ILUSTRACOES_ATELIE } from './atelie.js';
import { ILUSTRACOES_REFINADAS } from './ilustracoes-refinadas.js';
import { nomeDaIlustracao } from './nomes-de-ilustracao.js';
export { ILUSTRACOES_HOBBIES } from './hobbies-desenhos.js';
const desenhos={...ILUSTRACOES_REFINADAS,...ILUSTRACOES_ATELIE,...ILUSTRACOES_HOBBIES};
const I=(id,forma,x,y,mm,rotacao=0)=>({id,tipo:'enfeite',forma,rotulo:nomeDaIlustracao(forma) || forma,x,y,tamanho:mm/90,rotacao,cor:desenhos[forma].primary});
const T=(id,texto,x,y,mm,w=.3,fonte='Nunito',cor='--ink-soft')=>frase(id,texto,texto,x,y,mm,{largura:w,fonte,cor});
const S=(id,texto,x,y,mm,w=.3)=>T(id,texto,x,y,mm,w,'Caveat','--peach-ink');
const F=(id,x,y,w,h,forma='arredondado')=>foto(id,'Sua foto',forma,x,y,w,h);
const D=(id,x,y,w)=>fotoRedonda(id,'Sua foto',x,y,w);
const M=(id,categoria,nome,descricao,camadas,fundo='--white')=>({id:`prazeres-${id}`,categoria:`hobby-${categoria}`,nome,descricao,camadas,fundo,
 enfeites:{formas:['bolinha'],cores:['--sand'],quantidade:6,tamanho:[1.2,1.9]}});

export const CATEGORIAS_HOBBIES=Object.freeze([
 {id:'hobby-leitura',grupo:'Hobbies e paixões',nome:'Leitura e livros',descricao:'Para quem ama ler e viver outras histórias'},
 {id:'hobby-cafe',grupo:'Hobbies e paixões',nome:'Café e pausas',descricao:'O ritual do café, a conversa e o tempo para si'},
 {id:'hobby-musica',grupo:'Hobbies e paixões',nome:'Música',descricao:'Violão, discos e lembranças que têm trilha sonora'},
 {id:'hobby-jardim',grupo:'Hobbies e paixões',nome:'Jardinagem',descricao:'Plantas, flores e o carinho de cultivar'},
 {id:'hobby-viagens',grupo:'Hobbies e paixões',nome:'Viagens',descricao:'Destinos, fotografias e histórias na bagagem'},
 {id:'hobby-cozinha',grupo:'Hobbies e paixões',nome:'Culinária',descricao:'Receitas, afeto e quem ama cozinhar'},
]);

export const MODELOS_HOBBIES=Object.freeze([
 M('leitura-capitulo','leitura','Só mais um capítulo','Leitura: livro aberto em destaque, retrato redondo e assinatura',[
  I('livro','hobby-livro',.22,.46,67),S('titulo','só mais um capítulo',.22,.8,7,.39),
  D('foto',.77,.39,.23),T('nome','Clara',.77,.78,8,.29),I('marcador','hobby-marcador',.5,.4,13),
 ]),
 M('leitura-mundos','leitura','Mundos que cabem em mim','Leitura: frase protagonista com retrato vertical e marcador floral',[
  S('t1','Mundos inteiros',.3,.26,12,.47),T('t2','cabem em mim.',.3,.47,9,.43),T('nome','biblioteca da Helena',.3,.69,5,.42),
  F('foto',.77,.39,.25,.62),I('marcador','hobby-marcador',.57,.81,9),I('livros','data-livros',.88,.84,21),
 ],'--paper'),
 M('leitura-clube','leitura','Nosso clube do livro','Leitura: três retratos e dedicatória para amigas leitoras',[
  D('a',.16,.39,.19),D('b',.41,.39,.19),D('c',.66,.39,.19),
  S('titulo','histórias que aproximam',.41,.75,8,.64),T('nomes','Lia, Bia & Ju',.41,.89,4.8,.43),
  I('livro','hobby-livro',.89,.32,28),I('marcador','hobby-marcador',.88,.73,12),
 ]),
 M('leitura-cantinho','leitura','Meu cantinho de leitura','Leitura: foto panorâmica do cantinho, livro e xícara ilustrados',[
  F('foto',.35,.35,.55,.51,'retangulo'),S('titulo','meu lugar no mundo',.35,.76,9,.55),
  I('livro','hobby-livro',.82,.34,43),I('cafe','data-xicara-flor',.73,.72,22),T('nome','Lívia',.88,.82,6,.17),
 ],'--paper'),

 M('cafe-ritual','cafe','Meu pequeno ritual','Café: prensa francesa, retrato e dedicatória sobre a primeira pausa do dia',[
  I('prensa','hobby-prensa',.18,.4,33),I('graos','hobby-graos',.35,.75,17),D('foto',.52,.41,.21),
  S('titulo','meu pequeno ritual',.82,.28,8,.3),T('linha','um café, um respiro',.82,.49,4.6,.29),T('nome','Marina',.82,.7,6.5,.24),
 ]),
 M('cafe-conversa','cafe','Café com conversa','Café: dois retratos lado a lado e uma xícara para cada história',[
  F('a',.27,.37,.24,.54),F('b',.57,.37,.24,.54),
  S('titulo','a conversa rende mais',.42,.77,9,.56),T('linha','Bia & Rafa · nosso café',.42,.91,4.4,.47),
  I('cafe','data-canecas-casal',.87,.4,34),I('graos','hobby-graos',.88,.8,18),
 ],'--paper'),
 M('cafe-pausa','cafe','Pausa bem merecida','Café: lettering central, retrato em coração e prensa delicada',[
  F('foto',.19,.43,.24,.6,'coracao'),S('titulo','Pausa',.57,.27,16,.3),T('linha','bem merecida.',.57,.49,7.7,.3),
  T('nome','um carinho para a Ana',.57,.7,4.9,.35),I('prensa','hobby-prensa',.86,.48,31),I('graos','hobby-graos',.87,.85,17),
 ]),
 M('cafe-memorias','cafe','Memórias à mesa','Café: foto ampla e duas lembranças pequenas em composição assimétrica',[
  F('a',.255,.39,.35,.57),D('b',.61,.27,.16),D('c',.82,.57,.16),
  S('titulo','memórias à mesa',.28,.8,8.5,.43),T('nomes','Família Costa',.68,.84,5.5,.32),
  I('cafe','data-xicara-flor',.59,.63,24),I('graos','hobby-graos',.88,.2,17),
 ],'--paper'),

 M('musica-acordes','musica','Entre acordes e flores','Música: violão como protagonista, retrato e nome de quem toca',[
  I('violao','hobby-violao',.18,.43,32),I('flores','data-buque',.34,.77,20),D('foto',.53,.4,.23),
  S('titulo','entre acordes',.83,.29,9,.29),S('linha','e flores',.83,.47,8,.26),T('nome','Luiza',.83,.7,7,.25),
 ]),
 M('musica-lado-a','musica','Meu lado A','Música: disco de vinil e duas fotos como capa de um álbum pessoal',[
  I('disco','hobby-vinil',.2,.4,53),F('a',.53,.36,.23,.5,'retangulo'),F('b',.81,.36,.23,.5,'retangulo'),
  S('titulo','meu lado A',.2,.82,9,.3),T('linha','a trilha dos nossos dias',.67,.74,6,.48),
  I('flor','convite-laco',.91,.86,16),
 ],'--paper'),
 M('musica-trilha','musica','A nossa trilha sonora','Música: fotografia horizontal, dedicatória e dois instrumentos visuais',[
  F('foto',.33,.34,.5,.49),S('titulo','a nossa trilha sonora',.33,.77,9,.53),
  I('violao','hobby-violao',.82,.39,28),I('disco','hobby-vinil',.65,.74,23),T('nome','Lia & Léo',.85,.84,5.3,.22),
 ]),
 M('musica-volume','musica','A vida pede música','Música: frase em três linhas, retrato vertical e vinil floral',[
  T('a','A VIDA',.28,.23,10,.32),S('b','pede música',.28,.43,12,.43),T('c','e um pouco de coragem.',.28,.64,5,.42),
  F('foto',.7,.38,.24,.59),I('disco','hobby-vinil',.89,.78,25),I('violao','hobby-violao',.51,.8,12),T('nome','da Camila',.7,.86,5,.22),
 ],'--paper'),

 M('jardim-cultivar','jardim','Cultivar com carinho','Jardinagem: regador floral, retrato botânico e assinatura',[
  I('regador','hobby-regador',.2,.4,45),S('frase','cultivar é cuidar',.2,.79,8,.37),
  I('arco','convite-coroa',.7,.4,63),D('foto',.7,.4,.19),T('nome','Jardim da Alice',.7,.82,6,.36),I('ferramentas','hobby-ferramentas',.94,.71,13),
 ]),
 M('jardim-colecao','jardim','Minha coleção de verdes','Jardinagem: díptico das plantas favoritas e ilustrações de cultivo',[
  F('a',.32,.39,.22,.61),F('b',.6,.39,.22,.61),
  I('planta','atelie-planta',.1,.46,22),I('ferramentas','hobby-ferramentas',.87,.35,27),
  S('frase','minha coleção de verdes',.46,.83,8,.55),T('nome','da Bia',.87,.76,5.5,.19),
 ],'--paper'),
 M('jardim-tempo','jardim','Tudo tem seu tempo','Jardinagem: mensagem de calma, retrato e uma planta em crescimento',[
  S('a','Tudo tem',.28,.24,11,.37),T('b','seu tempo.',.28,.44,10,.37),T('c','inclusive florescer.',.28,.63,5.5,.39),
  D('foto',.73,.34,.22),I('planta','atelie-planta',.91,.75,19),I('regador','hobby-regador',.59,.76,26),T('nome','Laura',.76,.86,5.5,.16),
 ]),
 M('jardim-raizes','jardim','Raízes e lembranças','Jardinagem: três lembranças do jardim e dedicatória para quem planta',[
  F('a',.16,.36,.2,.49,'retangulo'),D('b',.43,.37,.19),F('c',.7,.36,.2,.49,'coracao'),
  S('frase','raízes de boas lembranças',.43,.76,8,.65),T('nome','Vó Rosa · nosso jardim',.43,.91,4.7,.46),
  I('regador','hobby-regador',.92,.3,22),I('ferramentas','hobby-ferramentas',.92,.72,15),
 ],'--paper'),

 M('viagem-bagagem','viagens','Histórias na bagagem','Viagens: mala ilustrada, retrato e destino personalizável',[
  I('mala','hobby-mala',.22,.39,56),S('frase','histórias na bagagem',.22,.8,7.6,.4),
  F('foto',.69,.36,.28,.5),T('destino','Lisboa · 2026',.69,.77,6.7,.34),I('camera','hobby-camera',.91,.69,24),
 ]),
 M('viagem-postais','viagens','Nossos cartões-postais','Viagens: duas fotos amplas de destinos e assinatura de viagem',[
  F('a',.255,.38,.35,.5,'retangulo'),F('b',.705,.38,.35,.5,'retangulo'),
  S('frase','nossos cartões-postais',.48,.76,9,.65),T('nomes','Lia & Pedro',.48,.91,4.7,.3),
  I('mala','hobby-mala',.09,.81,22),I('camera','hobby-camera',.89,.82,22),
 ],'--paper'),
 M('viagem-colecionar','viagens','Colecionar caminhos','Viagens: título em destaque, retrato redondo e câmera fotográfica',[
  T('a','COLECIONAR',.29,.26,8.5,.43),S('b','caminhos',.29,.47,15,.43),T('nome','a próxima parada é nossa',.29,.71,4.8,.42),
  D('foto',.76,.32,.22),I('camera','hobby-camera',.79,.8,31),I('mala','hobby-mala',.54,.83,19),
 ]),
 M('viagem-album','viagens','Meu pequeno álbum','Viagens: uma foto horizontal e duas verticais para contar uma aventura',[
  F('a',.25,.36,.34,.49),F('b',.58,.38,.2,.6),F('c',.84,.38,.2,.6),
  S('frase','um mundo para lembrar',.28,.78,8,.44),T('destino','Serra Gaúcha · 2026',.73,.87,4.6,.4),
  I('camera','hobby-camera',.53,.84,16),I('mala','hobby-mala',.93,.83,15),
 ],'--paper'),

 M('cozinha-tempero','cozinha','Meu tempero é carinho','Culinária: avental floral, retrato e assinatura de quem ama cozinhar',[
  I('avental','hobby-avental',.18,.42,37),I('fouet','hobby-fouet',.37,.79,9),D('foto',.55,.37,.23),
  S('a','meu tempero',.84,.27,8.7,.27),S('b','é carinho',.84,.45,8.7,.27),T('nome','Chef Helena',.84,.69,5.5,.27),
 ]),
 M('cozinha-receita','cozinha','Receita de bons momentos','Culinária: fotografia do prato e receita afetiva em três linhas editáveis',[
  F('foto',.24,.38,.32,.57),S('titulo','Receita de afeto',.7,.23,10,.46),
  T('linha1','uma pitada de cuidado',.7,.44,5.5,.43),T('linha2','uma colher de boas histórias',.7,.6,5.2,.48),
  T('nome','da cozinha da Ana',.24,.84,5,.33),I('fouet','hobby-fouet',.91,.81,9),I('avental','hobby-avental',.53,.82,14),
 ],'--paper'),
 M('cozinha-familia','cozinha','Sabores de família','Culinária: três fotos para guardar quem cozinha e quem senta à mesa',[
  D('a',.17,.38,.21),F('b',.44,.38,.21,.52,'coracao'),D('c',.71,.38,.21),
  S('frase','sabores que contam histórias',.44,.79,8,.66),T('nome','Família Santos',.82,.9,4.5,.27),
  I('avental','hobby-avental',.93,.32,17),I('fouet','hobby-fouet',.08,.83,8),
 ]),
 M('cozinha-doce','cozinha','Um doce de pessoa','Confeitaria: frase protagonista, duas fotos de criações e utensílios delicados',[
  S('a','Um doce',.2,.28,13,.3),T('b','de pessoa.',.2,.49,8,.32),T('nome','Confeitaria da Bia',.2,.72,4.4,.32),
  F('foto1',.54,.36,.23,.52),F('foto2',.83,.36,.23,.52),
  I('fouet','hobby-fouet',.46,.82,8),I('avental','hobby-avental',.92,.81,15),S('linha','feito com amor',.69,.81,6,.3),
 ],'--paper'),
].map((m,i)=>Object.freeze({...m,semente:1001+i})));
