/* =========================================================
   CONTROLE DE SIDEBAR
========================================================= */
function toggleSidebar() {
    document.getElementById("sidebar")?.classList.toggle("collapsed");
}

/* =========================================================
   ESTADO GLOBAL DO CARRINHO E PAGAMENTO
========================================================= */
let carrinho = [];
let formaPagamento = null;

/* =========================================================
   ADICIONAR PRODUTOS AO CARRINHO
========================================================= */
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

/* =========================================================
   ALTERAR E REMOVER ITENS DO CARRINHO
========================================================= */
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

/* =========================================================
   RENDERIZAÇÃO DO CARRINHO
========================================================= */
function renderizarCarrinho() {
    const container = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = '<div class="empty-cart">Nenhum produto adicionado</div>';
        if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
        if (totalEl) totalEl.textContent = "R$ 0,00";
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

    if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
}

// Limpar todo o carrinho
document.getElementById("clearCart")?.addEventListener("click", () => {
    carrinho = [];
    renderizarCarrinho();
});

/* =========================================================
   SELEÇÃO DE FORMA DE PAGAMENTO
========================================================= */
document.querySelectorAll(".payment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".payment-btn").forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        formaPagamento = btn.dataset.payment;
    });
});

/* =========================================================
   FILTROS DE PRODUTO
========================================================= */
const searchInput = document.getElementById("searchInput");
const categoriaFilter = document.getElementById("categoriaFilter");
searchInput?.addEventListener("input", filtrarProdutos);
categoriaFilter?.addEventListener("change", filtrarProdutos);

function filtrarProdutos() {
    const busca = (searchInput?.value || "").toLowerCase();
    const categoria = categoriaFilter?.value || "";
    document.querySelectorAll(".product-card").forEach((card) => {
        const nomeOk = (card.dataset.nome || "").toLowerCase().includes(busca);
        const categoriaOk = !categoria || card.dataset.categoria === categoria;
        card.style.display = nomeOk && categoriaOk ? "" : "none";
    });
}

/* =========================================================
   FINALIZAR VENDA (INTEGRADO AO RELATÓRIO)
========================================================= */
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

    // Normalização da Forma de Pagamento para casar com os Filtros do Relatório
    const mapaPagamentos = {
        'pix': 'PIX',
        'credito': 'Credito',
        'crédito': 'Credito',
        'debito': 'Debito',
        'débito': 'Debito',
        'dinheiro': 'Dinheiro'
    };
    const pagamentoNormalizado = mapaPagamentos[formaPagamento.toLowerCase()] || formaPagamento;

    // Métricas calculadas antes de limpar o carrinho
    const totalCalculado = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const qtdTotalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const clienteNome = document.getElementById("customerName")?.value.trim() || "Cliente Avulso";
    
    let vendaId = Date.now(); // ID fallback

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
                forma_pagamento: pagamentoNormalizado,
                cliente: clienteNome,
            }),
        });

        if (response.ok) {
            const dados = await response.json();
            if (dados.venda_id) {
                vendaId = dados.venda_id;
            }
        }
    } catch (erro) {
        console.warn("Servidor inativo. Salvando registro localmente...", erro);
    }

    // MONTAGEM DO OBJETO DA VENDA PARA O RELATÓRIO
    const novaVenda = {
        id: vendaId,
        data: new Date().toISOString(),
        cliente: clienteNome,
        usuario: "Caixa",
        pagamento: pagamentoNormalizado,
        status: "Concluída",
        total: totalCalculado,
        qtdItens: qtdTotalItens,
        itens: carrinho.map(item => ({
            id: item.id,
            nome: item.nome,
            qtd: item.quantidade,
            quantidade: item.quantidade,
            preco: item.preco
        }))
    };

    // GRAVAÇÃO NO LOCALSTORAGE
    const vendasExistentes = JSON.parse(localStorage.getItem('vendas')) || [];
    vendasExistentes.unshift(novaVenda);
    localStorage.setItem('vendas', JSON.stringify(vendasExistentes));

    // LIMPEZA DA INTERFACE
    carrinho = [];
    formaPagamento = null;
    document.querySelectorAll(".payment-btn").forEach((item) => item.classList.remove("active"));
    
    const inputCliente = document.getElementById("customerName");
    if (inputCliente) inputCliente.value = "";

    renderizarCarrinho();
    mostrarMensagem(`Venda #${vendaId} realizada com sucesso!`, "success");
    button.disabled = false;
}

/* =========================================================
   MENSAGENS FEEDBACK (TOAST)
========================================================= */
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