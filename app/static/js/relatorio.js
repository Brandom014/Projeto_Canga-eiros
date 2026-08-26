function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

// ======================
// CARREGAR RELATÓRIO
// ======================

document.addEventListener("DOMContentLoaded", () => {
    carregarRelatorio();
});

async function carregarRelatorio() {

    try {

        const response = await fetch("/api/relatorio", {
            credentials: "same-origin",
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar relatório");
        }

        const dados = await response.json();

        atualizarCards(dados);
        atualizarTabela(dados.vendas);

    } catch (erro) {

        console.error(erro);

        document.getElementById("tabela-vendas").innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Erro ao carregar vendas
                </td>
            </tr>
        `;
    }
}

// ======================
// CARDS
// ======================

function atualizarCards(dados) {

    document.getElementById("faturamento").textContent =
        `R$ ${Number(dados.faturamento || 0).toFixed(2)}`;

    document.getElementById("total-vendas").textContent =
        dados.total_vendas || 0;

    document.getElementById("ticket-medio").textContent =
        `R$ ${Number(dados.ticket_medio || 0).toFixed(2)}`;

    document.getElementById("produtos-vendidos").textContent =
        dados.produtos_vendidos || 0;
}

// ======================
// TABELA
// ======================

function atualizarTabela(vendas) {

    const tbody = document.getElementById("tabela-vendas");

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

    vendas.forEach(venda => {

        tbody.innerHTML += `
            <tr>
                <td>#${venda.id}</td>
                <td>${formatarData(venda.data)}</td>
                <td>${venda.cliente || "-"}</td>
                <td>${venda.usuario || "-"}</td>
                <td>${venda.itens || 0}</td>
                <td>
                    <span class="badge ${classePagamento(venda.pagamento)}">
                        ${venda.pagamento}
                    </span>
                </td>
                <td>
                    R$ ${Number(venda.total).toFixed(2)}
                </td>
            </tr>
        `;
    });
}

// ======================
// FILTROS
// ======================

async function filtrarRelatorio() {

    const busca = document.getElementById("busca").value;
    const data = document.getElementById("data").value;
    const pagamento = document.getElementById("pagamento").value;

    try {

        const params = new URLSearchParams({ busca, data, pagamento });
        const response = await fetch(`/api/relatorio?${params}`, {
            credentials: "same-origin",
        });

        const dados = await response.json();

        atualizarCards(dados);
        atualizarTabela(dados.vendas);

    } catch (erro) {
        console.error(erro);
    }
}

// ======================
// LIMPAR FILTROS
// ======================

function limparFiltros() {

    document.getElementById("busca").value = "";
    document.getElementById("data").value = "";
    document.getElementById("pagamento").value = "";

    carregarRelatorio();
}

// ======================
// EXPORTAR
// ======================

function exportarRelatorio() {

    window.open(
        "/api/relatorio/exportar",
        "_blank"
    );
}

// ======================
// UTILITÁRIOS
// ======================

function classePagamento(pagamento) {

    if (!pagamento) return "";

    pagamento = pagamento.toLowerCase();

    if (pagamento.includes("pix")) return "pix";
    if (pagamento.includes("credito")) return "credito";
    if (pagamento.includes("crédito")) return "credito";
    if (pagamento.includes("debito")) return "debito";
    if (pagamento.includes("débito")) return "debito";
    if (pagamento.includes("dinheiro")) return "dinheiro";

    return "";
}

function formatarData(data) {

    if (!data) return "-";

    try {

        const d = new Date(data);
        return d.toLocaleString("pt-BR");

    } catch {

        return data;
    }
}