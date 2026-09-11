let carrinho = JSON.parse(localStorage.getItem("carrinho_pdv")) || [];
let formaPagamento = "Dinheiro";
let totalPagar = 0;

document.addEventListener("DOMContentLoaded", () => {
    if (!carrinho.length) {
        alert("Nenhum produto selecionado. Voltando ao PDV...");
        voltarParaVendas();
        return;
    }

    carregarResumo();
});

function carregarResumo() {
    const container = document.getElementById("resumoItensContainer");
    totalPagar = 0;

    container.innerHTML = carrinho.map((item) => {
        const subtotal = item.preco * item.quantidade;
        totalPagar += subtotal;
        return `
            <div class="summary-item-row">
                <span><strong>${item.quantidade}x</strong> ${item.nome}</span>
                <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
        `;
    }).join("");

    document.getElementById("totalPagarDisplay").textContent = `R$ ${totalPagar.toFixed(2).replace('.', ',')}`;
}

function selecionarForma(metodo, el) {
    formaPagamento = metodo;

    document.querySelectorAll(".payment-tile").forEach(tile => tile.classList.remove("active"));
    if (el) el.classList.add("active");

    const painelDinheiro = document.getElementById("painel-dinheiro");
    if (painelDinheiro) {
        painelDinheiro.style.display = metodo === "Dinheiro" ? "block" : "none";
    }
}

function calcularTroco() {
    const inputRecebido = document.getElementById("valorRecebido");
    const trocoDisplay = document.getElementById("valorTroco");
    if (!inputRecebido || !trocoDisplay) return;

    const valorRecebido = parseFloat(inputRecebido.value) || 0;
    const troco = valorRecebido - totalPagar;

    if (troco < 0) {
        trocoDisplay.innerText = "R$ 0,00";
        trocoDisplay.style.color = "#64748b";
    } else {
        trocoDisplay.innerText = `R$ ${troco.toFixed(2).replace('.', ',')}`;
        trocoDisplay.style.color = "#16a34a";
    }
}

function voltarParaVendas() {
    window.location.href = "/vendas"; // ou "vendas.html"
}

async function concluirPagamento() {
    const btn = document.getElementById("btnConfirmarPagamento");
    if (btn) btn.disabled = true;

    const mapaPagamentos = {
        'pix': 'PIX',
        'credito': 'Credito',
        'debito': 'Debito',
        'dinheiro': 'Dinheiro'
    };
    const pagamentoNormalizado = mapaPagamentos[formaPagamento.toLowerCase()] || formaPagamento;
    const clienteNome = document.getElementById("customerName")?.value.trim() || "Cliente Avulso";
    const qtdTotalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

    let vendaId = Date.now();

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
            if (dados.venda_id) vendaId = dados.venda_id;
        }
    } catch (erro) {
        console.warn("Servidor offline. Gravando localmente no navegador...", erro);
    }

    // Registro da venda no LocalStorage
    const novaVenda = {
        id: vendaId,
        data: new Date().toISOString(),
        cliente: clienteNome,
        usuario: "Caixa",
        pagamento: pagamentoNormalizado,
        status: "Concluída",
        total: totalPagar,
        qtdItens: qtdTotalItens,
        itens: carrinho
    };

    const vendasExistentes = JSON.parse(localStorage.getItem('vendas')) || [];
    vendasExistentes.unshift(novaVenda);
    localStorage.setItem('vendas', JSON.stringify(vendasExistentes));

    // Limpa o carrinho
    localStorage.removeItem("carrinho_pdv");

    alert(`Venda #${vendaId} concluída com sucesso!`);
    window.location.href = "/relatorio"; // ou "/vendas"
}