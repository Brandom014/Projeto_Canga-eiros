// ======================
// ESTADO GLOBAL & GRÁFICO
// ======================
let meuGrafico = null; // Guarda a instância do Chart.js para destruí-la antes de redesenhar

// ======================
// INICIALIZAÇÃO
// ======================
document.addEventListener("DOMContentLoaded", () => {
    carregarRelatorio();
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("collapsed");
    }
}

// ======================
// CARREGAR RELATÓRIO
// ======================
async function carregarRelatorio() {
    try {
        const response = await fetch("/api/relatorio", {
            credentials: "same-origin",
        });

        if (!response.ok) throw new Error("Erro ao buscar relatório");

        const dados = await response.json();

        atualizarCards(dados);
        atualizarTabela(dados.vendas);
        atualizarGrafico(dados.grafico_pagamento); // Espera um objeto { PIX: 10, Credito: 5, ... }

    } catch (erro) {
        console.error(erro);
        const tbody = document.getElementById("tabela-vendas");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; color: #ef4444;">
                        Erro ao carregar vendas. Tente novamente mais tarde.
                    </td>
                </tr>
            `;
        }
    }
}

// ======================
// CARDS (Com Intl.NumberFormat)
// ======================
function atualizarCards(dados = {}) {
    const formatadorBRL = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

    document.getElementById("faturamento").textContent = formatadorBRL.format(dados.faturamento || 0);
    document.getElementById("total-vendas").textContent = dados.total_vendas || 0;
    document.getElementById("ticket-medio").textContent = formatadorBRL.format(dados.ticket_medio || 0);
    document.getElementById("produtos-vendidos").textContent = dados.produtos_vendidos || 0;
}

// ======================
// TABELA (Proteção contra XSS e Otimizada)
// ======================
function atualizarTabela(vendas) {
    const tbody = document.getElementById("tabela-vendas");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!vendas || vendas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Nenhuma venda encontrada
                </td>
            </tr>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();
    const formatadorBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

    vendas.forEach(venda => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>#${sanitizarTexto(venda.id)}</td>
            <td>${formatarData(venda.data)}</td>
            <td>${sanitizarTexto(venda.cliente || "-")}</td>
            <td>${sanitizarTexto(venda.usuario || "-")}</td>
            <td>${Number(venda.itens || 0)}</td>
            <td>
                <span class="badge ${classePagamento(venda.pagamento)}">
                    ${sanitizarTexto(venda.pagamento || "-")}
                </span>
            </td>
            <td>${formatadorBRL.format(venda.total || 0)}</td>
        `;

        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment); // Insere tudo de uma vez no DOM
}

// ======================
// GRÁFICO (Chart.js)
// ======================
function atualizarGrafico(dadosGrafico) {
    const canvas = document.getElementById("graficoPagamento");
    if (!canvas || typeof Chart === "undefined") return;

    // Destrói o gráfico anterior antes de criar outro para evitar sobreposição
    if (meuGrafico) {
        meuGrafico.destroy();
    }

    // Valores padrão caso a API não envie dados ainda
    const valores = dadosGrafico || { PIX: 0, Credito: 0, Debito: 0, Dinheiro: 0 };

    meuGrafico = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["PIX", "Crédito", "Débito", "Dinheiro"],
            datasets: [{
                data: [
                    valores.PIX || 0,
                    valores.Credito || 0,
                    valores.Debito || 0,
                    valores.Dinheiro || 0
                ],
                backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Usa a legenda customizada em HTML
            }
        }
    });
}

// ======================
// FILTROS DE BUSCA
// ======================
async function filtrarRelatorio() {
    const busca = document.getElementById("busca").value.trim();
    const data = document.getElementById("data").value;
    const pagamento = document.getElementById("pagamento").value;

    try {
        const params = new URLSearchParams();
        if (busca) params.append("busca", busca);
        if (data) params.append("data", data);
        if (pagamento) params.append("pagamento", pagamento);

        const response = await fetch(`/api/relatorio?${params.toString()}`, {
            credentials: "same-origin",
        });

        if (!response.ok) throw new Error("Erro ao filtrar relatório");

        const dados = await response.json();

        atualizarCards(dados);
        atualizarTabela(dados.vendas);
        atualizarGrafico(dados.grafico_pagamento);

    } catch (erro) {
        console.error(erro);
    }
}

function limparFiltros() {
    document.getElementById("busca").value = "";
    document.getElementById("data").value = "";
    document.getElementById("pagamento").value = "";

    carregarRelatorio();
}

// ======================
// EXPORTAÇÃO
// ======================
function exportarRelatorio() {
    const busca = document.getElementById("busca").value.trim();
    const data = document.getElementById("data").value;
    const pagamento = document.getElementById("pagamento").value;

    const params = new URLSearchParams();
    if (busca) params.append("busca", busca);
    if (data) params.append("data", data);
    if (pagamento) params.append("pagamento", pagamento);

    window.open(`/api/relatorio/exportar?${params.toString()}`, "_blank");
}

// ======================
// FUNÇÕES UTILITÁRIAS
// ======================
function sanitizarTexto(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}

function classePagamento(pagamento) {
    if (!pagamento) return "";
    const p = pagamento.toLowerCase();

    if (p.includes("pix")) return "pix";
    if (p.includes("credito") || p.includes("crédito")) return "credito";
    if (p.includes("debito") || p.includes("débito")) return "debito";
    if (p.includes("dinheiro")) return "dinheiro";

    return "";
}

function formatarData(dataString) {
    if (!dataString) return "-";

    // Tratamento simples para evitar bugs de fuso horário em strings YYYY-MM-DD
    const partes = dataString.split("T");
    const dataApenas = partes[0].split("-");

    if (dataApenas.length === 3) {
        const [ano, mes, dia] = dataApenas;
        if (partes[1]) {
            const hora = partes[1].substring(0, 5);
            return `${dia}/${mes}/${ano} ${hora}`;
        }
        return `${dia}/${mes}/${ano}`;
    }

    return dataString;
}