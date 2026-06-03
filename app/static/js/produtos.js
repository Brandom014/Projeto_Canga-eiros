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

    let filtro =
        document.getElementById("searchInput")
        .value
        .toLowerCase();

    let linhas =
        document.querySelectorAll("tbody tr");

    linhas.forEach(linha => {

        let texto =
            linha.textContent.toLowerCase();

        if (texto.includes(filtro)) {
            linha.style.display = "";
        } else {
            linha.style.display = "none";
        }

    });
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