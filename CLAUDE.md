# Orçamento Pro — CLAUDE.md

Sistema de orçamentos, vendas, estoque e financeiro para pequenos negócios (MEI).
PWA instalável, **100% client-side**, sem backend próprio.

## Arquitetura: single-file, vanilla, sem build

Todo o app vive em **`index.html`** (um único arquivo, ~9.400 linhas): um bloco
`<style>`, todo o HTML das telas, e um único bloco `<script>` com ~450 funções
globais. Não há framework (React/Vue/etc.), não há bundler, não há módulos ES
(`import`/`export`), não há passo de build — o arquivo é servido como está.

**Antes de propor dividir isso em módulos/framework**: é uma decisão deliberada
do projeto (facilita deploy — copiar um arquivo — e instalação como PWA offline).
Não sugerir migração de stack sem o usuário pedir.

Arquivos de apoio:
- `manifest.json` — metadados do PWA (ícones, cores, start_url).
- `service-worker.js` — cache network-first com fallback offline.
- `icon-*.png` — ícones em vários tamanhos.

## Persistência: `localStorage`, sem servidor

Não há banco de dados nem API própria. Todo o estado do negócio (orçamentos,
produtos, clientes, OS, funcionários, templates, config da empresa) é
JSON serializado em `localStorage`, sob chaves prefixadas **`orcpro_*`**
(ex.: `orcpro_hist`, `orcpro_produtos`, `orcpro_clientes`, `orcpro_os`,
`orcpro_funcs`, `orcpro_templates`, `orcpro_emp`, `orcpro_cnt`).

Padrão consistente por entidade — **seguir esse padrão ao adicionar uma nova**:
```js
function getX(){ try{ return JSON.parse(localStorage.getItem('orcpro_x')||'[]'); }catch(e){ return []; } }
function saveX(arr){ return gravarSeguro('orcpro_x', JSON.stringify(arr), 'rótulo legível'); }
```
`gravarSeguro(chave, valor, rotulo)` centraliza a gravação seguramente
(trata `QuotaExceededError` de estouro de cota do `localStorage` e avisa o
usuário). **Nunca chamar `localStorage.setItem` diretamente** para dados de
entidade — sempre passar por `gravarSeguro`.

Integrações externas são opcionais e não substituem o `localStorage`:
- **Google Drive API** (OAuth via Google Identity Services) — backup/sync manual do JSON.
- **ViaCEP** — autocompletar endereço a partir do CEP.
- O app deve continuar funcionando 100% offline sem essas integrações.

## Navegação: SPA de view única, tudo no DOM

Não há roteador nem re-render por template. Todas as "telas" (`view-dash`,
`view-form`, `view-hist`, `view-cat`, etc.) já existem no DOM, ocultas por
`display:none`. Trocar de tela é `showView(nome)`, que:
1. Alterna `display` das `#view-<nome>`;
2. Marca o botão ativo na sidebar (`.nb.active`);
3. Atualiza título/subtítulo da topbar e os botões de ação (`acts[nome]`);
4. Persiste a última tela em `localStorage.orcpro_last_view` (exceto `preview`).

Ao adicionar uma tela nova: registrar o nome no array `views` de `showView()`,
criar `<div id="view-nomedatela">`, botão `<button class="nb" id="nb-nomedatela" onclick="showView('nomedatela')">` na sidebar, e entrada em `acts{}`/`titles{}`.

## Modais: convenção de classe, não display

Modais usam `className` em vez de `style.display`:
```js
ge('modal-x').className='modal-overlay open';   // abrir
ge('modal-x').className='modal-overlay';        // fechar
```
Cada modal tem `open<Entidade>Modal(id)` (id opcional = editar; sem id = criar)
e `close<Entidade>Modal()`.

## Convenções de nomenclatura

- **Funções e comentários em português** (`getClientes`, `salvarOrcamento`,
  `renderHist`, `deletarOS`) — manter o idioma ao adicionar código novo.
- Helpers curtos e globais usados em todo o arquivo: `ge(id)` (`getElementById`),
  `val(id)`/`setVal(id,v)` (ler/escrever `.value`), `fmt(n)` (formata reais),
  `fmtPct`, `fmtDt`, `hoje()`.
- Padrão por entidade: `getX()` / `saveX()` / `renderX()` / `openXModal()` /
  `closeXModal()` / `deleteX(id)` / `editX(id)`.
- IDs de elementos seguem o padrão `view-<tela>`, `nb-<tela>` (nav button),
  `modal-<nome>`.

## Tema

Dark é o padrão em todas as telas (variáveis CSS em `:root`, prefixo `--dark-*`).
Cores semânticas fixas: verde=sucesso/positivo, vermelho=erro/negativo,
azul=informativo, amarelo=alerta. Reaproveitar as classes existentes
(`.badge`/`.bp`/`.bo`/`.br`/`.bbl`/`.by`, `.info-box`/`.warn-box`/
`.success-box`/`.alert-box`) em vez de criar novas cores.

## Autenticação / permissões

Não há servidor de autenticação. Há uma tela de PIN local (`initPIN`) e uma
lista `idsRestritos` em `showView`-adjacent code que esconde itens de menu por
papel de usuário — é controle de acesso **apenas client-side** (não é uma
barreira de segurança real, é UX para não confundir usuários com menos permissão).

## Ao editar

- Este é um arquivo de **quase 600 KB**: ler/editar em trechos localizados
  (por função ou por seção `<!-- COMENTÁRIO -->`) em vez do arquivo inteiro.
- Não há testes automatizados nem linter configurado neste repo — validar
  manualmente abrindo o `index.html` no navegador.
- Não introduzir dependências novas sem necessidade clara; o app hoje só
  carrega duas libs externas via CDN (`xlsx.js` e Google Identity Services).
