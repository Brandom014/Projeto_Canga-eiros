/* =========================================================
   LÓGICA DO RELATÓRIO DE VENDAS (SUPORTE A MÚLTIPLOS PAGAMENTOS)
========================================================= */

let relatorioVendas = [];
let vendasFiltradas = [];
let paginaAtual = 1;
const itensPorPagina = 4; // Quantidade de vendas por página

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
        const usuarioNome = (venda.usuario || venda.vendedor || '').toLowerCase();
        const idStr = venda.id ? venda.id.toString().toLowerCase() : '';

        const matchBusca = !busca || 
            idStr.includes(busca) || 
            clienteNome.includes(busca) ||
            usuarioNome.includes(busca);

        const pagVendaRaw = String(venda.pagamento || venda.forma_pagamento || '').toLowerCase();
        const matchPagamento = !pagamento || pagVendaRaw.includes(pagamento);

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

        const formaPagtoFormatada = formatarPagamentoTabela(venda.pagamento || venda.forma_pagamento);

        tr.innerHTML = `
            <td>#${venda.id}</td>
            <td>${formatarData(venda.data)}</td>
            <td>${venda.cliente || 'Consumidor Final'}</td>
            <td>${venda.vendedor || venda.usuario || 'Sistema'}</td>
            <td>${totalQtdItens} item(ns)</td>
            <td><strong>${formaPagtoFormatada}</strong></td>
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

function formatarPagamentoTabela(pagamentoRaw) {
    if (!pagamentoRaw) return 'N/I';
    const texto = String(pagamentoRaw).trim();

    if (texto.startsWith('[') || texto.startsWith('{')) {
        try {
            const parsed = JSON.parse(texto);
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (parsed.length > 1) {
                    return `MÚLTIPLO (${parsed.length})`;
                }
                const primeiro = parsed[0];
                const tipo = primeiro.tipo || primeiro.TIPO || primeiro.nome || primeiro.NOME || 'PAGAMENTO';
                return obterInfoPagamento(tipo).nome.toUpperCase();
            }
        } catch (e) {}
    }
    return texto.toUpperCase();
}

function obterInfoPagamento(tipo) {
    const t = (tipo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes('dinheiro')) return { nome: 'Dinheiro', icone: 'fa-money-bill-wave' };
    if (t.includes('pix')) return { nome: 'PIX', icone: 'fa-brands fa-pix' };
    if (t.includes('credito')) return { nome: 'Cartão de Crédito', icone: 'fa-credit-card' };
    if (t.includes('debito')) return { nome: 'Cartão de Débito', icone: 'fa-regular fa-credit-card' };
    return { nome: tipo || 'Pagamento', icone: 'fa-wallet' };
}

function atualizarPaginacao() {
    const totalItens = vendasFiltradas.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const pageInfo = document.getElementById('pageInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (pageInfo) {
        pageInfo.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    if (btnPrev) {
        btnPrev.disabled = (paginaAtual <= 1);
        btnPrev.style.opacity = (paginaAtual <= 1) ? "0.5" : "1";
        btnPrev.style.cursor = (paginaAtual <= 1) ? "not-allowed" : "pointer";
    }

    if (btnNext) {
        btnNext.disabled = (paginaAtual >= totalPaginas);
        btnNext.style.opacity = (paginaAtual >= totalPaginas) ? "0.5" : "1";
        btnNext.style.cursor = (paginaAtual >= totalPaginas) ? "not-allowed" : "pointer";
    }
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
   DETALHES DA VENDA (MODAL COM SUPORTE COMPLETO A MÚLTIPLOS CARDS)
========================================================= */
async function abrirModalDetalhes(vendaId) {
    const venda = relatorioVendas.find(v => v.id == vendaId);
    if (!venda) return;

    // Cabeçalho do modal
    const elId = document.getElementById('modal-venda-id');
    const elData = document.getElementById('modal-venda-data');
    const elCliente = document.getElementById('modal-cliente-nome');
    const elVendedor = document.getElementById('modal-vendedor-nome');

    if (elId) elId.innerText = venda.id;
    if (elData) elData.innerText = formatarData(venda.data);
    if (elCliente) elCliente.innerText = venda.cliente || 'Consumidor Final';
    if (elVendedor) elVendedor.innerText = venda.vendedor || venda.usuario || 'Admin';

    const tbody = document.getElementById('modal-itens-body');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 16px; color: #64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Carregando detalhes...</td></tr>`;
    }

    const modal = document.getElementById('modalDetalhesVenda');
    if (modal) modal.style.display = 'flex';

    // Extrai pagamentos caso já esteja gravado em formato JSON string
    let pagamentos = venda.pagamentos || [];
    if ((!pagamentos || pagamentos.length === 0) && (venda.forma_pagamento || venda.pagamento)) {
        const raw = String(venda.forma_pagamento || venda.pagamento).trim();
        if (raw.startsWith('[') || raw.startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) pagamentos = parsed;
            } catch (e) {}
        }
    }

    let itens = venda.itensDetalhes || (Array.isArray(venda.itens) ? venda.itens : []);
    let subtotalBruto = venda.subtotal !== undefined ? venda.subtotal : (venda.total || 0);
    let desconto = venda.desconto || 0;
    let totalLiquido = venda.total || 0;
    let troco = venda.troco || 0;

    // Busca dados atualizados no backend
    try {
        let response = await fetch(`/vendas/api/detalhes/${vendaId}`);
        if (!response.ok) {
            response = await fetch(`/api/relatorio/${vendaId}`);
        }

        if (response.ok) {
            const dados = await response.json();
            itens = dados.itens || dados.itensDetalhes || itens;
            pagamentos = (dados.pagamentos && dados.pagamentos.length > 0) ? dados.pagamentos : pagamentos;
            subtotalBruto = dados.subtotal !== undefined ? dados.subtotal : subtotalBruto;
            desconto = dados.desconto !== undefined ? dados.desconto : desconto;
            totalLiquido = dados.total !== undefined ? dados.total : totalLiquido;
            troco = dados.troco !== undefined ? dados.troco : troco;
        }
    } catch (err) {
        console.error("Erro ao carregar detalhes completos:", err);
    }

    // Renderizar tabela de produtos
    if (tbody) {
        tbody.innerHTML = '';
        if (itens && itens.length > 0) {
            itens.forEach(item => {
                const nome = item.nome || item.produto || item.produto_nome || 'Produto Indefinido';
                const qtd = item.qtd || item.quantidade || 1;
                const preco = item.preco || item.preco_unitario || 0;
                const itemSubtotal = item.subtotal || (qtd * preco);

                tbody.innerHTML += `
                    <tr>
                        <td style="text-align: left; padding: 8px 4px; color: #1e293b; font-weight: 500;">${nome}</td>
                        <td style="text-align: center; padding: 8px 4px; color: #475569;">${qtd}</td>
                        <td style="text-align: right; padding: 8px 4px; color: #475569;">${formatarMoeda(preco)}</td>
                        <td style="text-align: right; padding: 8px 4px; font-weight: 700; color: #0f172a;">${formatarMoeda(itemSubtotal)}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 16px; color: #94a3b8;">Sem detalhes dos produtos.</td></tr>`;
        }
    }

    // Renderizar Formas de Pagamento em Grelha
    const elPagamento = document.getElementById('modal-pagamento');
    if (elPagamento) {
        if (pagamentos && pagamentos.length > 0) {
            elPagamento.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 6px;">
                    ${pagamentos.map((p, idx) => {
                        const tipo = p.tipo || p.TIPO || p.nome || p.NOME || p.forma || 'Pagamento';
                        const valor = p.valor !== undefined ? p.valor : (p.VALOR !== undefined ? p.VALOR : 0);
                        const info = obterInfoPagamento(tipo);
                        return `
                            <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                                <div style="width: 42px; height: 42px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #0f172a; flex-shrink: 0;">
                                    <i class="fa-solid ${info.icone}"></i>
                                </div>
                                <div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 0.825rem; font-weight: 600; color: #475569;">${info.nome}${pagamentos.length > 1 ? `#${idx + 1}` : ''}</span>
                                    <strong style="font-size: 1rem; color: #0f172a;">${formatarMoeda(valor)}</strong>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else {
            const formaUnica = venda.pagamento || venda.forma_pagamento || 'DINHEIRO';
            const info = obterInfoPagamento(formaUnica);
            elPagamento.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 6px;">
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                        <div style="width: 42px; height: 42px; background: #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #0f172a; flex-shrink: 0;">
                            <i class="fa-solid ${info.icone}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.825rem; font-weight: 600; color: #475569;">${info.nome}</span>
                            <strong style="font-size: 1rem; color: #0f172a;">${formatarMoeda(totalLiquido)}</strong>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Renderizar Resumo Financeiro
    const elResumoFinanceiro = document.getElementById('modal-resumo-financeiro');
    if (elResumoFinanceiro) {
        elResumoFinanceiro.innerHTML = `
            <div style="margin-top: 16px;">
                <label style="display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.05em;">
                    RESUMO FINANCEIRO DETALHADO
                </label>
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.95rem;">
                    <div style="display: flex; justify-content: space-between; color: #334155;">
                        <span>Subtotal:</span>
                        <span style="font-weight: 600;">${formatarMoeda(subtotalBruto)}</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; color: #ef4444; font-weight: 600;">
                        <span>Desconto:</span>
                        <span>${desconto > 0 ? `- ${formatarMoeda(desconto)}` : '- R$ 0,00'}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.2rem; font-weight: 800; color: #16a34a; padding-top: 8px; border-top: 1px solid #e2e8f0; margin-top: 4px;">
                        <span>Total da Venda:</span>
                        <span>${formatarMoeda(totalLiquido)}</span>
                    </div>

                    <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 700; color: #16a34a; margin-top: 2px;">
                        <span>Troco:</span>
                        <span>${formatarMoeda(troco)}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modalDetalhesVenda');
    if (modal) modal.style.display = 'none';
}

function formatarMoeda(valor) {
    return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

    const cabecalhos = ["ID Venda", "Data", "Cliente", "Vendedor", "Qtd Itens", "Forma Pagamento", "Status", "Total (R$)"];

    const linhas = vendasFiltradas.map(venda => {
        let totalQtd = 1;
        if (typeof venda.itens === 'number') totalQtd = venda.itens;
        else if (Array.isArray(venda.itens)) totalQtd = venda.itens.length;
        else if (venda.qtdItens) totalQtd = venda.qtdItens;

        return [
            `"#${venda.id}"`,
            `"${formatarData(venda.data)}"`,
            `"${(venda.cliente || 'Consumidor Final').replace(/"/g, '""')}"`,
            `"${(venda.vendedor || venda.usuario || 'Sistema').replace(/"/g, '""')}"`,
            totalQtd,
            `"${formatarPagamentoTabela(venda.pagamento || venda.forma_pagamento)}"`,
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