// Variáveis globais
let todasMovimentacoes = [];
let movimentacoesFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 10; // Registros exibidos por página

// Auxiliares para normalizar Entrada e Saída/Venda
function ehSaida(tipo) {
    if (!tipo) return false;
    const t = tipo.toString().toLowerCase().trim();
    return t === "saída" || t === "saida" || t === "venda";
}

function ehEntrada(tipo) {
    if (!tipo) return false;
    const t = tipo.toString().toLowerCase().trim();
    return t === "entrada" || t === "compra";
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("collapsed");
}

// 1. CARREGAMENTO INICIAL
async function carregarMovimentacoes() {
    try {
        let response = await fetch('/api/movimentacoes');
        
        // Fallback caso a rota no backend não use o prefixo /api
        if (!response.ok) {
            response = await fetch('/movimentacoes');
        }

        const dados = await response.json();
        todasMovimentacoes = Array.isArray(dados) ? dados : (dados.movimentacoes || dados.data || []);

        // Busca categorias em segundo plano
        carregarCategorias();

        // Processa os dados e renderiza a tela
        filtrarMovimentacoes();

    } catch (error) {
        console.error("Erro ao carregar movimentações:", error);
    }
}

// 2. BUSCA E PREENCHIMENTO DE CATEGORIAS
async function carregarCategorias() {
    try {
        let response = await fetch('/categorias');
        if (!response.ok) {
            response = await fetch('/api/categorias');
        }

        if (response.ok) {
            const dados = await response.json();
            const lista = Array.isArray(dados) ? dados : (dados.categorias || dados.data || []);

            const listaNomes = lista.map(c => {
                if (typeof c === 'object' && c !== null) {
                    return c.nome || c.nome_categoria || c.categoria || c.descricao || '';
                }
                return c;
            }).filter(n => n && n.toString().trim() !== "");

            if (listaNomes.length > 0) {
                preencherSelectCategorias([...new Set(listaNomes)].sort());
                return;
            }
        }
    } catch (error) {
        console.warn("Extraindo categorias das movimentações...");
    }

    extrairCategoriasDasMovimentacoes();
}

function extrairCategoriasDasMovimentacoes() {
    if (!Array.isArray(todasMovimentacoes)) return;

    const categoriasUnicas = [...new Set(
        todasMovimentacoes
            .map(m => m.categoria || m.categoria_nome || m.nome_categoria)
            .filter(cat => cat && cat.toString().trim() !== "")
    )].sort();

    if (categoriasUnicas.length > 0) {
        preencherSelectCategorias(categoriasUnicas);
    }
}

function preencherSelectCategorias(listaCategorias) {
    const selectCategoria = document.getElementById("categoria");
    if (!selectCategoria) return;

    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>';

    listaCategorias.forEach(categoria => {
        selectCategoria.innerHTML += `<option value="${categoria}">${categoria}</option>`;
    });
}

// 3. FILTRAGEM
function filtrarMovimentacoes() {
    if (!Array.isArray(todasMovimentacoes)) return;

    const busca = (document.getElementById("busca")?.value || "").toLowerCase().trim();
    const tipoFiltro = document.getElementById("tipo")?.value || "";
    const categoriaFiltro = document.getElementById("categoria")?.value || "";

    movimentacoesFiltradas = todasMovimentacoes.filter(mov => {
        // Busca por texto
        const textoCompleto = `${mov.id || ''} ${mov.produto || ''} ${mov.usuario || ''} ${mov.observacao || ''}`.toLowerCase();
        const passaBusca = !busca || textoCompleto.includes(busca);

        // Filtro de Tipo
        let passaTipo = true;
        if (tipoFiltro) {
            if (tipoFiltro === "Entrada") {
                passaTipo = ehEntrada(mov.tipo);
            } else if (tipoFiltro === "Saída") {
                passaTipo = ehSaida(mov.tipo);
            } else {
                passaTipo = mov.tipo === tipoFiltro;
            }
        }

        // Filtro de Categoria
        const catMov = mov.categoria || mov.categoria_nome || mov.nome_categoria || '';
        const passaCategoria = !categoriaFiltro || catMov === categoriaFiltro;

        return passaBusca && passaTipo && passaCategoria;
    });

    // Reseta para a primeira página a cada novo filtro
    paginaAtual = 1;

    // Atualiza os totais dos cards e o contador dinâmico
    atualizarCards(movimentacoesFiltradas);

    // Desenha a tabela com a página atual
    renderizarTabela();
}

