let paginaAtual = 1;
const itensPorPagina = 4; // Defina a quantidade de itens visíveis por página

// Inicializa os filtros e a paginação ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
    filtrarProdutos();
});

function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// =========================
// PRODUTOS
// =========================

function abrirModalCriar() {
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modalForm").action = "/produtos/criar";
    document.getElementById("modalTitle").innerText = "Novo Produto";

    document.getElementById("nome").value = "";
    document.getElementById("categoria").selectedIndex = 0;
    document.getElementById("preco").value = "";
    document.getElementById("estoque").value = "";
}

function abrirModalEditar(
    id,
    nome,
    categoria,
    preco,
    estoque
) {
    document.getElementById("modal").classList.remove("hidden");

    document.getElementById("modalForm").action = `/produtos/editar/${id}`;

    document.getElementById("modalTitle").innerText = "Editar Produto";

    document.getElementById("nome").value = nome;
    document.getElementById("categoria").value = categoria;
    document.getElementById("preco").value = preco;
    document.getElementById("estoque").value = estoque;
}

function fecharModal() {
    document.getElementById("modal").classList.add("hidden");
}

// =========================
// CATEGORIAS
// =========================

function abrirModalCategoria() {
    document.getElementById("modalCategoria").classList.remove("hidden");
}

function fecharCategoria() {
    document.getElementById("modalCategoria").classList.add("hidden");
}

// =========================
// PESQUISA E PAGINAÇÃO
// =========================

function filtrarProdutos() {
    const busca = (document.getElementById("searchInput")?.value || "")
        .toLowerCase()
        .trim();

    const categoriaFiltro = (document.getElementById("categoriaFilter")?.value || "")
        .toLowerCase();

    const statusFiltro = (document.getElementById("statusFilter")?.value || "")
        .toLowerCase();

    const linhas = document.querySelectorAll(
        ".products-table tbody tr:not(#semResultados)"
    );

    const mensagem = document.getElementById("semResultados");

    // Array para armazenar as linhas filtradas que atendem aos critérios
    const produtosFiltrados = [];

    linhas.forEach(linha => {
        // Fallbacks adicionados para evitar erros caso o atributo venha nulo
        const nome = (linha.getAttribute("data-nome") || "").toLowerCase();
        const categoria = (linha.getAttribute("data-categoria") || "").toLowerCase();
        const status = (linha.getAttribute("data-status") || "").toLowerCase();

        const buscaOk = busca === "" || nome.includes(busca);
        const categoriaOk = categoriaFiltro === "" || categoria === categoriaFiltro;
        const statusOk = statusFiltro === "" || status === statusFiltro;

        // Esconde todas as linhas por padrão
        linha.style.display = "none";

        if (buscaOk && categoriaOk && statusOk) {
            produtosFiltrados.push(linha);
        }
    });

    const contador = produtosFiltrados.length;

    // MOSTRA A MENSAGEM QUANDO NÃO ENCONTRAR NADA
    if (mensagem) {
        mensagem.style.display = contador === 0 ? "table-row" : "none";
    }

    // LÓGICA DA PAGINAÇÃO
    const totalPaginas = Math.ceil(contador / itensPorPagina) || 1;
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const paginaVisivel = produtosFiltrados.slice(inicio, fim);

    // Exibe apenas os itens da página atual
    paginaVisivel.forEach(linha => {
        linha.style.display = "";
    });

    // ATUALIZA CONTADOR
    const contadorElemento = document.getElementById("contadorProdutos");
    if (contadorElemento) {
        contadorElemento.textContent = `${contador} produtos encontrados`;
    }

    // ATUALIZA OS CONTROLES DE PAGINAÇÃO
    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (btnPrev) btnPrev.disabled = paginaAtual <= 1;
    if (btnNext) btnNext.disabled = paginaAtual >= totalPaginas || contador === 0;
}

function mudarPagina(direcao) {
    paginaAtual += direcao;
    filtrarProdutos();
}

function limparFiltros() {
    const inputSearch = document.getElementById("searchInput");
    const selectCat = document.getElementById("categoriaFilter");
    const selectStatus = document.getElementById("statusFilter");

    if (inputSearch) inputSearch.value = "";
    if (selectCat) selectCat.value = "";
    if (selectStatus) selectStatus.value = "";

    paginaAtual = 1;
    filtrarProdutos();
}

// =========================
// FECHAR MODAL AO CLICAR FORA
// =========================

window.addEventListener("click", function(e) {
    const modalProduto = document.getElementById("modal");
    const modalCategoria = document.getElementById("modalCategoria");
    const modalConfirm = document.getElementById("confirmModal");

    if (e.target === modalProduto) fecharModal();
    if (e.target === modalCategoria) fecharCategoria();
    if (e.target === modalConfirm) fecharConfirmacaoProduto();
});

// =========================
// ESC FECHA MODAIS
// =========================

document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        fecharModal();
        fecharCategoria();
        fecharConfirmacaoProduto();
    }
});

// =========================
// EXCLUIR PRODUTO
// =========================

let produtoExcluirId = null;

function abrirConfirmacaoProduto(id, nome) {
    produtoExcluirId = id;
    document.getElementById("produtoExcluirNome").textContent = nome;
    document.getElementById("confirmModal").classList.remove("hidden");
}

function fecharConfirmacaoProduto() {
    document.getElementById("confirmModal").classList.add("hidden");
    produtoExcluirId = null;
}

function confirmarDeleteProduto() {
    if (!produtoExcluirId) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/produtos/excluir/${produtoExcluirId}`;

    document.body.appendChild(form);
    form.submit();
}