let relatorioVendas = [];
let vendasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 8;

document.addEventListener('DOMContentLoaded', () => {
    configurarFiltrosAutomaticos();
    carregarVendas();
});

// Eventos que disparam filtragem instantânea sem botão
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

// Carrega dados reais do servidor/API ou do localStorage da sua aplicação
// Carrega vendas da API e do localStorage de forma combinada
async function carregarVendas() {
    let apiVendas = [];

    try {
        const response = await fetch('/api/vendas');
        if (response.ok) {
            const dados = await response.json();
            if (Array.isArray(dados)) apiVendas = dados;
        }
    } catch (error) {
        console.log("Backend offline ou endpoint inativo. Carregando vendas locais...");
    }

    const localData = localStorage.getItem('vendas');
    const localVendas = localData ? JSON.parse(localData) : [];

    // Une as vendas do banco com as vendas locais sem duplicar por ID
    const mapaVendas = new Map();
    [...localVendas, ...apiVendas].forEach(venda => {
        if (venda && venda.id) mapaVendas.set(venda.id, venda);
    });

    relatorioVendas = Array.from(mapaVendas.values());
    aplicarFiltros();
}

// Filtra as vendas corrigindo maiúsculas/minúsculas
function aplicarFiltros() {
    const busca = (document.getElementById('busca')?.value || '').toLowerCase().trim();
    const dataInicio = document.getElementById('data_inicio')?.value;
    const dataFim = document.getElementById('data_fim')?.value;
    const pagamento = (document.getElementById('pagamento')?.value || '').toLowerCase().trim();

    vendasFiltradas = relatorioVendas.filter(venda => {
        const matchBusca = !busca || 
            (venda.id && venda.id.toString().toLowerCase().includes(busca)) || 
            (venda.cliente && venda.cliente.toLowerCase().includes(busca));

        const pagVenda = (venda.pagamento || venda.forma_pagamento || '').toLowerCase().trim();
        const matchPagamento = !pagamento || pagVenda === pagamento;

        let matchData = true;
        const dataVenda = venda.data ? venda.data.split('T')[0] : '';
        if (dataInicio && dataVenda < dataInicio) matchData = false;
        if (dataFim && dataVenda > dataFim) matchData = false;

        return matchBusca && matchPagamento && matchData;
    });

    paginaAtual = 1;
    atualizarCards();
    renderizarTabela();
}

// Renderiza somente as vendas da página atual (fatiamento real)
function renderizarTabela() {
    const tbody = document.getElementById('tabela-vendas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (vendasFiltradas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: #64748b;">Nenhuma venda realizada ainda.</td></tr>`;
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

        tr.innerHTML = `
            <td>#${venda.id}</td>
            <td>${formatarData(venda.data)}</td>
            <td>${venda.cliente || 'Cliente Avulso'}</td>
            <td>${venda.usuario || 'Sistema'}</td>
            <td>${venda.qtdItens || (venda.itens ? venda.itens.length : 1)} item(ns)</td>
            <td>${venda.pagamento || 'N/A'}</td>
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

// Calcula e atualiza os botões e contadores de página
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

// Atualiza métricas superiores
function atualizarCards() {
    const vendasValidas = vendasFiltradas.filter(v => v.status !== 'Cancelada');
    
    const faturamento = vendasValidas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalVendas = vendasValidas.length;
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;
    const totalProdutos = vendasValidas.reduce((acc, v) => acc + (v.qtdItens || (v.itens ? v.itens.length : 1)), 0);

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

// Toggle da Sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

// Modal de detalhes
function abrirModalDetalhes(vendaId) {
    const venda = relatorioVendas.find(v => v.id == vendaId);
    if (!venda) return;

    document.getElementById('modal-venda-id').innerText = venda.id;
    document.getElementById('modal-venda-data').innerText = formatarData(venda.data);
    document.getElementById('modal-cliente-nome').innerText = venda.cliente || 'Cliente Avulso';
    document.getElementById('modal-pagamento').innerText = venda.pagamento || 'N/A';
    document.getElementById('modal-total-valor').innerText = formatarMoeda(venda.total);

    const tbody = document.getElementById('modal-itens-body');
    tbody.innerHTML = '';

    const itens = venda.itensDetalhes || venda.itens || [];

    if (itens.length > 0) {
        itens.forEach(item => {
            const qtd = item.qtd || item.quantidade || 1;
            const preco = item.preco || item.preco_unitario || 0;
            tbody.innerHTML += `
                <tr>
                    <td>${item.nome || item.produto || 'Produto'}</td>
                    <td>${qtd}</td>
                    <td>${formatarMoeda(preco)}</td>
                    <td>${formatarMoeda(qtd * preco)}</td>
                </tr>
            `;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Sem detalhes dos itens.</td></tr>`;
    }

    document.getElementById('modalDetalhesVenda').style.display = 'flex';
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesVenda').style.display = 'none';
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(dataIso) {
    if (!dataIso) return '--/--/----';
    const partes = dataIso.split('T')[0].split('-');
    if (partes.length < 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function exportarRelatorio() {
    if (!vendasFiltradas || vendasFiltradas.length === 0) {
        alert('Não há vendas registradas para exportar.');
        return;
    }

    // Cabeçalhos das colunas
    const cabecalhos = ["ID Venda", "Data", "Cliente", "Usuário", "Qtd Itens", "Forma Pagamento", "Status", "Total (R$)"];

    // Converte cada venda filtrada em uma linha do relatório
    const linhas = vendasFiltradas.map(venda => [
        `"#${venda.id}"`,
        `"${formatarData(venda.data)}"`,
        `"${(venda.cliente || 'Cliente Avulso').replace(/"/g, '""')}"`,
        `"${(venda.usuario || 'Sistema').replace(/"/g, '""')}"`,
        venda.qtdItens || (venda.itens ? venda.itens.length : 1),
        `"${venda.pagamento || 'N/A'}"`,
        `"${venda.status || 'Concluída'}"`,
        `"${(venda.total || 0).toFixed(2).replace('.', ',')}"`
    ]);

    // O prefixo '\uFEFF' (BOM) garante a exibição correta dos caracteres acentuados no Excel
    const conteudoCSV = "\uFEFF" + [cabecalhos.join(";"), ...linhas.map(row => row.join(";"))].join("\n");

    // Cria o link invisível para download do arquivo .csv
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