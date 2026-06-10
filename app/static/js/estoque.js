function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}


// =========================
// ELEMENTOS
// =========================

const searchInput =
    document.getElementById("searchInput");

const statusSelect =
    document.querySelector(
        ".filter-card select:first-of-type"
    );

const categoriaSelect =
    document.getElementById(
        "categoriaSelect"
    );

const btnLimpar =
    document.querySelector(
        ".filter-card button"
    );

// =========================
// EVENTOS
// =========================

if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        filtrarProdutos
    );

}

if (statusSelect) {

    statusSelect.addEventListener(
        "change",
        filtrarProdutos
    );

}

if (categoriaSelect) {

    categoriaSelect.addEventListener(
        "change",
        filtrarProdutos
    );

}

// =========================
// FILTRAR PRODUTOS
// =========================

function filtrarProdutos() {

    const busca =
        searchInput
            ? searchInput.value.toLowerCase()
            : "";

    const statusFiltro =
        statusSelect
            ? statusSelect.value.toLowerCase()
            : "";

    const categoriaFiltro =
        categoriaSelect
            ? categoriaSelect.value.toLowerCase()
            : "";

    const linhas =
        document.querySelectorAll(
            "tbody tr"
        );

    let contador = 0;

    linhas.forEach(linha => {

        const nome =
            linha
                .querySelector(
                    ".produto-info strong"
                )
                .textContent
                .toLowerCase();

        const categoria =
            linha.children[1]
                .textContent
                .trim()
                .toLowerCase();

        const status =
            linha
                .querySelector(".status")
                .textContent
                .toLowerCase();

        const buscaOk =
            nome.includes(busca);

        const statusOk =
            statusFiltro === "" ||
            statusFiltro === "todos" ||
            status.includes(statusFiltro);

        const categoriaOk =
            categoriaFiltro === "" ||
            categoria.includes(categoriaFiltro);

        if (
            buscaOk &&
            statusOk &&
            categoriaOk
        ) {

            linha.style.display = "";
            contador++;

        } else {

            linha.style.display = "none";

        }

    });

    atualizarContador(contador);

}

// =========================
// CONTADOR
// =========================

function atualizarContador(qtd) {

    const contador =
        document.querySelector(
            ".table-top span"
        );

    if (!contador) return;

    contador.textContent =
        `${qtd} produto(s)`;

}

// =========================
// LIMPAR FILTROS
// =========================

if (btnLimpar) {

    btnLimpar.addEventListener(
        "click",
        () => {

            if (searchInput) {
                searchInput.value = "";
            }

            if (statusSelect) {
                statusSelect.selectedIndex = 0;
            }

            if (categoriaSelect) {
                categoriaSelect.selectedIndex = 0;
            }

            filtrarProdutos();

        }
    );

}

// =========================
// MODAL EDITAR
// =========================

const formEditar =
    document.getElementById(
        "formEditar"
    );

if (formEditar) {

    formEditar.addEventListener(
        "submit",
        function () {

            const id =
                document.getElementById(
                    "produtoId"
                ).value;

            this.action =
                `/estoque/editar/${id}`;

        }
    );

}

// =========================
// MODAL EXCLUIR
// =========================

const formExcluir =
    document.getElementById(
        "formExcluir"
    );

if (formExcluir) {

    formExcluir.addEventListener(
        "submit",
        function () {

            const id =
                document.getElementById(
                    "deleteId"
                ).value;

            this.action =
                `/estoque/excluir/${id}`;

        }
    );

}

// =========================
// FECHAR MODAIS
// =========================

window.addEventListener(
    "click",
    function (e) {

        const modalEditar =
            document.getElementById(
                "modalEditar"
            );

        const modalExcluir =
            document.getElementById(
                "modalExcluir"
            );

        if (
            modalEditar &&
            e.target === modalEditar
        ) {

            modalEditar.classList.remove(
                "show"
            );

        }

        if (
            modalExcluir &&
            e.target === modalExcluir
        ) {

            modalExcluir.classList.remove(
                "show"
            );

        }

    }
);

// =========================
// ANIMAÇÃO DOS CARDS
// =========================

window.addEventListener(
    "load",
    () => {

        const cards =
            document.querySelectorAll(
                ".stat-card"
            );

        cards.forEach(
            (card, index) => {

                card.style.opacity = "0";
                card.style.transform =
                    "translateY(20px)";

                setTimeout(() => {

                    card.style.transition =
                        ".4s ease";

                    card.style.opacity = "1";

                    card.style.transform =
                        "translateY(0)";

                }, index * 100);

            }
        );

    }
);