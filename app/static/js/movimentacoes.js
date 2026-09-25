// Variáveis globais
let todasMovimentacoes = [];
let movimentacoesFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 4; // Registros exibidos por página

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

// 1. SISTEMA DE NOTIFICAÇÕES (TOAST)
function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    let container = document.getElementById("toast-container");
    
    // Cria o contêiner de notificações se ainda não existir
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    // Ícones do FontAwesome
    let icone = 'fa-circle-check';
    if (tipo === 'erro') icone = 'fa-circle-xmark';
    if (tipo === 'alerta') icone = 'fa-triangle-exclamation';

    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <i class="fa-solid ${icone}" style="font-size: 1.25rem;"></i>
        <span style="flex: 1;">${mensagem}</span>
    `;

    container.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    // Remoção automática após 3.5 segundos
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// 2. CARREGAMENTO INICIAL DE MOVIMENTAÇÕES
async function carregarMovimentacoes() {
    try {
        let response = await fetch('/api/movimentacoes');
        
        // Fallback caso a rota não use o prefixo /api
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

// 3. BUSCA E PREENCHIMENTO DE CATEGORIAS
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

// 4. FILTRAGEM
function filtrarMovimentacoes() {
    if (!Array.isArray(todasMovimentacoes)) return;

    const busca = (document.getElementById("busca")?.value || "").toLowerCase().trim();
    const tipoFiltro = document.getElementById("tipo")?.value || "";
    const categoriaFiltro = document.getElementById("categoria")?.value || "";

    movimentacoesFiltradas = todasMovimentacoes.filter(mov => {
        const textoCompleto = `${mov.id || ''} ${mov.produto || ''} ${mov.usuario || ''} ${mov.observacao || ''}`.toLowerCase();
        const passaBusca = !busca || textoCompleto.includes(busca);

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

        const catMov = mov.categoria || mov.categoria_nome || mov.nome_categoria || '';
        const passaCategoria = !categoriaFiltro || catMov === categoriaFiltro;

        return passaBusca && passaTipo && passaCategoria;
    });

    paginaAtual = 1;

    atualizarCards(movimentacoesFiltradas);
    renderizarTabela();
}

// 5. CÁLCULO DOS CARDS DE RESUMO E CONTADOR
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

    const elContador = document.getElementById("contadorMovimentacoes") || document.getElementById("contadorProdutos");
    if (elContador) {
        const total = lista.length;
        const sufixo = total === 1 ? 'movimentação encontrada' : 'movimentações encontradas';
        elContador.textContent = `${total} ${sufixo}`;
    }
}

// 6. RENDERIZAÇÃO DA TABELA E PAGINAÇÃO
function renderizarTabela() {
    const tabela = document.getElementById('tabelaMovimentacoes');
    if (!tabela) return;

    tabela.innerHTML = '';

    const totalItens = movimentacoesFiltradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    if (paginaAtual < 1) paginaAtual = 1;
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

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

    atualizarControlesPaginacao(totalPaginas);
}

// 7. CONTROLES DE PAGINAÇÃO
function atualizarControlesPaginacao(totalPaginas) {
    const pageInfo = document.getElementById("pageInfo");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (btnPrev) btnPrev.style.opacity = "1";
    if (btnNext) btnNext.style.opacity = "1";
}

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

// 9. LÓGICA DO MODAL E BUSCA DE PRODUTOS COM ESTOQUE
async function carregarProdutosNoSelect() {
    const selectProduto = document.getElementById("produto_id");
    if (!selectProduto) return;

    selectProduto.innerHTML = '<option value="">Carregando produtos...</option>';

    try {
        const response = await fetch('/produtos/listar', {
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const produtos = await response.json();

            if (Array.isArray(produtos) && produtos.length > 0) {
                selectProduto.innerHTML = '<option value="">Selecione um produto...</option>';
                produtos.forEach(p => {
                    const qtdEstoque = p.estoque ?? 0;
                    selectProduto.innerHTML += `<option value="${p.id}">${p.nome} (Estoque: ${qtdEstoque})</option>`;
                });
                return;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar produtos:", error);
    }

    selectProduto.innerHTML = '<option value="">Nenhum produto encontrado</option>';
}

window.abrirModal = function() {
    const modal = document.getElementById("modalMovimentacao");
    if (modal) {
        modal.style.display = "flex";
        carregarProdutosNoSelect();
    }
};

window.fecharModal = function() {
    const modal = document.getElementById("modalMovimentacao");
    const form = document.getElementById("formMovimentacao");
    if (modal) modal.style.display = "none";
    if (form) form.reset();
};

// 10. SALVAR MOVIMENTAÇÃO COM VALOR E TOAST
window.salvarMovimentacao = async function(event) {
    event.preventDefault();

    const produto_id = parseInt(document.getElementById("produto_id")?.value);
    const tipo = document.getElementById("tipo_mov")?.value;
    const quantidade = parseInt(document.getElementById("quantidade")?.value);
    const valor = parseFloat(document.getElementById("valor")?.value) || 0.0;
    const observacao = document.getElementById("observacao")?.value || null;

    if (!produto_id || !tipo || isNaN(quantidade)) {
        mostrarNotificacao("Preencha todos os campos obrigatórios.", "alerta");
        return;
    }

    try {
        const response = await fetch('/api/movimentacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                produto_id,
                tipo,
                quantidade,
                valor,
                observacao
            })
        });

        if (response.ok) {
            mostrarNotificacao("Movimentação cadastrada com sucesso!", "sucesso");
            fecharModal();
            carregarMovimentacoes();
        } else {
            const erro = await response.json();
            mostrarNotificacao(erro.detail || 'Não foi possível salvar a movimentação.', "erro");
        }
    } catch (error) {
        console.error("Erro ao salvar movimentação:", error);
        mostrarNotificacao("Erro de conexão com o servidor.", "erro");
    }
};

// 11. EVENT LISTENERS E INICIALIZAÇÃO
["busca", "tipo", "categoria"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        const evento = (el.tagName === "INPUT" && el.type === "text") ? "input" : "change";
        el.addEventListener(evento, filtrarMovimentacoes);
    }
});

const btnLimpar = document.getElementById("btnLimpar");
if (btnLimpar) {
    btnLimpar.addEventListener("click", limparFiltros);
}

// Inicializa a tabela ao carregar o script
carregarMovimentacoes();