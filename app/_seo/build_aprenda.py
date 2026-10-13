# -*- coding: utf-8 -*-
"""Bivvo 8.15 — gerador estático da Central Aprenda.

Uso (na raiz do projeto):  python3 _seo/build_aprenda.py
- Gera /aprenda/** e reescreve /sitemap.xml.
- O domínio fica SÓ em SITE (abaixo). Para migrar para domínio próprio:
  troque SITE, rode o script de novo e atualize robots.txt e as páginas antigas.
- Não usa scripts nem estilos inline (CSP do Bivvo). JSON-LD é bloco de dados, não executa.
"""
import json, os, re, html, sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from conteudo_a import ARTICLES_A
from conteudo_b import ARTICLES_B

SITE = "https://maisbivvo.netlify.app"
ASSET_V = "11.16.0"
UPDATED = date(2026, 10, 4)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]
UPDATED_TXT = f"{UPDATED.day} de {MESES[UPDATED.month-1]} de {UPDATED.year}"

CATEGORIES = [
 dict(slug="organizacao-financeira", name="Organização financeira", icon="🧭",
      h1="Organização financeira: comece pelo retrato real",
      seo_title="Organização financeira: guias práticos | Aprenda com o Bivvo",
      desc="Guias para organizar a vida financeira, escolher um método de controle e manter o hábito sem complicação.",
      intro="Organizar o dinheiro começa com três números: quanto entra, quanto já está comprometido e quanto sobra de verdade. Estes guias ajudam a montar esse retrato, escolher um método de controle que você consiga manter e transformar registros em decisões."),
 dict(slug="orcamento", name="Orçamento", icon="🗂️",
      h1="Orçamento: decida antes de o mês decidir por você",
      seo_title="Orçamento mensal e salário: guias práticos | Aprenda com o Bivvo",
      desc="Como organizar e dividir o salário, montar um orçamento mensal e calcular quanto você pode gastar por mês e por dia.",
      intro="Um orçamento é o plano do mês feito antes de ele começar. Aqui você encontra a ordem certa para organizar o salário, formas de dividir a renda e as contas que respondem quanto dá para gastar por mês e por dia."),
 dict(slug="cartao-de-credito", name="Cartão de crédito", icon="💳",
      h1="Cartão de crédito sem sustos na fatura",
      seo_title="Cartão de crédito, fatura e parcelas: guias | Aprenda com o Bivvo",
      desc="Entenda fechamento e vencimento, controle compras parceladas e defina um teto pessoal para o cartão de crédito.",
      intro="O cartão mistura três coisas que o extrato não mostra juntas: compras recentes, parcelas antigas e datas de fatura. Estes guias explicam cada uma e ajudam a definir um limite que cabe no seu bolso, não só no do banco."),
 dict(slug="economia", name="Economia", icon="🪙",
      h1="Economia: ajustes que fazem diferença de verdade",
      seo_title="Como economizar e controlar gastos: guias | Aprenda com o Bivvo",
      desc="Onde estão os ajustes de maior impacto para economizar, mesmo ganhando pouco, e como controlar os gastos do mês.",
      intro="Economizar não é cortar todos os prazeres. É encontrar os gastos que se repetem, os vazamentos pequenos e os juros evitáveis. Estes guias mostram onde estão os ajustes com mais efeito ao longo do ano."),
 dict(slug="dividas", name="Dívidas", icon="🧩",
      h1="Dívidas: do mapa completo ao plano de saída",
      seo_title="Como sair e organizar dívidas: guias | Aprenda com o Bivvo",
      desc="Monte a lista completa das suas dívidas, priorize as mais caras e negocie com um valor que cabe no orçamento.",
      intro="Sair das dívidas começa com um mapa: quanto você deve, para quem, com quais juros e quanto isso ocupa da renda. Com o mapa pronto, fica claro o que priorizar e quanto oferecer em uma negociação."),
 dict(slug="reserva-de-emergencia", name="Reserva de emergência", icon="🛡️",
      h1="Reserva de emergência: quanto ter e como montar",
      seo_title="Reserva de emergência: quanto ter e como montar | Aprenda com o Bivvo",
      desc="Quanto ter de reserva de emergência para o seu perfil de renda e um passo a passo para montá-la do zero.",
      intro="A reserva de emergência é o que impede um imprevisto de virar dívida. Estes guias mostram como calcular o valor certo para o seu perfil e como construí-la em etapas, começando por um mês de proteção."),
 dict(slug="planejamento-financeiro", name="Planejamento financeiro", icon="🗺️",
      h1="Planejamento financeiro: objetivos com valor e prazo",
      seo_title="Planejamento financeiro pessoal: guias | Aprenda com o Bivvo",
      desc="Como transformar objetivos de curto, médio e longo prazo em valores mensais e decidir quanto guardar do salário.",
      intro="Planejar é decidir o que o seu dinheiro vai fazer nos próximos meses e anos. Aqui você aprende a transformar objetivos em valor, prazo e contribuição mensal, e a definir quanto guardar do salário."),
]
CAT = {c["slug"]: c for c in CATEGORIES}

