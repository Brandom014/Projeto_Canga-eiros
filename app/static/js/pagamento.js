/* =========================================================
   LÓGICA DA TELA DE PAGAMENTO (PDV) - CORRIGIDA
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    let carrinho = JSON.parse(localStorage.getItem("carrinho_pdv")) || [];
    
    let userStorage = JSON.parse(localStorage.getItem("usuario_logado")) || localStorage.getItem("usuario_logado") || "Admin";
    let nomeVendedor = typeof userStorage === "object" ? (userStorage.nome || userStorage.usuario || "Admin") : userStorage;

    let clienteSalvoPdv = localStorage.getItem("cliente_pdv");
    let nomeCliente = "Consumidor Final";
    let cpfCliente = "";
    let idCliente = null;

    if (clienteSalvoPdv) {
        try {
            const objCliente = JSON.parse(clienteSalvoPdv);
            if (typeof objCliente === "object" && objCliente !== null) {
                nomeCliente = objCliente.nome || "Consumidor Final";
                cpfCliente = objCliente.cpf || "";
                idCliente = objCliente.id || null;
            } else {
                nomeCliente = clienteSalvoPdv;
            }
        } catch (e) {
            nomeCliente = clienteSalvoPdv;
        }
    }

    let pagamentos = [];
    let valorDesconto = 0;

    const infoMetodos = {
        dinheiro: { nome: 'Dinheiro', icone: 'fa-money-bill-wave' },
        credito:  { nome: 'Crédito',  icone: 'fa-credit-card' },
        debito:   { nome: 'Débito',   icone: 'fa-regular fa-credit-card' },
        pix:      { nome: 'PIX',      icone: 'fa-brands fa-pix' }
    };

    const container = document.getElementById("listaProdutos");
    const badgeCount = document.getElementById("badgeCount");
    const subtotalEl = document.getElementById("subtotalValor");
    const descontoEl = document.getElementById("descontoValor");
    const linhaDesconto = document.getElementById("linhaDesconto");
    const totalEl = document.getElementById("totalValor");
    const btnDesconto = document.getElementById("btnDesconto");
    const btnConfirmar = document.getElementById("btnConfirmar");
    const containerPagamentos = document.getElementById("listaPagamentos");

    function formatarMoeda(valor) {
        return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function obterSubtotal() {
        return carrinho.reduce((acc, item) => acc + (Number(item.preco || 0) * Number(item.quantidade || 1)), 0);
    }

    function obterTotalFinal() {
        return Math.max(0, obterSubtotal() - valorDesconto);
    }

    // Adicionar forma de pagamento
    function adicionarFormaPagamento(tipo) {
        const totalVenda = obterTotalFinal();
        const totalPagoAtual = pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const restante = Math.max(0, totalVenda - totalPagoAtual);

        pagamentos.push({
            id: Date.now() + Math.random(),
            tipo: tipo,
            valor: restante
        });

        renderizarPagamentos();
        atualizarResumoPagamentos();
    }

    function removerPagamento(id) {
        pagamentos = pagamentos.filter(p => p.id !== id);
        renderizarPagamentos();
        atualizarResumoPagamentos();
    }

    function alterarValorPagamento(id, novoValor) {
        const pag = pagamentos.find(p => p.id === id);
        if (pag) {
            pag.valor = parseFloat(novoValor) || 0;
            atualizarResumoPagamentos();
        }
    }

    function renderizarPagamentos() {
        if (!containerPagamentos) return;
        containerPagamentos.innerHTML = "";

        pagamentos.forEach((p, index) => {
            const info = infoMetodos[p.tipo] || { nome: p.tipo, icone: 'fa-credit-card' };
            const card = document.createElement("div");
            card.className = "item-pagamento-card";

            card.innerHTML = `
                <div class="info-metodo">
                    <i class="fa-solid ${info.icone}"></i>
                    <span>${info.nome} #${index + 1}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div class="input-prefix">
                        <span>R$</span>
                        <input type="number" step="0.01" min="0" value="${p.valor.toFixed(2)}" 
                               data-id="${p.id}" class="input-valor-pagamento">
                    </div>
                    ${pagamentos.length > 1 ? `
                        <button type="button" class="btn-remover-pagamento" data-id="${p.id}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            `;
            containerPagamentos.appendChild(card);
        });

        // Eventos nos inputs e botões
        containerPagamentos.querySelectorAll(".input-valor-pagamento").forEach(input => {
            input.addEventListener("input", (e) => {
                const id = parseFloat(e.target.getAttribute("data-id"));
                alterarValorPagamento(id, e.target.value);
            });
        });

        containerPagamentos.querySelectorAll(".btn-remover-pagamento").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const id = parseFloat(btn.getAttribute("data-id"));
                removerPagamento(id);
            });
        });
    }

    function atualizarResumoPagamentos() {
        const totalVenda = obterTotalFinal();
        const totalPago = pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const restante = totalVenda - totalPago;

        const temDinheiro = pagamentos.some(p => p.tipo === 'dinheiro');
        const troco = (temDinheiro && restante < -0.01) ? Math.abs(restante) : 0;

        const elTotalPago = document.getElementById("totalPago");
        const elRestante = document.getElementById("valorRestante");
        const boxTroco = document.getElementById("boxTroco");
        const elTroco = document.getElementById("valorTroco");

        if (elTotalPago) elTotalPago.innerText = formatarMoeda(totalPago);

        if (restante > 0.009) {
            if (elRestante) elRestante.innerText = formatarMoeda(restante);
            if (boxTroco) boxTroco.style.display = "none";
            if (btnConfirmar) btnConfirmar.disabled = true;
        } else {
            if (elRestante) elRestante.innerText = formatarMoeda(0);
            if (troco > 0) {
                if (boxTroco) boxTroco.style.display = "flex";
                if (elTroco) elTroco.innerText = formatarMoeda(troco);
            } else {
                if (boxTroco) boxTroco.style.display = "none";
            }
            if (btnConfirmar) btnConfirmar.disabled = false;
        }
    }

    function renderizarResumo() {
        if (!container) return;

        if (!carrinho || carrinho.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #94a3b8; padding: 40px 10px;">
                    <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; margin-bottom: 12px;"></i>
                    <p style="font-weight: 500;">Nenhum produto selecionado.</p>
                </div>
            `;
            if (badgeCount) badgeCount.textContent = "0 itens";
            if (subtotalEl) subtotalEl.textContent = "R$ 0,00";
            if (totalEl) totalEl.textContent = "R$ 0,00";
            if (linhaDesconto) linhaDesconto.style.display = "none";
            return;
        }

        let totalSubtotal = 0;
        let totalItens = 0;
        let htmlItens = "";

        carrinho.forEach(item => {
            const preco = Number(item.preco) || 0;
            const qtd = Number(item.quantidade) || 1;
            const subtotalItem = preco * qtd;

            totalSubtotal += subtotalItem;
            totalItens += qtd;

            const imagemUrl = item.imagem || '/static/img/camisa.jpg';

            htmlItens += `
                <div class="produto-item">
                    <div class="produto-info">
                        <img src="${imagemUrl}" alt="${item.nome}" class="produto-img">
                        <div class="produto-detalhes">
                            <span class="produto-nome">${item.nome}</span>
                            <span class="produto-qtd">${qtd}x Unidade${qtd > 1 ? 's' : ''} (${formatarMoeda(preco)} cada)</span>
                        </div>
                    </div>
                    <span class="produto-preco">${formatarMoeda(subtotalItem)}</span>
                </div>
            `;
        });

        container.innerHTML = htmlItens;

        const totalFinal = obterTotalFinal();

        if (badgeCount) badgeCount.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
        if (subtotalEl) subtotalEl.textContent = formatarMoeda(totalSubtotal);
        if (totalEl) totalEl.textContent = formatarMoeda(totalFinal);

        if (valorDesconto > 0 && linhaDesconto && descontoEl) {
            linhaDesconto.style.display = "flex";
            descontoEl.textContent = `- ${formatarMoeda(valorDesconto)}`;
        } else if (linhaDesconto) {
            linhaDesconto.style.display = "none";
        }
    }

    // Eventos nos botões de adicionar pagamento
    document.getElementById("btnAddDinheiro")?.addEventListener("click", () => adicionarFormaPagamento('dinheiro'));
    document.getElementById("btnAddCredito")?.addEventListener("click", () => adicionarFormaPagamento('credito'));
    document.getElementById("btnAddDebito")?.addEventListener("click", () => adicionarFormaPagamento('debito'));
    document.getElementById("btnAddPix")?.addEventListener("click", () => adicionarFormaPagamento('pix'));

    // ORDEM DE EXECUÇÃO CORRETA:
    renderizarResumo();                // 1. Renderiza o resumo do carrinho e define o Total
    adicionarFormaPagamento('dinheiro'); // 2. Lança a primeira forma preenchendo o valor total real
});