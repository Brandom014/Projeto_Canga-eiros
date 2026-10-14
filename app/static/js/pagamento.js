/* =========================================================
   PDV - MÚLTIPLAS FORMAS DE PAGAMENTO + NOTA FISCAL (COMPLETO)
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

    // -------------------------------------------------------------
    // TRAVA DE SEGURANÇA NO CÁLCULO DO TOTAL
    // -------------------------------------------------------------
    function obterTotalFinal() {
        const subtotal = obterSubtotal();
        if (valorDesconto > subtotal) {
            valorDesconto = subtotal;
        }
        return Math.max(0, subtotal - valorDesconto);
    }

    function adicionarFormaPagamento(tipo) {
        const totalVenda = obterTotalFinal();
        const totalPagoAtual = pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const restante = Math.max(0, totalVenda - totalPagoAtual);

        if (restante <= 0 && pagamentos.length > 0) {
            if (typeof Swal !== 'undefined') {
                Swal.fire("Atenção", "O valor total da venda já foi totalmente atingido!", "info");
            }
            return;
        }

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

        atualizarResumoPagamentos();
    }

    async function inicializarSeletorCliente() {
        let selectEl = document.getElementById("selectCliente");

        if (!selectEl && container) {
            const caixaCliente = document.createElement("div");
            caixaCliente.style.cssText = "background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #cbd5e1;";
            caixaCliente.innerHTML = `
                <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 6px; text-transform: uppercase;">
                    <i class="fa-solid fa-user-tag" style="margin-right: 4px;"></i> Cliente da Venda:
                </label>
                <select id="selectCliente" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #94a3b8; font-size: 0.95rem; background: #fff; color: #0f172a; font-weight: 600;">
                    <option value="">Carregando clientes do banco...</option>
                </select>
            `;
            container.parentNode.insertBefore(caixaCliente, container);
            selectEl = document.getElementById("selectCliente");
        }

        try {
            const response = await fetch("/clientes/api/listar");
            const contentType = response.headers.get("content-type");

            if (response.ok && contentType && contentType.includes("application/json")) {
                const clientesCadastrados = await response.json();
                if (selectEl) {
                    selectEl.innerHTML = `<option value="">Consumidor Final (Sem Cadastro)</option>`;
                    clientesCadastrados.forEach(c => {
                        const opt = document.createElement("option");
                        opt.value = c.id;
                        opt.textContent = `${c.nome}${c.cpf ? ' - CPF: ' + c.cpf : ''}`;
                        if (idCliente && String(c.id) === String(idCliente)) opt.selected = true;
                        selectEl.appendChild(opt);
                    });

                    selectEl.addEventListener("change", (e) => {
                        const val = e.target.value;
                        if (!val) {
                            nomeCliente = "Consumidor Final";
                            cpfCliente = "";
                            idCliente = null;
                            localStorage.removeItem("cliente_pdv");
                        } else {
                            let achado = clientesCadastrados.find(c => String(c.id) === String(val));
                            if (achado) {
                                nomeCliente = achado.nome;
                                cpfCliente = achado.cpf || "";
                                idCliente = achado.id;
                                localStorage.setItem("cliente_pdv", JSON.stringify(achado));
                            }
                        }
                    });
                }
            } else {
                if (selectEl) selectEl.innerHTML = `<option value="">Consumidor Final (Sem Cadastro)</option>`;
            }
        } catch (err) {
            if (selectEl) selectEl.innerHTML = `<option value="">Consumidor Final</option>`;
        }
    }

    // -------------------------------------------------------------
    // BOTÃO APLICAR DESCONTO COM VALIDAÇÃO EM TEMPO REAL
    // -------------------------------------------------------------
    if (btnDesconto) {
        btnDesconto.addEventListener("click", async () => {
            const subtotal = obterSubtotal();
            if (subtotal <= 0) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire("Atenção", "Adicione produtos ao carrinho antes de aplicar desconto!", "warning");
                }
                return;
            }

            if (typeof Swal !== 'undefined') {
                const { value: entrada } = await Swal.fire({
                    title: 'Aplicar Desconto',
                    input: 'number',
                    inputLabel: `Informe o valor do desconto (R$) - Máximo: ${formatarMoeda(subtotal)}`,
                    inputValue: valorDesconto || '',
                    inputAttributes: { step: '0.01', min: '0', max: subtotal },
                    showCancelButton: true,
                    confirmButtonText: 'Aplicar Desconto',
                    cancelButtonText: 'Cancelar',
                    inputValidator: (value) => {
                        if (!value && value !== '0') {
                            return null;
                        }
                        const num = parseFloat(value);
                        if (isNaN(num)) {
                            return 'Por favor, introduza um valor numérico válido.';
                        }
                        if (num < 0) {
                            return 'O valor do desconto não pode ser negativo!';
                        }
                        if (num > subtotal) {
                            return `O desconto não pode ser superior ao valor da compra (${formatarMoeda(subtotal)})!`;
                        }
                    }
                });

                if (entrada !== undefined && entrada !== null) {
                    const numEntrada = parseFloat(entrada) || 0;
                    valorDesconto = Math.min(subtotal, Math.max(0, numEntrada));
                    renderizarResumo();
                }
            }
        });
    }

    document.getElementById("btnAddDinheiro")?.addEventListener("click", () => adicionarFormaPagamento('dinheiro'));
    document.getElementById("btnAddCredito")?.addEventListener("click", () => adicionarFormaPagamento('credito'));
    document.getElementById("btnAddDebito")?.addEventListener("click", () => adicionarFormaPagamento('debito'));
    document.getElementById("btnAddPix")?.addEventListener("click", () => adicionarFormaPagamento('pix'));

    function gerarEImprimirCupom(totalFinal, troco, vendaId = "") {
        let cupomAntigo = document.getElementById("comprovante-print");
        if (cupomAntigo) cupomAntigo.remove();

        const dataAtual = new Date().toLocaleString('pt-BR');
        const numVenda = vendaId || Math.floor(1000 + Math.random() * 9000);

        let itensHtml = carrinho.map(item => `
            <tr>
                <td style="text-align: left; padding: 8px 0; color: #0f172a; font-size: 15px; font-weight: 500;">${item.nome}</td>
                <td style="text-align: center; color: #334155; font-size: 15px;">${item.quantidade}</td>
                <td style="text-align: right; color: #334155; font-size: 15px;">${formatarMoeda(item.preco)}</td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 15px;">${formatarMoeda(item.preco * item.quantidade)}</td>
            </tr>
        `).join('');

        let pagamentosHtml = pagamentos.map(p => {
            const info = infoMetodos[p.tipo] || { nome: p.tipo };
            return `
                <div class="cupom-flex" style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
                    <span>${info.nome}</span>
                    <span>${formatarMoeda(p.valor)}</span>
                </div>
            `;
        }).join('');

        const cupomDiv = document.createElement("div");
        cupomDiv.id = "comprovante-print";
        cupomDiv.innerHTML = `
            <style>
                @media screen { #comprovante-print { display: none !important; } }
                @media print {
                    @page { size: auto; margin: 8mm; }
                    body * { visibility: hidden !important; }
                    #comprovante-print, #comprovante-print * { visibility: visible !important; }
                    #comprovante-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 750px !important;
                        margin: 0 auto !important;
                        padding: 20px !important;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                        color: #000 !important;
                        background: #fff !important;
                        box-sizing: border-box !important;
                    }
                    .cupom-flex { display: flex !important; justify-content: space-between !important; align-items: center !important; }
                    .cupom-linha { border-bottom: 2px dashed #94a3b8 !important; margin: 16px 0 !important; }
                    .cupom-linha-destaque { border-bottom: 3px dashed #0f172a !important; margin: 20px 0 !important; }
                }
            </style>
            
            <div style="text-align: left; margin-bottom: 12px;">
                <h2 style="margin: 0; font-size: 26px; font-weight: 800; color: #0f172a;">Sistema de Ponto de Venda</h2>
                <span style="font-size: 14px; color: #64748b;">CNPJ: 00.000.000/0001-00</span>
            </div>

            <div class="cupom-linha"></div>

            <div class="cupom-flex" style="font-size: 17px; font-weight: 700; color: #0f172a;">
                <span>Venda #${numVenda}</span>
                <span>${dataAtual}</span>
            </div>

            <div class="cupom-flex" style="font-size: 14px; color: #475569; margin-top: 6px;">
                <span>Vendedor: <strong>${nomeVendedor}</strong></span>
                <span>Cliente: <strong>${nomeCliente}</strong>${cpfCliente ? ` (${cpfCliente})` : ''}</span>
            </div>

            <div class="cupom-linha"></div>

            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #64748b; font-size: 14px; text-transform: uppercase;">
                        <th style="padding: 8px 0;">Produto</th>
                        <th style="text-align: center;">Qtd.</th>
                        <th style="text-align: right;">Unitário</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itensHtml}
                </tbody>
            </table>

            <div class="cupom-linha"></div>

            ${valorDesconto > 0 ? `
            <div class="cupom-flex" style="font-size: 16px; margin-bottom: 6px;">
                <span>Desconto</span>
                <span style="color: #ef4444; font-weight: 600;">- ${formatarMoeda(valorDesconto)}</span>
            </div>
            ` : ''}

            <div class="cupom-flex" style="font-size: 24px; font-weight: 800; margin: 14px 0; color: #0f172a;">
                <span>TOTAL</span>
                <span>${formatarMoeda(totalFinal)}</span>
            </div>

            <div class="cupom-linha-destaque"></div>

            <div style="margin-bottom: 10px;">
                <span style="display: block; font-size: 14px; color: #64748b; font-weight: 700; margin-bottom: 6px; text-transform: uppercase;">Formas de Pagamento:</span>
                ${pagamentosHtml}
            </div>

            ${troco > 0 ? `
            <div class="cupom-flex" style="font-size: 18px; font-weight: 700; color: #16a34a; margin-top: 8px;">
                <span>Troco:</span>
                <span>${formatarMoeda(troco)}</span>
            </div>
            ` : ''}

            <div class="cupom-linha"></div>

            <div style="text-align: center; font-size: 14px; color: #64748b; margin-top: 20px;">
                Obrigado pela preferência, ${nomeCliente}! Volte sempre.
            </div>
        `;

        document.body.appendChild(cupomDiv);
        window.print();
    }

    async function finalizarVenda() {
        if (!carrinho || carrinho.length === 0) {
            if (typeof Swal !== 'undefined') Swal.fire("Atenção", "Carrinho vazio!", "warning");
            return;
        }

        const totalVenda = obterTotalFinal();
        const totalPago = pagamentos.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
        const restante = totalVenda - totalPago;

        if (restante > 0.009) {
            if (typeof Swal !== 'undefined') Swal.fire("Atenção", "O valor restante precisa ser totalmente quitado!", "warning");
            return;
        }

        const temDinheiro = pagamentos.some(p => p.tipo === 'dinheiro');
        const troco = (temDinheiro && restante < -0.01) ? Math.abs(restante) : 0;

        const formaPagamentoPrincipal = pagamentos.length > 0 ? pagamentos[0].tipo : "dinheiro";

        if (btnConfirmar) btnConfirmar.disabled = true;

        try {
            const payload = {
                cliente_id: idCliente,
                cliente: nomeCliente,
                vendedor: nomeVendedor,
                forma_pagamento: formaPagamentoPrincipal,
                subtotal: obterSubtotal(),
                desconto: valorDesconto,
                total: totalVenda,
                troco: troco,
                pagamentos: pagamentos.map(p => ({
                    tipo: p.tipo,
                    nome: infoMetodos[p.tipo]?.nome || p.tipo,
                    valor: Number(p.valor)
                })),
                itens: carrinho.map(item => ({
                    produto_id: item.id || item.produto_id,
                    nome: item.nome || "",
                    quantidade: Number(item.quantidade),
                    preco_unitario: Number(item.preco)
                }))
            };

            const response = await fetch("/vendas/api/finalizar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const contentType = response.headers.get("content-type");
            let resultado = {};

            if (contentType && contentType.includes("application/json")) {
                resultado = await response.json();
            } else {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Sessão expirada. Faça login novamente para prosseguir.");
                } else if (response.status === 404) {
                    throw new Error("Rota de finalização não encontrada no servidor Python (/vendas/api/finalizar).");
                } else {
                    throw new Error(`O servidor respondeu com código ${response.status}.`);
                }
            }

            if (!response.ok) {
                throw new Error(resultado.detail || resultado.mensagem || "Forma de pagamento ou dados inválidos.");
            }

            if (typeof Swal !== 'undefined') {
                const res = await Swal.fire({
                    title: '🎉 Venda Finalizada!',
                    html: `
                        <div style="font-size: 1rem; text-align: left; background: #f8fafc; padding: 14px; border-radius: 10px; margin-top: 8px; border: 1px solid #e2e8f0;">
                            <p style="margin: 4px 0;"><strong>Venda:</strong> #${resultado.venda_id || resultado.id || 1024}</p>
                            <p style="margin: 4px 0;"><strong>Cliente:</strong> ${nomeCliente}</p>
                            <p style="margin: 4px 0;"><strong>Total:</strong> ${formatarMoeda(totalVenda)}</p>
                            ${troco > 0 ? `<p style="margin: 4px 0; color: #16a34a; font-size: 1.1rem;"><strong>Troco: ${formatarMoeda(troco)}</strong></p>` : ''}
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: '<i class="fa-solid fa-print"></i> Imprimir Comprovante',
                    cancelButtonText: 'Nova Venda',
                    confirmButtonColor: '#16a34a'
                });

                if (res.isConfirmed) {
                    gerarEImprimirCupom(totalVenda, troco, resultado.venda_id || resultado.id);
                }
            }

            localStorage.removeItem("carrinho_pdv");
            localStorage.removeItem("cliente_pdv");
            window.location.href = "/vendas";

        } catch (err) {
            console.error(err);
            if (typeof Swal !== 'undefined') {
                Swal.fire("Erro", err.message || "Erro ao processar o pagamento.", "error");
            }
        } finally {
            if (btnConfirmar) btnConfirmar.disabled = false;
        }
    }

    if (btnConfirmar) btnConfirmar.addEventListener("click", finalizarVenda);

    document.addEventListener("keydown", (e) => {
        if (e.key === "F5") {
            e.preventDefault();
            if (btnConfirmar && !btnConfirmar.disabled) finalizarVenda();
        }
    });

    renderizarResumo();
    adicionarFormaPagamento('dinheiro');
    inicializarSeletorCliente();
});