TOOLS = {
 "reserva": ("Calculadora de reserva de emergência", "/calculadoras/reserva-de-emergencia/", "Descubra uma meta com base nos seus gastos essenciais.", "🛡️"),
 "comprometimento": ("Comprometimento de renda", "/calculadoras/comprometimento-de-renda/", "Veja quanto da renda já está preso em contas e parcelas.", "📊"),
 "parcelas": ("Calculadora de parcelas", "/calculadoras/parcelas/", "Descubra quanto uma compra pesa por mês.", "💳"),
 "guardar": ("Quanto guardar por mês", "/calculadoras/quanto-guardar-por-mes/", "Transforme uma meta em um valor mensal.", "🎯"),
 "gastar-hoje": ("Quanto posso gastar hoje", "/quanto-posso-gastar-hoje/", "Calcule uma referência diária até a próxima renda.", "📅"),
 "cartao": ("Simulador de limite do cartão", "/organizar-cartao-de-credito/", "Veja quanto do limite já está comprometido.", "🧾"),
}
PAGES = {  # páginas públicas já existentes (rotas reais conferidas no projeto)
 "controle": ("Controle financeiro pessoal", "/controle-financeiro-pessoal/"),
 "app": ("App de controle financeiro", "/app-controle-financeiro/"),
 "planejamento": ("Planejamento financeiro pessoal", "/planejamento-financeiro-pessoal/"),
 "orcamento": ("Orçamento doméstico", "/orcamento-domestico/"),
 "qpg": ("Quanto posso gastar hoje", "/quanto-posso-gastar-hoje/"),
 "qpgh": ("Quanto posso gastar hoje", "/quanto-posso-gastar-hoje/"),
 "cartao": ("Como organizar o cartão de crédito", "/organizar-cartao-de-credito/"),
}
FEATURED = ["quanto-posso-gastar-por-dia", "como-organizar-o-salario", "como-montar-reserva-de-emergencia",
            "como-sair-das-dividas", "como-organizar-o-cartao-de-credito", "como-fazer-orcamento-mensal"]

ARTICLES = ARTICLES_A + ARTICLES_B
ART = {a["slug"]: a for a in ARTICLES}
assert len(ARTICLES) == 20 and len(ART) == 20, "esperados 20 artigos com slugs únicos"

esc = lambda s: html.escape(s, quote=True)
def art_url(a): return f"/aprenda/{a['cat']}/{a['slug']}/"
def cat_url(c): return f"/aprenda/{c}/"
def signup(campaign): return f"/?signup=1&amp;utm_source=seo&amp;utm_medium=aprenda&amp;utm_campaign={campaign}"
def slugify(t):
    import unicodedata
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60]
def strip_tags(s): return re.sub(r"<[^>]+>", " ", s)
def words(a):
    txt = a["answer"] + " ".join(h + b for h, b in a["sections"]) + " ".join(a["mistakes"]) + " ".join(q + r for q, r in a["faq"])
    return len(strip_tags(txt).split())
