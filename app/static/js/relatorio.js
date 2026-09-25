let relatorioVendas = [];
let vendasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 4;

document.addEventListener('DOMContentLoaded', () => {
    configurarFiltrosAutomaticos();
    carregarVendas();
});

function configurarFiltrosAutomaticos() {
    const busca = document.getElementById('busca');
    const dataInicio = document.getElementById('data_inicio');
    const dataFim = document.getElementById('data_fim');
    const pagamento = document.getElementById('pagamento');

    if (busca) busca.addEventListener('input', aplicarFiltros);
    if (dataInicio) dataInicio.addEventListener('change', aplicarFiltros);
    if (dataFim) dataFim.addEventListener('change', aplicarFiltros);
    if (pagamento) pagamento.addEventListener('change', aplicarFiltros);
}

async function carregarVendas() {
    let apiVendas = [];

    try {
        const response = await fetch('/api/relatorio/');
        if (response.ok) {
            const dados = await response.json();
            if (dados && Array.isArray(dados.vendas)) {
                apiVendas = dados.vendas;
            } else if (Array.isArray(dados)) {
                apiVendas = dados;
            }
        } else {
            console.warn("API de relatório retornou status:", response.status);
        }
    } catch (error) {
        console.error("Erro ao conectar com a API de relatórios:", error);
    }

    if (apiVendas.length > 0) {
        relatorioVendas = apiVendas;
    } else {
        const localData = localStorage.getItem('vendas');
        const localVendas = localData ? JSON.parse(localData) : [];
        relatorioVendas = localVendas;
    }

    aplicarFiltros();
}

function aplicarFiltros() {
    const busca = (document.getElementById('busca')?.value || '').toLowerCase().trim();
    const dataInicio = document.getElementById('data_inicio')?.value;
    const dataFim = document.getElementById('data_fim')?.value;
    const pagamento = (document.getElementById('pagamento')?.value || '').toLowerCase().trim();

    vendasFiltradas = relatorioVendas.filter(venda => {
        const clienteNome = (venda.cliente || '').toLowerCase();
        const usuarioNome = (venda.usuario || '').toLowerCase();
        const idStr = venda.id ? venda.id.toString().toLowerCase() : '';

        const matchBusca = !busca || 
            idStr.includes(busca) || 
            clienteNome.includes(busca) ||
            usuarioNome.includes(busca);

        const pagVenda = (venda.pagamento || venda.forma_pagamento || '').toLowerCase().trim();
        const matchPagamento = !pagamento || pagVenda === pagamento;

        let matchData = true;
        let dataVenda = '';
        if (venda.data) {
            if (venda.data.includes('T')) {
                dataVenda = venda.data.split('T')[0];
            } else if (venda.data.includes('/')) {
                const p = venda.data.split(' ')[0].split('/');
                if (p.length === 3) dataVenda = `${p[2]}-${p[1]}-${p[0]}`;
            } else {
                dataVenda = venda.data.split(' ')[0];
            }
        }

        if (dataInicio && dataVenda && dataVenda < dataInicio) matchData = false;
        if (dataFim && dataVenda && dataVenda > dataFim) matchData = false;

        return matchBusca && matchPagamento && matchData;
    });

    paginaAtual = 1;
    atualizarCards();
    renderizarTabela();
}

