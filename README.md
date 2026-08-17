# S.O.S Gabriel — site

Site estático (HTML/CSS/JS puro, sem build) para a S.O.S Gabriel, marido de aluguel em Foz do Iguaçu/PR.

## Estrutura

```
index.html      Início
servicos.html   Serviços
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

## Rodando localmente

Qualquer servidor estático funciona, por exemplo:

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Deploy

Publique a raiz do repositório em qualquer host de site estático (GitHub Pages, Netlify, Vercel, etc.) —
não há passo de build.