def minutes(a): return max(3, round(words(a) / 200 + 0.4))

def links(text):
    """[[slug|txt]] → artigo · [[tool:id|txt]] → ferramenta · [[page:id|txt]] → página existente."""
    def rep(m):
        target, label = m.group(1), m.group(2)
        if target.startswith("tool:"):
            k = target[5:]; t = TOOLS[k]
            return f'<a href="{t[1]}" data-seo="tool" data-seo-target="{k}">{label}</a>'
        if target.startswith("page:"):
            k = target[5:]; p = PAGES[k]
            return f'<a href="{p[1]}" data-seo="page" data-seo-target="{k}">{label}</a>'
        if target not in ART: raise KeyError(f"link interno para artigo inexistente: {target}")
        return f'<a href="{art_url(ART[target])}" data-seo="related" data-seo-target="{target}">{label}</a>'
    return re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", rep, text)

# ------------------------------------------------------------------ partes comuns
def head(title, desc, path, og_type="website", ld=None, extra_meta=""):
    url = SITE + path
    ld_html = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False, separators=(",", ":"))}</script>' if ld else ""
    return f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#F7F5F8">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Bivvo">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og-bivvo.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{SITE}/og-bivvo.png">{extra_meta}
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/aprenda/aprenda.css?v={ASSET_V}">
{ld_html}
<script defer src="/seo-track.js?v={ASSET_V}"></script>
<script defer src="/aprenda/aprenda.js?v={ASSET_V}"></script>
</head>"""

def topbar(campaign):
    return f"""<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="ap-top">
  <div class="ap-top-in">
    <a class="ap-brand" href="/"><img src="/icon-192.png" width="34" height="34" alt=""><span>Bivvo</span></a>
    <nav class="ap-menu" aria-label="Principal">
      <a href="/aprenda/">Aprenda</a>
      <a href="/aprenda/#ferramentas">Ferramentas</a>
      <a class="ap-menu-login" href="/#/login">Entrar</a>
      <a class="ap-btn ap-btn-sm" href="{signup(campaign + '_topo')}" data-seo="signup" data-seo-target="topo">Começar grátis</a>
    </nav>
  </div>
</header>"""

def footer():
    cats = "".join(f'<li><a href="{cat_url(c["slug"])}">{esc(c["name"])}</a></li>' for c in CATEGORIES)
    tools = "".join(f'<li><a href="{t[1]}" data-seo="tool" data-seo-target="{k}">{esc(t[0])}</a></li>' for k, t in TOOLS.items())
    pages = "".join(f'<li><a href="{p[1]}">{esc(p[0])}</a></li>' for k, p in PAGES.items() if k not in ("qpgh", "cartao"))
    return f"""<footer class="ap-foot">
  <div class="ap-foot-in">
    <div class="ap-foot-brand"><a class="ap-brand" href="/"><img src="/icon-192.png" width="34" height="34" alt="" loading="lazy"><span>Bivvo</span></a>
      <p>Controle financeiro pessoal que responde quanto você pode gastar hoje.</p>
      <p class="ap-fine">Conteúdo educativo, sem recomendação de investimento. Os exemplos usam valores fictícios.</p></div>
    <nav aria-label="Temas"><h2>Temas</h2><ul>{cats}</ul></nav>
    <nav aria-label="Ferramentas grátis"><h2>Ferramentas grátis</h2><ul>{tools}</ul></nav>
    <nav aria-label="Bivvo"><h2>Bivvo</h2><ul><li><a href="/aprenda/">Aprenda com o Bivvo</a></li>{pages}</ul></nav>
  </div>
