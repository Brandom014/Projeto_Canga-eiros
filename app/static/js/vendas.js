/* =========================================================
   CONTROLE DE SIDEBAR
========================================================= */
function toggleSidebar() {
    document.getElementById("sidebar")?.classList.toggle("collapsed");
}

/* =========================================================
   ESTADO GLOBAL DO CARRINHO E PAGINAÇÃO
========================================================= */
let carrinho = JSON.parse(localStorage.getItem("carrinho_pdv")) || [];
let paginaAtual = 1;
const itensPorPagina = 10; // Configurado para 14 produtos visíveis por tela

document.addEventListener("DOMContentLoaded", () => {
    renderizarCarrinho();
    configurarEventos();
    aplicarPaginacaoEFiltros(); // Inicializa a paginação e filtros
});

function configurarEventos() {
    // Adicionar produto
    document.addEventListener("click", (e) => {
        const btnAdd = e.target.closest(".add-product");
        if (btnAdd) {
            const id = Number(btnAdd.dataset.id);
            const estoque = Number(btnAdd.dataset.estoque || 0);
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
                    nome: btnAdd.dataset.nome,
                    preco: Number(btnAdd.dataset.preco),
                    quantidade: 1,
                    estoque,
                    imagem: btnAdd.dataset.imagem || '/static/img/camisa.jpg'
                });
            }
            salvarERenderizar();
        }
    });

    // Limpar Carrinho
    document.getElementById("clearCart")?.addEventListener("click", () => {
        carrinho = [];
        salvarERenderizar();
    });

    // Filtros com reset da página para 1
    document.getElementById("searchInput")?.addEventListener("input", () => {
        paginaAtual = 1;
        aplicarPaginacaoEFiltros();
    });

    document.getElementById("categoriaFilter")?.addEventListener("change", () => {
        paginaAtual = 1;
        aplicarPaginacaoEFiltros();
    });
}

/* =========================================================
   LÓGICA DE PAGINAÇÃO E FILTRAGEM
========================================================= */
function aplicarPaginacaoEFiltros() {
    const busca = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const categoria = document.getElementById("categoriaFilter")?.value || "";

    const todosCards = Array.from(document.querySelectorAll(".product-card"));

    // 1. Filtra os cards que atendem à pesquisa e à categoria
    const cardsFiltrados = todosCards.filter((card) => {
        const nomeOk = (card.dataset.nome || "").toLowerCase().includes(busca);
        const categoriaOk = !categoria || card.dataset.categoria === categoria;
        return nomeOk && categoriaOk;
    });

    // Oculta todos os cards
    todosCards.forEach((card) => {
        card.style.display = "none";
    });

    // 2. Calcula total de páginas
    const totalPaginas = Math.ceil(cardsFiltrados.length / itensPorPagina) || 1;
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    // 3. Exibe apenas os cards do intervalo da página atual
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const cardsDaPagina = cardsFiltrados.slice(inicio, fim);

    cardsDaPagina.forEach((card) => {
        card.style.display = ""; // Reseta para o estilo original
    });

    // 4. Renderiza os botões de paginação inteligente
    renderizarBotoesPaginacao(totalPaginas);
}

