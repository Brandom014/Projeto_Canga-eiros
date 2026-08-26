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

    const busca = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const categoriaFiltro = document
        .getElementById("categoriaFilter")
        .value
        .toLowerCase();

    const statusFiltro = document
        .getElementById("statusFilter")
        .value
        .toLowerCase();

    const linhas = document.querySelectorAll(
        ".products-table tbody tr:not(#semResultados)"
    );

    const mensagem = document.getElementById("semResultados");

    let contador = 0;

    linhas.forEach(linha => {

        const nome = linha
            .getAttribute("data-nome")
            .toLowerCase();

        const categoria = linha
            .getAttribute("data-categoria")
            .toLowerCase();

        const status = linha
            .getAttribute("data-status")
            .toLowerCase();

        const buscaOk =
            busca === "" ||
            nome.includes(busca);

        const categoriaOk =
            categoriaFiltro === "" ||
            categoria === categoriaFiltro;

        const statusOk =
            statusFiltro === "" ||
            status === statusFiltro;

        if (
            buscaOk &&
            categoriaOk &&
            statusOk
        ) {

            linha.style.display = "";
            contador++;

        } else {

            linha.style.display = "none";

        }

    });

    // MOSTRA A MENSAGEM QUANDO NÃO ENCONTRAR NADA

    if (mensagem) {

        if (contador === 0) {

            mensagem.style.display = "table-row";

        } else {

            mensagem.style.display = "none";

        }

    }

    // ATUALIZA CONTADOR

    const contadorElemento =
        document.getElementById("contadorProdutos");

    if (contadorElemento) {

        contadorElemento.textContent =
            `${contador} produtos encontrados`;

    }

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

// =========================
// EXCLUIR PRODUTO
// =========================

let produtoExcluirId = null;

function abrirConfirmacaoProduto(id, nome) {

    produtoExcluirId = id;

    document.getElementById("produtoExcluirNome").textContent = nome;

    document
        .getElementById("confirmModal")
        .classList.remove("hidden");
}


function fecharConfirmacaoProduto() {

    document
        .getElementById("confirmModal")
        .classList.add("hidden");

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