</footer>"""

def crumbs(items):
    lis = []
    for i, (name, path) in enumerate(items):
        last = i == len(items) - 1
        lis.append(f'<li><span aria-current="page">{esc(name)}</span></li>' if last else f'<li><a href="{path}">{esc(name)}</a></li>')
    return f'<nav class="ap-crumbs" aria-label="Trilha de navegação"><ol>{"".join(lis)}</ol></nav>'

def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p} for i, (n, p) in enumerate(items)]}

def tool_cards(ids, h="h3"):
    out = []
    for k in ids:
        t = TOOLS[k]
        out.append(f'<a class="ap-tool" href="{t[1]}" data-seo="tool" data-seo-target="{k}"><span class="ap-tool-ico" aria-hidden="true">{t[3]}</span><span><{h}>{esc(t[0])}</{h}><span>{esc(t[2])}</span></span></a>')
    return f'<div class="ap-tools">{"".join(out)}</div>'

def article_row(a, h="h3", show_cat=False, rel=False):
    cat = f'<span class="ap-row-cat">{esc(CAT[a["cat"]]["name"])}</span>' if show_cat else ""
    attr = f' data-seo="related" data-seo-target="{a["slug"]}"' if rel else ""
    search = esc((a["title"] + " " + a["short"] + " " + CAT[a["cat"]]["name"]).lower())
    return (f'<li class="ap-row" data-search="{search}"><a href="{art_url(a)}"{attr}>{cat}'
            f'<{h}>{esc(a["title"])}</{h}><span class="ap-row-short">{esc(a["short"])}</span>'
            f'<span class="ap-row-meta">{minutes(a)} min de leitura</span></a></li>')

def cta_block(campaign, title="Organize isso automaticamente com o Bivvo", text=None):
    text = text or "Você informa renda, contas e cartões uma vez. O Bivvo mostra quanto está livre hoje, o que vence nos próximos dias e se o mês continua cabendo."
    return f"""<section class="ap-cta" aria-labelledby="cta-{campaign}">
  <div>
    <h2 id="cta-{campaign}">{esc(title)}</h2>
    <p>{esc(text)}</p>
  </div>
  <div class="ap-cta-actions">
    <a class="ap-btn" href="{signup(campaign)}" data-seo="signup" data-seo-target="cta">Começar grátis</a>
    <span class="ap-cta-note">Plano gratuito para começar, sem cartão de crédito.</span>
  </div>
</section>"""

PUBLISHER = {"@type": "Organization", "name": "Bivvo", "url": SITE + "/",
             "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png", "width": 512, "height": 512}}

def write(path, content):
    full = os.path.join(ROOT, path.strip("/"), "index.html")
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f: f.write(content)

# ------------------------------------------------------------------ artigo
def build_article(a):
    c = CAT[a["cat"]]; path = art_url(a)
    trail = [("Aprenda", "/aprenda/"), (c["name"], cat_url(c["slug"])), (a["title"], path)]
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Article", "headline": a["title"][:110], "description": a["desc"],
         "mainEntityOfPage": SITE + path, "url": SITE + path, "inLanguage": "pt-BR",
         "image": SITE + "/og-bivvo.png", "datePublished": UPDATED.isoformat(), "dateModified": UPDATED.isoformat(),
         "author": {"@type": "Organization", "name": "Equipe Bivvo", "url": SITE + "/"},
         "publisher": PUBLISHER, "articleSection": c["name"], "isAccessibleForFree": True},
        crumbs_ld(trail)]}
    meta = f'\n<meta property="article:published_time" content="{UPDATED.isoformat()}">\n<meta property="article:modified_time" content="{UPDATED.isoformat()}">\n<meta property="article:section" content="{esc(c["name"])}">'
    toc_items, body = [], []
    for h2, html_ in a["sections"]:
        sid = slugify(h2); toc_items.append((sid, h2))
        body.append(f'<section class="ap-sec" aria-labelledby="{sid}"><h2 id="{sid}">{esc(h2)}</h2>{links(html_)}</section>')
    ex = ""
    if a.get("example"):
        e = a["example"]
        rows = "".join(f'<div class="ap-rc-row"><dt>{esc(l)}</dt><dd>{esc(v)}</dd></div>' for l, v in e["rows"])
        ex = f"""<figure class="ap-receipt" aria-labelledby="ex-t">
  <figcaption id="ex-t">{esc(e["title"])}</figcaption>
  <dl>{rows}<div class="ap-rc-row ap-rc-total"><dt>{esc(e["total"][0])}</dt><dd>{esc(e["total"][1])}</dd></div></dl>
  <p class="ap-rc-note">{esc(e["note"])}</p>