function renderizarBotoesPaginacao(totalPaginas) {
    const container = document.getElementById("paginationContainer");
    if (!container) return;

    if (totalPaginas <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `
        <button type="button" class="page-btn" ${paginaAtual === 1 ? 'disabled' : ''} onclick="mudarPagina(${paginaAtual - 1})">
            <i class="fa-solid fa-chevron-left"></i> Anterior
        </button>
    `;

    // Lógica para limitar a exibição de botões numéricos (máximo 5)
    const maxBotoes = 5;
    let inicio = Math.max(1, paginaAtual - Math.floor(maxBotoes / 2));
    let fim = Math.min(totalPaginas, inicio + maxBotoes - 1);

    if (fim - inicio + 1 < maxBotoes) {
        inicio = Math.max(1, fim - maxBotoes + 1);
    }

    // Primeira página + reticências
    if (inicio > 1) {
        html += `<button type="button" class="page-btn ${paginaAtual === 1 ? 'active' : ''}" onclick="mudarPagina(1)">1</button>`;
        if (inicio > 2) {
            html += `<span class="pagination-ellipsis" style="padding: 6px 10px; color: #64748b; font-weight: 700; user-select: none;">...</span>`;
        }
    }

    // Páginas intermediárias
    for (let i = inicio; i <= fim; i++) {
        html += `
            <button type="button" class="page-btn ${i === paginaAtual ? 'active' : ''}" onclick="mudarPagina(${i})">
                ${i}
            </button>
        `;
    }

    // Última página + reticências
    if (fim < totalPaginas) {
        if (fim < totalPaginas - 1) {
            html += `<span class="pagination-ellipsis" style="padding: 6px 10px; color: #64748b; font-weight: 700; user-select: none;">...</span>`;
        }
        html += `<button type="button" class="page-btn ${paginaAtual === totalPaginas ? 'active' : ''}" onclick="mudarPagina(${totalPaginas})">${totalPaginas}</button>`;
    }

    html += `
        <button type="button" class="page-btn" ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="mudarPagina(${paginaAtual + 1})">
            Próximo <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    aplicarPaginacaoEFiltros();
}

/* =========================================================
   GERENCIAMENTO DO CARRINHO
========================================================= */
function salvarERenderizar() {
    localStorage.setItem("carrinho_pdv", JSON.stringify(carrinho));
    renderizarCarrinho();
}

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
    salvarERenderizar();
}

function removerItem(id) {
    carrinho = carrinho.filter((item) => item.id !== id);
    salvarERenderizar();
}

function renderizarCarrinho() {
    const container = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-state" style="text-align: center; color: #94a3b8; padding: 20px 0;">
                <i class="fa-solid fa-cart-flatbed-suitcases" style="font-size: 2rem; margin-bottom: 8px;"></i>
                <p>Nenhum produto no carrinho</p>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
        if (totalEl) totalEl.textContent = "R$ 0,00";
        return;
    }

    let subtotal = 0;
    container.innerHTML = carrinho.map((item) => {
        const valor = item.preco * item.quantidade;
        subtotal += valor;
        
        const fotoUrl = item.imagem && item.imagem.trim() !== "" ? item.imagem : "/static/img/camisa.jpg";

        return `
            <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; gap: 8px;">
                <img src="${fotoUrl}" alt="${item.nome}" style="width: 42px; height: 42px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" onerror="this.src='/static/img/camisa.jpg'">
                
                <div class="cart-info" style="flex: 1;">
                    <h4 style="margin: 0; font-size: 0.9rem; line-height: 1.2;">${item.nome}</h4>
                    <small style="color: #64748b;">R$ ${item.preco.toFixed(2).replace('.', ',')} cada</small>
                </div>

                <div class="qty-controls" style="display: flex; align-items: center; gap: 6px;">
                    <button type="button" onclick="alterarQuantidade(${item.id}, -1)">−</button>
                    <span>${item.quantidade}</span>
                    <button type="button" onclick="alterarQuantidade(${item.id}, 1)">+</button>
                    <button type="button" class="remove-item" onclick="removerItem(${item.id})" style="border:none; background:none; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
                </div>

                <strong style="font-size: 0.95rem;">R$ ${valor.toFixed(2).replace('.', ',')}</strong>
            </div>
        `;
    }).join("");

    if (subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    if (totalEl) totalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

/* REDIRECIONA PARA A TELA DE PAGAMENTO */
function irParaPagamento() {
    if (!carrinho.length) {
        mostrarMensagem("Adicione pelo menos um produto ao carrinho antes de prosseguir.", "error");
        return;
    }

    const selectCliente = document.getElementById("clienteSelect") || 
                          document.getElementById("cliente") || 
                          document.getElementById("cliente_id");
    
    let nomeCliente = "Consumidor Final";

    if (selectCliente) {
        if (selectCliente.tagName === "SELECT" && selectCliente.selectedIndex >= 0) {
            const opcaoSelecionada = selectCliente.options[selectCliente.selectedIndex];
            if (opcaoSelecionada.value && opcaoSelecionada.value !== "") {
                nomeCliente = opcaoSelecionada.text.trim();
            }
        } else if (selectCliente.value && selectCliente.value.trim() !== "") {
            nomeCliente = selectCliente.value.trim();
        }
    }

    localStorage.setItem("carrinho_pdv", JSON.stringify(carrinho));
    localStorage.setItem("cliente_pdv", nomeCliente);

    window.location.href = "/pagamento";
}

/* =========================================================
   MENSAGENS E ALERTAS PROFISSIONAIS (SWEETALERT2)
========================================================= */

function mostrarMensagem(texto, tipo = "success") {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: tipo,
            title: texto,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        const toast = document.getElementById("purchaseMessage");
        if (!toast) {
            alert(texto);
            return;
        }
        toast.textContent = texto;
        toast.className = `purchase-message ${tipo} visible`;
        window.setTimeout(() => toast.classList.remove("visible"), 4000);
    }
}

function avisarDesconto(valorDesconto) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: 'Desconto Aplicado!',
            text: `Foi aplicado um desconto no valor total.`,
            icon: 'success',
            confirmButtonColor: '#16a34a',
            confirmButtonText: 'Continuar'
        });
    }
}

function avisarVendaFinalizada(total, valorPago, troco) {
    if (typeof Swal !== "undefined") {
        Swal.fire({
            title: '🎉 Venda Concluída com Sucesso!',
            html: `
                <div style="font-size: 1.05rem; text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; margin-top: 10px; border: 1px solid #e2e8f0;">
                    <p style="margin: 6px 0; color: #334155;"><strong>Total da Venda:</strong> R$ ${Number(total).toFixed(2).replace('.', ',')}</p>
                    <p style="margin: 6px 0; color: #334155;"><strong>Valor Recebido:</strong> R$ ${Number(valorPago).toFixed(2).replace('.', ',')}</p>
                    <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0;">
                    <p style="margin: 6px 0; font-size: 1.3rem; color: #16a34a;"><strong>Troco: R$ ${Number(troco).toFixed(2).replace('.', ',')}</strong></p>
                </div>
            `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-print"></i> Imprimir Comprovante',
            cancelButtonText: 'Nova Venda',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b'
        }).then(() => {
            localStorage.removeItem("carrinho_pdv");
            localStorage.removeItem("cliente_pdv");
            window.location.href = "/vendas";
        });
    } else {
        alert(`Venda Concluída! Total: R$ ${total} | Troco: R$ ${troco}`);
        localStorage.removeItem("carrinho_pdv");
        localStorage.removeItem("cliente_pdv");
        window.location.href = "/vendas";
    }
}