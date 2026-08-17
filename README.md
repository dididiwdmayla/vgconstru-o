# VG Construção — site

Site estático (HTML/CSS/JS puro, sem build) da VG Construção, construtora em Foz do Iguaçu/PR:
obra completa do zero à entrega, ampliação, reforma, acabamento e manutenção.

## Estrutura

```
index.html      Início
servicos.html   Serviços (os oito serviços, um bloco cada)
galeria.html    Galeria (filtros, lightbox, antes/depois)
sobre.html      Sobre
contato.html    Contato (formulário -> WhatsApp)
css/styles.css  Estilos de todas as páginas
js/main.js      Cabeçalho, rodapé, links de WhatsApp, revelação ao rolar, imagem quebrada, botão CTA
js/interactions.js  Comportamento específico de cada página (galeria, formulário, etc.)
assets/         Imagens (fotos/ e img/)
```

Cada página é independente (o cabeçalho e o rodapé estão embutidos em cada HTML), então o site funciona
direto do sistema de arquivos ou de qualquer host estático, sem depender de `fetch` para montar a página.

## Paleta

Toda cor sai das variáveis CSS em `:root` (`css/styles.css`) — não há hex espalhado pelo código,
nem nos SVG embutidos, que herdam a cor por CSS ou `currentColor`.

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg` | `#0E2148` | azul-marinho base |
| `--bg-alt` | `#16305F` | superfície elevada (cards, seções alternadas) |
| `--accent` | `#F5C518` | amarelo: números, bordas de destaque, fita de segurança e um bloco por seção |
| `--accent-2` | `#1E7FD4` | azul vibrante em bordas e preenchimentos de apoio |
| `--accent-2-text` | `#5AAAEC` | mesmo azul em texto (links e hover), com contraste AA |
| `--text` | `#F2F4F8` | texto principal |
| `--muted` | `#8FA0BF` | texto secundário |

## Fotos

As imagens em `assets/fotos/` são placeholders marcados com "substituir por foto real" —
troque pelos arquivos definitivos mantendo os mesmos nomes e proporções.

## Rodando localmente

Qualquer servidor estático funciona, por exemplo:

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Deploy

Publique a raiz do repositório em qualquer host de site estático (GitHub Pages, Netlify, Vercel, etc.) —
não há passo de build.