</figure>"""
        # exemplo entra depois da 2ª seção (ou ao fim se tiver menos)
        body.insert(min(2, len(body)), ex)
    toc_items += [("erros-comuns", "Erros comuns"), ("ferramentas", "Ferramentas para praticar"), ("perguntas-frequentes", "Perguntas frequentes")]
    toc = "".join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i, t in toc_items)
    mistakes = "".join(f"<li>{esc(m)}</li>" for m in a["mistakes"])
    faq = "".join(f'<details class="ap-faq-item"><summary><h3>{esc(q)}</h3></summary><div>{links("<p>" + r + "</p>")}</div></details>' for q, r in a["faq"])
    related = "".join(article_row(ART[s], h="h3", show_cat=True, rel=True) for s in a["related"])
    page = head(a["seo_title"], a["desc"], path, "article", ld, meta) + f"""
<body data-seo-type="artigo" data-seo-slug="{a['slug']}" data-seo-cat="{a['cat']}">
{topbar(a['slug'])}
<main id="conteudo" class="ap-main">
  {crumbs(trail)}
  <article class="ap-article">
    <header class="ap-art-head">
      <a class="ap-chip" href="{cat_url(c['slug'])}"><span aria-hidden="true">{c['icon']}</span>{esc(c['name'])}</a>
      <h1>{esc(a['title'])}</h1>
      <p class="ap-meta"><span>Por Equipe Bivvo</span><span>Atualizado em <time datetime="{UPDATED.isoformat()}">{UPDATED_TXT}</time></span><span>{minutes(a)} min de leitura</span></p>
    </header>
    <section class="ap-answer" aria-labelledby="resposta">
      <h2 id="resposta" class="ap-answer-label">Resposta rápida</h2>
      {links(a['answer'])}
      <p class="ap-answer-key">{esc(a['answer_key'])}</p>
    </section>
    <div class="ap-art-grid">
      <aside class="ap-rail" aria-label="Neste guia">
        <details class="ap-toc" open><summary>Neste guia</summary><ol>{toc}</ol></details>
        <div class="ap-rail-tool">
          <p class="ap-rail-label">Faça a conta</p>
          {tool_cards(a['tools'][:1], h='h3')}
        </div>
      </aside>
      <div class="ap-body">
        {''.join(body)}
        <section class="ap-sec" aria-labelledby="erros-comuns"><h2 id="erros-comuns">Erros comuns</h2><ul class="ap-mistakes">{mistakes}</ul></section>
        <section class="ap-sec" aria-labelledby="ferramentas"><h2 id="ferramentas">Ferramentas para praticar</h2><p>Grátis, sem cadastro. Os valores digitados ficam no seu navegador.</p>{tool_cards(a['tools'])}</section>
        <section class="ap-sec" aria-labelledby="perguntas-frequentes"><h2 id="perguntas-frequentes">Perguntas frequentes</h2><div class="ap-faq">{faq}</div></section>
      </div>
    </div>
  </article>
  {cta_block(a['slug'], text=a['bivvo'])}
  <section class="ap-related" aria-labelledby="continue"><h2 id="continue">Continue aprendendo</h2><ul class="ap-rows ap-rows-grid">{related}</ul>
    <p class="ap-more"><a href="{cat_url(c['slug'])}">Todos os guias de {esc(c['name'].lower())}</a><a href="/aprenda/">Ver todos os temas</a></p></section>
