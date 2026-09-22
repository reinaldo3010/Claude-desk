from pathlib import Path
import json, shutil, zipfile, html
from PIL import Image

root=Path(__file__).resolve().parents[1]
src=Path('C:/Users/mingardi/.codex/generated_images/01a0811b-fb22-7642-ba81-05a3d691589f')
for tag,manifest,title in [('piloto-aquarela','piloto-prompts.json','Ilustrações delicadas · piloto'),('pandinha-temas-20','pandinha-prompts.json','Pandinha · profissões e paixões')]:
    out=root/'marca/kit/png'/tag
    out.mkdir(parents=True,exist_ok=True)
    items=json.loads((root/'qa'/manifest).read_text(encoding='utf-8'))
    cards=[]
    for item in items:
        target=out/(item['id']+'.png')
        shutil.copy2(src/item['source'],target)
        im=Image.open(target)
        a=im.getchannel('A'); hist=a.histogram()
        item.update(width=im.width,height=im.height,alpha_min=a.getextrema()[0],alpha_max=a.getextrema()[1],transparent_percent=round(hist[0]/(im.width*im.height)*100,2),size_cm_300ppi=[round(im.width/300*2.54,2),round(im.height/300*2.54,2)])
        assert hist[0]>0 and max(hist[128:])>0
        w,h=item['size_cm_300ppi']
        cards.append(f'<article><a class="picture" href="{item["id"]}.png" target="_blank"><img src="{item["id"]}.png" alt="{html.escape(item["title"])}"></a><div class="caption"><h2>{html.escape(item["title"])}</h2><p>{im.width} × {im.height} px · PNG com alpha</p><p>Arquivo inteiro a 300 ppi: {w} × {h} cm</p><a href="{item["id"]}.png" download>Baixar PNG original</a></div></article>')
    (out/'catalogo.json').write_text(json.dumps(items,ensure_ascii=False,indent=2),encoding='utf-8')
    page='''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+title+'''</title><link rel="stylesheet" href="../../../../styles.css"><style>body{margin:0;background:var(--paper);color:var(--ink);font-family:Nunito, sans-serif}main{max-width:1400px;margin:auto;padding:36px 24px}header{max-width:820px;margin-bottom:28px}h1{font-family:Fredoka,sans-serif;font-size:clamp(28px,4vw,48px);line-height:1.1}header p{font-size:18px}.controls{display:flex;gap:10px;flex-wrap:wrap;margin:24px 0}button{padding:10px 18px;border:1px solid var(--sand);border-radius:24px;background:var(--cream);color:var(--ink);cursor:pointer}button[aria-pressed=true]{background:var(--peach)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}article{border:1px solid var(--sand);border-radius:22px;background:var(--white)}.picture{display:flex;height:320px;padding:22px;align-items:center;justify-content:center;border-radius:22px 22px 0 0;background:var(--preview,var(--white))}.picture img{max-width:100%;max-height:100%;object-fit:contain}.caption{padding:20px}h2{font-family:Fredoka,sans-serif;font-size:21px;margin:0 0 8px}.caption p{font-size:13px;margin:4px 0}.caption a{display:inline-block;margin-top:10px;color:var(--peach-ink)}body[data-bg=check] .picture{background:repeating-conic-gradient(var(--cream) 0% 25%,var(--sand-soft) 0% 50%) 0/24px 24px}footer{margin-top:32px;max-width:850px}</style><main><header><p>PANDA MIMO · ACERVO PARA PERSONALIZAR</p><h1>'''+title+'''</h1><p>Ilustrações individuais para combinar com nomes e frases. Escolha o fundo para conferir os recortes; clique na arte para abrir o original.</p></header><div class="controls" aria-label="Fundo da prévia"><button data-color="var(--white)" aria-pressed="true">Claro</button><button data-color="var(--sage)" aria-pressed="false">Sálvia</button><button data-color="var(--ink)" aria-pressed="false">Escuro</button><button data-color="check" aria-pressed="false">Transparência</button></div><section class="grid">'''+''.join(cards)+'''</section><footer><p>Arquivos raster gerados com referência visual. Nomes e frases devem entrar em camadas separadas no editor. Os números a 300 ppi se referem ao arquivo inteiro, incluindo a área transparente; mantenha as proporções e faça uma prova física de sublimação antes da produção. O fundo desta galeria não integra os PNGs.</p><a href="catalogo.json" download>Catálogo e prompts</a></footer></main><script>document.querySelectorAll('button[data-color]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('button[data-color]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.body.dataset.bg=b.dataset.color;document.body.style.setProperty('--preview',b.dataset.color==='check'?'var(--white)':b.dataset.color)}));</script></html>'''
    (out/'index.html').write_text(page,encoding='utf-8')
    print(tag, len(items), 'arquivos; dimensões:',[(i['width'],i['height']) for i in items])