// 4. CÁLCULO DOS CARDS DE RESUMO E CONTADOR DA TABELA
function atualizarCards(lista) {
    let entradas = 0;
    let saidas = 0;
    let valorTotal = 0;
    let movimentacoesHoje = 0;

    const hojeStr = new Date().toLocaleDateString("pt-BR");

    lista.forEach(mov => {
        const eEntrada = ehEntrada(mov.tipo);
        const eSaida = ehSaida(mov.tipo);

        if (eEntrada) entradas++;
        if (eSaida) saidas++;

        valorTotal += Number(mov.valor || 0);

        const dataObj = new Date(mov.data);
        if (!isNaN(dataObj) && dataObj.toLocaleDateString("pt-BR") === hojeStr) {
            movimentacoesHoje++;
        }
    });

    const elEntradas = document.getElementById("totalEntradas");
    const elSaidas = document.getElementById("totalSaidas");
    const elMovHoje = document.getElementById("movHoje");
    const elValorMov = document.getElementById("valorMov");

    if (elEntradas) elEntradas.textContent = entradas;
    if (elSaidas) elSaidas.textContent = saidas;
    if (elMovHoje) elMovHoje.textContent = movimentacoesHoje;
    if (elValorMov) {
        elValorMov.textContent = valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    // Atualiza o contador de registros encontrados na tabela
    const elContador = document.getElementById("contadorMovimentacoes") || document.getElementById("contadorProdutos");
    if (elContador) {
        const total = lista.length;
        const sufixo = total === 1 ? 'movimentação encontrada' : 'movimentações encontradas';
        elContador.textContent = `${total} ${sufixo}`;
    }
}

// 5. RENDERIZAÇÃO DA TABELA E PAGINAÇÃO
function renderizarTabela() {
    const tabela = document.getElementById('tabelaMovimentacoes');
    if (!tabela) return;

    tabela.innerHTML = '';

    const totalItens = movimentacoesFiltradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    // Ajusta limites da página
    if (paginaAtual < 1) paginaAtual = 1;
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    // Fatia a lista para exibir somente os itens da página atual
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensPagina = movimentacoesFiltradas.slice(inicio, fim);

    if (itensPagina.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #94a3b8; padding: 24px;">
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;
    } else {
        itensPagina.forEach(mov => {
            const eEntrada = ehEntrada(mov.tipo);
            const eSaida = ehSaida(mov.tipo);
            const dataObj = new Date(mov.data);

            const tipoExibicao = eSaida ? 'Saída' : (eEntrada ? 'Entrada' : (mov.tipo || '-'));
            const classeBadge = eEntrada ? 'tipo-entrada' : 'tipo-saida';

            tabela.innerHTML += `
                <tr>
                    <td>${mov.id || '-'}</td>
                    <td>
                        <span class="${classeBadge}">
                            ${tipoExibicao}
                        </span>
                    </td>
                    <td>${mov.produto || '-'}</td>
                    <td>${mov.quantidade || 0}</td>
                    <td>R$ ${Number(mov.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>${mov.usuario || '-'}</td>
                    <td>${isNaN(dataObj) ? '-' : dataObj.toLocaleString("pt-BR")}</td>
                    <td>${mov.observacao || '-'}</td>
                </tr>
            `;
        });
    }

    // Atualiza o texto e estado dos botões da paginação no HTML
    atualizarControlesPaginacao(totalPaginas);
}

// 6. ATUALIZAÇÃO DOS BOTÕES DE PAGINAÇÃO
function atualizarControlesPaginacao(totalPaginas) {
    const pageInfo = document.getElementById("pageInfo");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (btnPrev) {
        btnPrev.disabled = paginaAtual <= 1;
        btnPrev.style.opacity = paginaAtual <= 1 ? "0.5" : "1";
        btnPrev.style.cursor = paginaAtual <= 1 ? "not-allowed" : "pointer";
    }

    if (btnNext) {
        btnNext.disabled = paginaAtual >= totalPaginas;
        btnNext.style.opacity = paginaAtual >= totalPaginas ? "0.5" : "1";
        btnNext.style.cursor = paginaAtual >= totalPaginas ? "not-allowed" : "pointer";
    }
}

// 7. AÇÃO DOS BOTÕES ANTERIOR E PRÓXIMO
window.mudarPagina = function(direcao) {
    const totalPaginas = Math.ceil(movimentacoesFiltradas.length / itensPorPagina) || 1;
    const novaPagina = paginaAtual + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarTabela();
    }
};

// 8. LIMPAR FILTROS
function limparFiltros() {
    const elBusca = document.getElementById("busca");
    const elTipo = document.getElementById("tipo");
    const elCategoria = document.getElementById("categoria");

    if (elBusca) elBusca.value = "";
    if (elTipo) elTipo.value = "";
    if (elCategoria) elCategoria.value = "";

    filtrarMovimentacoes();
}

// Vincula eventos aos campos de filtro
["busca", "tipo", "categoria"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        const evento = (el.tagName === "INPUT" && el.type === "text") ? "input" : "change";
        el.addEventListener(evento, filtrarMovimentacoes);
    }
});

// Evento do botão limpar
const btnLimpar = document.getElementById("btnLimpar");
if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFiltros);
}

// Execução inicial
carregarMovimentacoes();