function renderizarTabela() {
    const tbody = document.getElementById('tabela-vendas');
    const badgeCount = document.getElementById('vendas-count-badge');
    
    if (badgeCount) badgeCount.innerText = `${vendasFiltradas.length} vendas`;
    if (!tbody) return;

    tbody.innerHTML = '';

    if (vendasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #64748b;">Nenhuma venda encontrada.</td></tr>`;
        atualizarPaginacao();
        return;
    }

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const paginaVendas = vendasFiltradas.slice(inicio, fim);

    paginaVendas.forEach(venda => {
        const tr = document.createElement('tr');
        const isCancelada = venda.status === 'Cancelada';
        const badgeClass = isCancelada ? 'badge-danger' : 'badge-success';
        const statusTexto = venda.status || 'Concluída';

        let totalQtdItens = 1;
        if (typeof venda.itens === 'number') {
            totalQtdItens = venda.itens;
        } else if (Array.isArray(venda.itens)) {
            totalQtdItens = venda.itens.length;
        } else if (venda.qtdItens) {
            totalQtdItens = venda.qtdItens;
        }

        tr.innerHTML = `
            <td>#${venda.id}</td>
            <td>${formatarData(venda.data)}</td>
            <td>${venda.cliente || 'Consumidor Final'}</td>
            <td>${venda.usuario || 'Sistema'}</td>
            <td>${totalQtdItens} item(ns)</td>
            <td>${(venda.pagamento || venda.forma_pagamento || 'N/I').toUpperCase()}</td>
            <td><span class="badge ${badgeClass}">${statusTexto}</span></td>
            <td><strong>${formatarMoeda(venda.total)}</strong></td>
            <td style="text-align: center;">
                <button class="btn-icon" onclick="abrirModalDetalhes(${venda.id})" title="Ver Detalhes">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    atualizarPaginacao();
}

function atualizarPaginacao() {
    const totalItens = vendasFiltradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const infoSpan = document.getElementById('pagination-info');
    const pageSpan = document.getElementById('page-num');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (infoSpan) {
        if (totalItens === 0) {
            infoSpan.innerText = 'Mostrando 0 de 0 vendas';
        } else {
            const inicioIndex = (paginaAtual - 1) * itensPorPagina + 1;
            const fimIndex = Math.min(paginaAtual * itensPorPagina, totalItens);
            infoSpan.innerText = `Mostrando ${inicioIndex} até ${fimIndex} de ${totalItens} vendas`;
        }
    }

    if (pageSpan) pageSpan.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    if (btnPrev) btnPrev.disabled = (paginaAtual <= 1);
    if (btnNext) btnNext.disabled = (paginaAtual >= totalPaginas);
}

function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(vendasFiltradas.length / itensPorPagina) || 1;
    const novaPagina = paginaAtual + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarTabela();
    }
}

function atualizarCards() {
    const vendasValidas = vendasFiltradas.filter(v => v.status !== 'Cancelada');
    
    const faturamento = vendasValidas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalVendas = vendasValidas.length;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
    
    const totalProdutos = vendasValidas.reduce((acc, v) => {
        if (typeof v.itens === 'number') return acc + v.itens;
        if (Array.isArray(v.itens)) return acc + v.itens.length;
        return acc + (v.qtdItens || 1);
    }, 0);

    const elFaturamento = document.getElementById('faturamento');
    const elTotalVendas = document.getElementById('total-vendas');
    const elTicketMedio = document.getElementById('ticket-medio');
    const elProdutosVendidos = document.getElementById('produtos-vendidos');

    if (elFaturamento) elFaturamento.innerText = formatarMoeda(faturamento);
    if (elTotalVendas) elTotalVendas.innerText = totalVendas;
    if (elTicketMedio) elTicketMedio.innerText = formatarMoeda(ticketMedio);
    if (elProdutosVendidos) elProdutosVendidos.innerText = totalProdutos;
}

function limparFiltros() {
    if (document.getElementById('busca')) document.getElementById('busca').value = '';
    if (document.getElementById('data_inicio')) document.getElementById('data_inicio').value = '';
    if (document.getElementById('data_fim')) document.getElementById('data_fim').value = '';
    if (document.getElementById('pagamento')) document.getElementById('pagamento').value = '';
    aplicarFiltros();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

/* =========================================================
   DETALHES DA VENDA (COM SUPORTE A ITENS E DESCONTO)
========================================================= */
async function abrirModalDetalhes(vendaId) {
    const venda = relatorioVendas.find(v => v.id == vendaId);
    if (!venda) return;

    // 1. Preenche informações básicas da cabeçalho do modal
    document.getElementById('modal-venda-id').innerText = venda.id;
    document.getElementById('modal-venda-data').innerText = formatarData(venda.data);
    document.getElementById('modal-cliente-nome').innerText = venda.cliente || 'Consumidor Final';
    document.getElementById('modal-pagamento').innerText = (venda.pagamento || venda.forma_pagamento || 'N/I').toUpperCase();

    const tbody = document.getElementById('modal-itens-body');
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 16px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando detalhes da venda...</td></tr>`;

    document.getElementById('modalDetalhesVenda').style.display = 'flex';

    let itens = venda.itensDetalhes || (Array.isArray(venda.itens) ? venda.itens : null);
    let subtotalBruto = venda.subtotal || venda.total || 0;
    let desconto = venda.desconto || 0;
    let totalLiquido = venda.total || 0;

    // 2. Busca detalhes completos na API do backend
    try {
        let response = await fetch(`/vendas/api/detalhes/${vendaId}`);
        if (!response.ok) {
            response = await fetch(`/api/relatorio/${vendaId}`);
        }

        if (response.ok) {
            const dados = await response.json();
            itens = dados.itens || dados.itensDetalhes || [];
            subtotalBruto = dados.subtotal !== undefined ? dados.subtotal : subtotalBruto;
            desconto = dados.desconto !== undefined ? dados.desconto : desconto;
            totalLiquido = dados.total !== undefined ? dados.total : totalLiquido;
        }
    } catch (err) {
        console.error("Erro ao carregar detalhes da venda:", err);
    }

    // 3. Atualiza o valor final em destaque do modal
    document.getElementById('modal-total-valor').innerText = formatarMoeda(totalLiquido);

    // 4. Monta a tabela de itens
    tbody.innerHTML = '';

    if (itens && itens.length > 0) {
        itens.forEach(item => {
            const nome = item.nome || item.produto || item.produto_nome || 'Produto Indefinido';
            const qtd = item.qtd || item.quantidade || 1;
            const preco = item.preco || item.preco_unitario || 0;
            const itemSubtotal = item.subtotal || (qtd * preco);

            tbody.innerHTML += `
                <tr>
                    <td style="text-align: left; padding: 8px;">${nome}</td>
                    <td style="text-align: center; padding: 8px;">${qtd}</td>
                    <td style="text-align: right; padding: 8px;">${formatarMoeda(preco)}</td>
                    <td style="text-align: right; padding: 8px; font-weight: 600;">${formatarMoeda(itemSubtotal)}</td>
                </tr>
            `;
        });

        // Exibe linhas de resumo (Subtotal e Desconto) se houver desconto aplicado
        if (desconto > 0) {
            tbody.innerHTML += `
                <tr style="border-top: 2px solid #e2e8f0; background-color: #f8fafc;">
                    <td colspan="3" style="text-align: right; padding: 6px 12px; font-size: 13px;"><strong>Subtotal Bruto:</strong></td>
                    <td style="text-align: right; padding: 6px 12px; font-size: 13px;">${formatarMoeda(subtotalBruto)}</td>
                </tr>
                <tr style="background-color: #f8fafc; color: #dc2626;">
                    <td colspan="3" style="text-align: right; padding: 6px 12px; font-size: 13px;"><strong>Desconto:</strong></td>
                    <td style="text-align: right; padding: 6px 12px; font-size: 13px;">- ${formatarMoeda(desconto)}</td>
                </tr>
                <tr style="background-color: #f8fafc; font-weight: bold;">
                    <td colspan="3" style="text-align: right; padding: 8px 12px; font-size: 14px;"><strong>Total Líquido:</strong></td>
                    <td style="text-align: right; padding: 8px 12px; font-size: 14px; color: #16a34a;">${formatarMoeda(totalLiquido)}</td>
                </tr>
            `;
        }
    } else {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 16px; color: #94a3b8;">Sem detalhes dos itens.</td></tr>`;
    }
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesVenda').style.display = 'none';
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataIso) {
    if (!dataIso) return '--/--/----';
    if (dataIso.includes('/')) return dataIso;
    const partes = dataIso.split('T')[0].split('-');
    if (partes.length < 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function exportarRelatorio() {
    if (!vendasFiltradas || vendasFiltradas.length === 0) {
        alert('Não há vendas registradas para exportar.');
        return;
    }

    const cabecalhos = ["ID Venda", "Data", "Cliente", "Usuário", "Qtd Itens", "Forma Pagamento", "Status", "Total (R$)"];

    const linhas = vendasFiltradas.map(venda => {
        let totalQtd = 1;
        if (typeof venda.itens === 'number') totalQtd = venda.itens;
        else if (Array.isArray(venda.itens)) totalQtd = venda.itens.length;
        else if (venda.qtdItens) totalQtd = venda.qtdItens;

        return [
            `"#${venda.id}"`,
            `"${formatarData(venda.data)}"`,
            `"${(venda.cliente || 'Consumidor Final').replace(/"/g, '""')}"`,
            `"${(venda.usuario || 'Sistema').replace(/"/g, '""')}"`,
            totalQtd,
            `"${(venda.pagamento || venda.forma_pagamento || 'N/A').toUpperCase()}"`,
            `"${venda.status || 'Concluída'}"`,
            `"${(venda.total || 0).toFixed(2).replace('.', ',')}"`
        ];
    });

    const conteudoCSV = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map(row => row.join(";"))].join("\n");

    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const dataAtual = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_${dataAtual}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}