function toggleSidebar() {
    document.getElementById("sidebar")?.classList.toggle("collapsed");
}

let carrinho = [];
let formaPagamento = null;

document.querySelectorAll(".add-product").forEach((btn) => {
    btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const estoque = Number(btn.dataset.estoque || 0);
        const item = carrinho.find((produto) => produto.id === id);

        if (item) {
            if (item.quantidade >= estoque) {
                mostrarMensagem("Quantidade maior que o estoque disponível.", "error");
                return;
            }
            item.quantidade += 1;
        } else {
            carrinho.push({
                id,
                nome: btn.dataset.nome,
                preco: Number(btn.dataset.preco),
                quantidade: 1,
                estoque,
            });
        }

        renderizarCarrinho();
    });
});

function alterarQuantidade(id, valor) {
    const item = carrinho.find((produto) => produto.id === id);
    if (!item) return;

    const novaQuantidade = item.quantidade + valor;
    if (novaQuantidade > item.estoque) {
        mostrarMensagem("Quantidade maior que o estoque disponível.", "error");
        return;
    }

    if (novaQuantidade <= 0) {
        removerItem(id);
        return;
    }

    item.quantidade = novaQuantidade;
    renderizarCarrinho();
}

function removerItem(id) {
    carrinho = carrinho.filter((item) => item.id !== id);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const container = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = '<div class="empty-cart">Nenhum produto adicionado</div>';
        subtotalEl.textContent = "R$ 0,00";
        totalEl.textContent = "R$ 0,00";
        return;
    }

    let subtotal = 0;
    container.innerHTML = carrinho.map((item) => {
        const valor = item.preco * item.quantidade;
        subtotal += valor;
        return `
            <div class="cart-item">
                <div class="cart-info">
                    <h4>${item.nome}</h4>
                    <small>R$ ${item.preco.toFixed(2)} cada</small>
                </div>
                <div class="qty-controls">
                    <button type="button" onclick="alterarQuantidade(${item.id}, -1)">−</button>
                    <span>${item.quantidade}</span>
                    <button type="button" onclick="alterarQuantidade(${item.id}, 1)">+</button>
                    <button type="button" class="remove-item" aria-label="Excluir item"
                        onclick="removerItem(${item.id})">Excluir</button>
                </div>
                <strong>R$ ${valor.toFixed(2)}</strong>
            </div>
        `;
    }).join("");

    subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
}

document.getElementById("clearCart")?.addEventListener("click", () => {
    carrinho = [];
    renderizarCarrinho();
});

document.querySelectorAll(".payment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".payment-btn").forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        formaPagamento = btn.dataset.payment;
    });
});

const searchInput = document.getElementById("searchInput");
const categoriaFilter = document.getElementById("categoriaFilter");
searchInput?.addEventListener("input", filtrarProdutos);
categoriaFilter?.addEventListener("change", filtrarProdutos);

function filtrarProdutos() {
    const busca = (searchInput?.value || "").toLowerCase();
    const categoria = categoriaFilter?.value || "";
    document.querySelectorAll(".product-card").forEach((card) => {
        const nomeOk = (card.dataset.nome || "").includes(busca);
        const categoriaOk = !categoria || card.dataset.categoria === categoria;
        card.style.display = nomeOk && categoriaOk ? "" : "none";
    });
}

document.getElementById("finalizarVenda")?.addEventListener("click", finalizarVenda);

async function finalizarVenda() {
    if (!carrinho.length) {
        mostrarMensagem("Adicione pelo menos um produto ao carrinho.", "error");
        return;
    }

    if (!formaPagamento) {
        mostrarMensagem("Selecione a forma de pagamento.", "error");
        return;
    }

    const button = document.getElementById("finalizarVenda");
    button.disabled = true;

    try {
        const response = await fetch("/vendas/finalizar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
                itens: carrinho.map((item) => ({
                    produto_id: item.id,
                    quantidade: item.quantidade,
                })),
                forma_pagamento: formaPagamento,
                cliente: document.getElementById("customerName")?.value.trim() || null,
            }),
        });

        const dados = await response.json();
        if (!response.ok) {
            throw new Error(dados.detail || "Não foi possível finalizar a venda.");
        }

        carrinho = [];
        formaPagamento = null;
        document.querySelectorAll(".payment-btn").forEach((item) => item.classList.remove("active"));
        document.getElementById("customerName").value = "";
        renderizarCarrinho();
        mostrarMensagem(`Venda #${dados.venda_id} realizada com sucesso!`, "success");
    } catch (erro) {
        mostrarMensagem(erro.message || "Erro ao finalizar a venda.", "error");
    } finally {
        button.disabled = false;
    }
}

function mostrarMensagem(texto, tipo) {
    const toast = document.getElementById("purchaseMessage");
    if (!toast) {
        alert(texto);
        return;
    }
    toast.textContent = texto;
    toast.className = `purchase-message ${tipo} visible`;
    window.setTimeout(() => toast.classList.remove("visible"), 4000);
}

window.addEventListener("load", renderizarCarrinho);