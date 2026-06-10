// =========================
// CARRINHO
// =========================

let carrinho = [];

// =========================
// ADICIONAR PRODUTO
// =========================

function adicionarCarrinho(
    id,
    nome,
    preco
) {

    const itemExistente =
        carrinho.find(
            item => item.id === id
        );

    if (itemExistente) {

        itemExistente.quantidade++;

    } else {

        carrinho.push({
            id: id,
            nome: nome,
            preco: preco,
            quantidade: 1
        });

    }

    renderizarCarrinho();

}

// =========================
// ALTERAR QTD
// =========================

function alterarQuantidade(
    id,
    valor
) {

    const item =
        carrinho.find(
            p => p.id === id
        );

    if (!item) return;

    item.quantidade += valor;

    if (item.quantidade <= 0) {

        carrinho =
            carrinho.filter(
                p => p.id !== id
            );

    }

    renderizarCarrinho();

}

// =========================
// RENDERIZAR
// =========================

function renderizarCarrinho() {

    const container =
        document.getElementById(
            "cartItems"
        );

    const totalEl =
        document.getElementById(
            "cartTotal"
        );

    const countEl =
        document.getElementById(
            "cartCount"
        );

    if (
        !container ||
        !totalEl ||
        !countEl
    ) return;

    if (carrinho.length === 0) {

        container.innerHTML = `
            <div class="cart-empty">
                🛒
                <p>Nenhum produto adicionado</p>
            </div>
        `;

        totalEl.innerText =
            "R$ 0,00";

        countEl.innerText =
            "0 itens";

        return;

    }

    let html = "";

    let total = 0;

    let quantidadeTotal = 0;

    carrinho.forEach(item => {

        const subtotal =
            item.preco *
            item.quantidade;

        total += subtotal;

        quantidadeTotal +=
            item.quantidade;

        html += `
        <div class="cart-item">

            <div class="cart-item-top">

                <div class="cart-item-name">
                    ${item.nome}
                </div>

                <div class="cart-item-price">
                    R$ ${subtotal.toFixed(2)}
                </div>

            </div>

            <div class="cart-qty">

                <button
                    onclick="
                        alterarQuantidade(
                            ${item.id},
                            -1
                        )
                    "
                >
                    -
                </button>

                <span>
                    ${item.quantidade}
                </span>

                <button
                    onclick="
                        alterarQuantidade(
                            ${item.id},
                            1
                        )
                    "
                >
                    +
                </button>

            </div>

        </div>
        `;

    });

    container.innerHTML = html;

    totalEl.innerText =
        `R$ ${total.toFixed(2)}`;

    countEl.innerText =
        `${quantidadeTotal} itens`;

}

// =========================
// BUSCA
// =========================

const searchInput =
    document.getElementById(
        "searchInput"
    );

if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        filtrarProdutos
    );

}

// =========================
// CATEGORIA
// =========================

const categoriaSelect =
    document.getElementById(
        "categoriaSelect"
    );

if (categoriaSelect) {

    categoriaSelect.addEventListener(
        "change",
        filtrarProdutos
    );

}

// =========================
// FILTRO
// =========================

function filtrarProdutos() {

    const busca =
        searchInput
            .value
            .toLowerCase();

    const categoria =
        categoriaSelect.value;

    const cards =
        document.querySelectorAll(
            ".produto-card"
        );

    cards.forEach(card => {

        const nome =
            card.dataset.nome
                .toLowerCase();

        const categoriaProduto =
            card.dataset.categoria;

        const buscaOk =
            nome.includes(busca);

        const categoriaOk =
            categoria === "" ||
            categoriaProduto === categoria;

        if (
            buscaOk &&
            categoriaOk
        ) {

            card.style.display =
                "block";

        } else {

            card.style.display =
                "none";

        }

    });

}

// =========================
// FINALIZAR VENDA
// =========================

const btnFinalizar =
    document.getElementById(
        "btnFinalizar"
    );

if (btnFinalizar) {

    btnFinalizar.addEventListener(
        "click",
        finalizarVenda
    );

}

function finalizarVenda() {

    if (
        carrinho.length === 0
    ) {

        return;

    }

    let total = 0;

    carrinho.forEach(item => {

        total +=
            item.preco *
            item.quantidade;

    });

    document.getElementById(
        "vendaTotal"
    ).innerText =
        `Total: R$ ${total.toFixed(2)}`;

    document
        .getElementById(
            "modalSucesso"
        )
        .classList.add(
            "show"
        );

    carrinho = [];

    renderizarCarrinho();

}

// =========================
// FECHAR MODAL
// =========================

window.addEventListener(
    "click",
    function(e) {

        const modal =
            document.getElementById(
                "modalSucesso"
            );

        if (
            modal &&
            e.target === modal
        ) {

            modal.classList.remove(
                "show"
            );

        }

    }
);

// =========================
// LOAD
// =========================

window.addEventListener(
    "load",
    () => {

        renderizarCarrinho();

    }
);