</main>
{footer()}
</body>
</html>
"""
    write(path, page)

# ------------------------------------------------------------------ categoria
def build_category(c):
    path = cat_url(c["slug"]); arts = [a for a in ARTICLES if a["cat"] == c["slug"]]
    trail = [("Aprenda", "/aprenda/"), (c["name"], path)]
    tools = []
    for a in arts:
        for t in a["tools"]:
            if t not in tools: tools.append(t)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": c["h1"], "description": c["desc"], "url": SITE + path, "inLanguage": "pt-BR",
         "isPartOf": {"@type": "WebSite", "name": "Bivvo", "url": SITE + "/"},
         "hasPart": [{"@type": "Article", "headline": a["title"][:110], "url": SITE + art_url(a)} for a in arts]},
        crumbs_ld(trail)]}
    others = "".join(f'<li><a class="ap-pill" href="{cat_url(o["slug"])}"><span aria-hidden="true">{o["icon"]}</span>{esc(o["name"])}</a></li>' for o in CATEGORIES if o["slug"] != c["slug"])
    rows = "".join(article_row(a, h="h2") for a in arts)
    page = head(c["seo_title"], c["desc"], path, "website", ld) + f"""
<body data-seo-type="categoria" data-seo-slug="{c['slug']}" data-seo-cat="{c['slug']}">
{topbar('cat_' + c['slug'])}
<main id="conteudo" class="ap-main">
  {crumbs(trail)}
  <header class="ap-cat-head">
    <span class="ap-cat-ico" aria-hidden="true">{c['icon']}</span>
    <h1>{esc(c['h1'])}</h1>
    <p class="ap-lead">{esc(c['intro'])}</p>
  </header>
  <section aria-label="Guias de {esc(c['name'])}"><ul class="ap-rows ap-rows-cat">{rows}</ul></section>
  <section class="ap-block" aria-labelledby="ferramentas"><h2 id="ferramentas" class="ap-h2">Ferramentas para praticar</h2><p class="ap-sub">Grátis, sem cadastro. Os valores ficam no seu navegador.</p>{tool_cards(tools)}</section>
  {cta_block('cat_' + c['slug'])}
  <section class="ap-block" aria-labelledby="outros"><h2 id="outros" class="ap-h2">Outros temas</h2><ul class="ap-pills">{others}</ul></section>
</main>
{footer()}
</body>
</html>
"""
    write(path, page)

# ------------------------------------------------------------------ hub
def build_hub():
    path = "/aprenda/"
    title = "Aprenda com o Bivvo: guias de controle financeiro pessoal"
    desc = "Guias diretos sobre salário, orçamento, cartão de crédito, dívidas e reserva de emergência, com exemplos e calculadoras grátis."
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": "Aprenda com o Bivvo", "description": desc, "url": SITE + path, "inLanguage": "pt-BR",
         "isPartOf": {"@type": "WebSite", "name": "Bivvo", "url": SITE + "/"}, "publisher": PUBLISHER},
        crumbs_ld([("Aprenda", path)])]}
    pills = "".join(f'<li><a class="ap-pill" href="{cat_url(c["slug"])}"><span aria-hidden="true">{c["icon"]}</span>{esc(c["name"])}<span class="ap-pill-n">{sum(1 for a in ARTICLES if a["cat"] == c["slug"])}</span></a></li>' for c in CATEGORIES)
    feat = []
    for i, s in enumerate(FEATURED):
        a = ART[s]; big = " ap-feat-big" if i == 0 else ""
        feat.append(f'<li class="ap-feat{big}"><a href="{art_url(a)}" data-seo="related" data-seo-target="{s}"><span class="ap-row-cat">{esc(CAT[a["cat"]]["name"])}</span><h3>{esc(a["title"])}</h3><p>{esc(a["short"])}</p><span class="ap-row-meta">{minutes(a)} min de leitura</span></a></li>')
    groups = []
    for c in CATEGORIES:
        arts = [a for a in ARTICLES if a["cat"] == c["slug"]]
        groups.append(f'<section class="ap-group" data-group aria-labelledby="g-{c["slug"]}"><div class="ap-group-head"><h2 id="g-{c["slug"]}"><span aria-hidden="true">{c["icon"]}</span>{esc(c["name"])}</h2><a href="{cat_url(c["slug"])}">Ver tema</a></div><ul class="ap-rows">{"".join(article_row(a) for a in arts)}</ul></section>')
    page = head(title, desc, path, "website", ld) + f"""
