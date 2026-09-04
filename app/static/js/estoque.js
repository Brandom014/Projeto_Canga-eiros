
// ==========================================
// CONFIGURAÇÕES E ESTADO GLOBAL
// ==========================================
let paginaAtual = 1;
const itensPorPagina = 4; // Quantidade de itens por página

document.addEventListener("DOMContentLoaded", function () {
    // Aplica os filtros e paginação ao carregar a página
    filtrarProdutos();
});

// ==========================================
// SIDEBAR TOGGLE
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("collapsed");
    }
}

// ==========================================
// FILTRAGEM, PESQUISA E PAGINAÇÃO
// ==========================================
function filtrarProdutos() {
    const busca = (document.getElementById("searchInput")?.value || "").toLowerCase().trim();
    const statusFiltro = (document.getElementById("statusSelect")?.value || "").toLowerCase().trim();
    const categoriaFiltro = (document.getElementById("categoriaSelect")?.value || "").toLowerCase().trim();

    // Seleciona todas as linhas da tabela, exceto a linha de "sem resultados"
    const linhas = document.querySelectorAll(".products-table tbody tr:not(#semResultados)");
    const mensagemSemResultados = document.getElementById("semResultados");

    const produtosFiltrados = [];

    linhas.forEach(linha => {
        const nome = (linha.getAttribute("data-nome") || "").toLowerCase();
        const categoria = (linha.getAttribute("data-categoria") || "").toLowerCase();
        const status = (linha.getAttribute("data-status") || "").toLowerCase();
        const estoque = parseInt(linha.getAttribute("data-estoque") || "0", 10);

        // Validação da busca
        const buscaOk = busca === "" || nome.includes(busca);
        const categoriaOk = categoriaFiltro === "" || categoria === categoriaFiltro;

        // Validação do status (Produto com estoque 0 sempre é considerado inativo)
        let statusOk = false;
        if (statusFiltro === "") {
            statusOk = true;
        } else if (statusFiltro === "ativo") {
            statusOk = (status === "ativo" && estoque > 0);
        } else if (statusFiltro === "inativo") {
            statusOk = (status === "inativo" || estoque <= 0);
        }

        // Esconde a linha por padrão
        linha.style.display = "none";

        if (buscaOk && categoriaOk && statusOk) {
            produtosFiltrados.push(linha);
        }
    });

    const totalEncontrados = produtosFiltrados.length;

    // Exibe ou oculta a mensagem de zero resultados
    if (mensagemSemResultados) {
        mensagemSemResultados.style.display = totalEncontrados === 0 ? "table-row" : "none";
    }

    // Cálculos de Paginação
    const totalPaginas = Math.ceil(totalEncontrados / itensPorPagina) || 1;
    
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const paginaVisivel = produtosFiltrados.slice(inicio, fim);

    // Exibe apenas os produtos pertencentes à página atual
    paginaVisivel.forEach(linha => {
        linha.style.display = "";
    });

    // Atualiza contadores e botões de interface
    atualizarControlesInterface(totalEncontrados, totalPaginas);
}

function atualizarControlesInterface(totalEncontrados, totalPaginas) {
    const contador = document.getElementById("contadorProdutos");
    if (contador) {
        contador.textContent = `${totalEncontrados} produto(s) encontrado(s)`;
    }

    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (btnPrev) btnPrev.disabled = paginaAtual <= 1;
    if (btnNext) btnNext.disabled = paginaAtual >= totalPaginas || totalEncontrados === 0;
}

function mudarPagina(direcao) {
    paginaAtual += direcao;
    filtrarProdutos();
}

function limparFiltros() {
    const searchInput = document.getElementById("searchInput");
    const statusSelect = document.getElementById("statusSelect");
    const categoriaSelect = document.getElementById("categoriaSelect");

    if (searchInput) searchInput.value = "";
    if (statusSelect) statusSelect.value = "";
    if (categoriaSelect) categoriaSelect.value = "";

    paginaAtual = 1;
    filtrarProdutos();
}

// ==========================================
// MODAL DE EDIÇÃO
// ==========================================
function abrirModalEditar(id, nome, preco, estoque) {
    const modal = document.getElementById("modalEditar");
    const form = document.getElementById("formEditar");

    if (!modal || !form) return;

    document.getElementById("produtoId").value = id;
    document.getElementById("produtoNome").value = nome;
    document.getElementById("produtoPreco").value = preco;
    document.getElementById("produtoEstoque").value = estoque;

    form.action = `/estoque/editar/${id}`;
    modal.classList.add("show");
}

function fecharModalEditar() {
    const modal = document.getElementById("modalEditar");
    if (modal) {
        modal.classList.remove("show");
    }
}

// ==========================================
// MODAL DE EXCLUSÃO
// ==========================================
function abrirModalExcluir(id) {
    const modal = document.getElementById("modalExcluir");
    const form = document.getElementById("formExcluir");

    if (!modal || !form) return;

    document.getElementById("deleteId").value = id;
    form.action = `/estoque/excluir/${id}`;

    modal.classList.add("show");
}

function fecharModalExcluir() {
    const modal = document.getElementById("modalExcluir");
    if (modal) {
        modal.classList.remove("show");
    }
}

// ==========================================
// EVENTOS DE FECHAMENTO (CLIQUE FORA E ESC)
// ==========================================
window.addEventListener("click", function (e) {
    const modalEditar = document.getElementById("modalEditar");
    const modalExcluir = document.getElementById("modalExcluir");

    if (e.target === modalEditar) fecharModalEditar();
    if (e.target === modalExcluir) fecharModalExcluir();
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        fecharModalEditar();
        fecharModalExcluir();
    }
});