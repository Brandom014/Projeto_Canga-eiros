function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// =========================
// CARRINHO
// =========================

let carrinho = [];
let formaPagamento = null;

// =========================
// ADICIONAR PRODUTO
// =========================

document
.querySelectorAll(".add-product")
.forEach(btn => {

    btn.addEventListener("click", () => {

        const id = parseInt(btn.dataset.id);
        const nome = btn.dataset.nome;
        const preco = parseFloat(btn.dataset.preco);

        const itemExistente =
            carrinho.find(
                item => item.id === id
            );

        if (itemExistente) {
            itemExistente.quantidade++;
        } else {

            carrinho.push({
                id,
                nome,
                preco,
                quantidade: 1
            });

        }

        renderizarCarrinho();

    });

});

// =========================
// ALTERAR QTD
// =========================

function alterarQuantidade(id, valor) {

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
// RENDERIZAR CARRINHO
// =========================

function renderizarCarrinho() {

    const container =
        document.getElementById("cartItems");

    const subtotalEl =
        document.getElementById("subtotal");

    const totalEl =
        document.getElementById("total");

    if (!container) return;

    if (carrinho.length === 0) {

        container.innerHTML = `
            <div class="empty-cart">
                Nenhum produto adicionado
            </div>
        `;

        subtotalEl.innerText = "R$ 0,00";
        totalEl.innerText = "R$ 0,00";

        return;
    }

    let html = "";
    let subtotal = 0;

    carrinho.forEach(item => {

        const valor =
            item.preco *
            item.quantidade;

        subtotal += valor;

        html += `
            <div class="cart-item">

                <div class="cart-info">
                    <h4>${item.nome}</h4>
                    <small>
                        R$ ${item.preco.toFixed(2)}
                    </small>
                </div>

                <div class="qty-controls">

                    <button
                        onclick="alterarQuantidade(${item.id}, -1)">
                        -
                    </button>

                    <span>
                        ${item.quantidade}
                    </span>

                    <button
                        onclick="alterarQuantidade(${item.id}, 1)">
                        +
                    </button>

                </div>

                <strong>
                    R$ ${valor.toFixed(2)}
                </strong>

            </div>
        `;
    });

    const total = subtotal;

    subtotalEl.innerText =
        `R$ ${subtotal.toFixed(2)}`;

    totalEl.innerText =
        `R$ ${total.toFixed(2)}`;
// =========================
// LIMPAR
// =========================

const clearCart =
    document.getElementById("clearCart");

if (clearCart) {

    clearCart.addEventListener(
        "click",
        () => {

            carrinho = [];

            renderizarCarrinho();

        }
    );

}

// =========================
// PAGAMENTO
// =========================

document
.querySelectorAll(".payment-btn")
.forEach(btn => {

    btn.addEventListener("click", () => {

        document
            .querySelectorAll(".payment-btn")
            .forEach(b => {

                b.classList.remove(
                    "active"
                );

            });

        btn.classList.add("active");

        formaPagamento =
            btn.dataset.payment;

    });

});

// =========================
// BUSCA
// =========================

const searchInput =
    document.getElementById(
        "searchInput"
    );

const categoriaFilter =
    document.getElementById(
        "categoriaFilter"
    );

if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        filtrarProdutos
    );

}

if (categoriaFilter) {

    categoriaFilter.addEventListener(
        "change",
        filtrarProdutos
    );

}

function filtrarProdutos() {

    const busca =
        searchInput.value.toLowerCase();

    const categoria =
        categoriaFilter.value;

    document
        .querySelectorAll(".product-card")
        .forEach(card => {

            const nome =
                card.dataset.nome;

            const categoriaProduto =
                card.dataset.categoria;

            const nomeOk =
                nome.includes(busca);

            const categoriaOk =
                categoria === "" ||
                categoriaProduto === categoria;

            card.style.display =
                nomeOk && categoriaOk
                    ? ""
                    : "none";

        });

}

// =========================
// FINALIZAR VENDA
// =========================

const btnFinalizar =
    document.getElementById(
        "finalizarVenda"
    );

if (btnFinalizar) {

    btnFinalizar.addEventListener(
        "click",
        finalizarVenda
    );

}

async function finalizarVenda() {

    if (carrinho.length === 0) {

        alert(
            "Carrinho vazio!"
        );

        return;
    }

    try {

        const response =
            await fetch(
                "/vendas/finalizar",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({

                        itens: carrinho.map(
                            item => ({
                                produto_id:
                                    item.id,

                                quantidade:
                                    item.quantidade
                            })
                        )

                    })
                }
            );

        const dados =
            await response.json();

        if (!response.ok) {

            alert(
                dados.detail ||
                "Erro ao finalizar venda"
            );

            return;
        }

        alert(
            `Venda #${dados.venda_id} realizada com sucesso!`
        );

        carrinho = [];

        renderizarCarrinho();

        location.reload();

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro ao conectar com o servidor."
        );
    }

}

// =========================
// LOAD
// =========================

window.addEventListener(
    "load",
    renderizarCarrinho
);

}