<body data-seo-type="hub" data-seo-slug="aprenda" data-seo-cat="todas">
{topbar('aprenda')}
<main id="conteudo" class="ap-main">
  <header class="ap-hero">
    <h1>Aprenda com o Bivvo</h1>
    <p class="ap-lead">Respostas diretas para as dúvidas de dinheiro do dia a dia: quanto gastar, quanto guardar, como lidar com o cartão e com as dívidas. Cada guia termina com uma ferramenta para você fazer a conta com os seus números.</p>
    <form class="ap-search" role="search" action="/aprenda/" hidden>
      <label for="ap-q">Buscar um assunto</label>
      <div class="ap-search-box"><input id="ap-q" name="q" type="search" autocomplete="off" placeholder="Ex.: fatura, reserva, salário"><span class="ap-search-count" id="ap-count" aria-live="polite"></span></div>
    </form>
    <ul class="ap-pills" aria-label="Temas">{pills}</ul>
  </header>
  <section class="ap-block" aria-labelledby="comece"><h2 id="comece" class="ap-h2">Comece por aqui</h2><ul class="ap-feats">{''.join(feat)}</ul></section>
  <div class="ap-groups" id="todos">{''.join(groups)}
    <p class="ap-empty" id="ap-empty" hidden>Nenhum guia encontrado para essa busca. Tente outra palavra, como “cartão” ou “salário”.</p></div>
  <section class="ap-block" id="ferramentas" aria-labelledby="ferr"><h2 id="ferr" class="ap-h2">Ferramentas grátis</h2><p class="ap-sub">Calculadoras sem cadastro. Os valores digitados ficam no seu navegador e não são enviados ao Bivvo.</p>{tool_cards(list(TOOLS))}</section>
  {cta_block('aprenda', title='Do guia para a prática, sem planilha', text='O Bivvo junta renda, contas, cartões e metas e responde quanto você pode gastar hoje. Comece pelo plano gratuito.')}
</main>
{footer()}
</body>
</html>
"""
    write(path, page)

# ------------------------------------------------------------------ sitemap
def build_sitemap():
    d = UPDATED.isoformat()
    existing = ["/", "/controle-financeiro-pessoal/", "/app-controle-financeiro/", "/planejamento-financeiro-pessoal/",
                "/orcamento-domestico/", "/quanto-posso-gastar-hoje/", "/quanto-posso-gastar-hoje/", "/organizar-cartao-de-credito/",
                "/calculadoras/reserva-de-emergencia/", "/calculadoras/comprometimento-de-renda/",
                "/calculadoras/parcelas/", "/calculadoras/quanto-guardar-por-mes/"]
    urls = existing + ["/aprenda/"] + [cat_url(c["slug"]) for c in CATEGORIES] + [art_url(a) for a in ARTICLES]
    body = "\n".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod></url>" for u in urls)
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{body}\n</urlset>\n')
    return urls

if __name__ == "__main__":
    for a in ARTICLES:
        assert a["cat"] in CAT, a["slug"]
        for r in a["related"]: assert r in ART and r != a["slug"], (a["slug"], r)
        for t in a["tools"]: assert t in TOOLS, (a["slug"], t)
        build_article(a)
    for c in CATEGORIES: build_category(c)
    build_hub()
    urls = build_sitemap()
    print(f"ok: {len(ARTICLES)} artigos, {len(CATEGORIES)} categorias, hub, sitemap com {len(urls)} URLs")
