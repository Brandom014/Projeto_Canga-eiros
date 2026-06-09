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

    document.getElementById(
        "modalForm"
    ).action = `/produtos/editar/${id}`;

    document.getElementById("modalTitle").innerText =
        "Editar Produto";

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
    document
        .getElementById("modalCategoria")
        .classList.remove("hidden");
}

function fecharCategoria() {
    document
        .getElementById("modalCategoria")
        .classList.add("hidden");
}

// =========================
// PESQUISA
// =========================

function filtrarProdutos() {

    const busca =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    const categoria =
        document.getElementById("categoriaFilter")
        .value
        .toLowerCase();

    const status =
        document.getElementById("statusFilter")
        .value
        .toLowerCase();

    const linhas =
        document.querySelectorAll(
            ".products-table tbody tr[data-nome]"
        );

    let totalVisiveis = 0;

    linhas.forEach(linha => {

        const nome =
            linha.dataset.nome || "";

        const cat =
            linha.dataset.categoria || "";

        const stat =
            linha.dataset.status || "";

        const matchBusca =
            nome.includes(busca);

        const matchCategoria =
            categoria === "" ||
            cat.includes(categoria);

        const matchStatus =
            status === "" ||
            stat.includes(status);

        const mostrar =
            matchBusca &&
            matchCategoria &&
            matchStatus;

        linha.style.display =
            mostrar ? "" : "none";

        if (mostrar) {
            totalVisiveis++;
        }

    });

    const contador =
        document.getElementById("contadorProdutos");

    if (contador) {
        contador.innerText =
            `${totalVisiveis} produto${totalVisiveis !== 1 ? "s" : ""} encontrado${totalVisiveis !== 1 ? "s" : ""}`;
    }

    const semResultados =
        document.getElementById("semResultados");

    if (semResultados) {
        semResultados.style.display =
            totalVisiveis === 0 ? "" : "none";
    }
}

function limparFiltros() {

    document.getElementById(
        "searchInput"
    ).value = "";

    document.getElementById(
        "categoriaFilter"
    ).selectedIndex = 0;

    document.getElementById(
        "statusFilter"
    ).selectedIndex = 0;

    filtrarProdutos();
}

// =========================
// FECHAR MODAL AO CLICAR FORA
// =========================

window.addEventListener("click", function(e) {

    const modalProduto =
        document.getElementById("modal");

    const modalCategoria =
        document.getElementById("modalCategoria");

    if (e.target === modalProduto) {
        fecharModal();
    }

    if (e.target === modalCategoria) {
        fecharCategoria();
    }

});

// =========================
// ESC FECHA MODAIS
// =========================

document.addEventListener("keydown", function(e) {

    if (e.key === "Escape") {

        fecharModal();
        fecharCategoria();

    }

});