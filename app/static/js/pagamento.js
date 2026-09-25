/* =========================================================
   LÓGICA DA TELA DE PAGAMENTO (PDV) - FASTAPI INTEGRATED
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Carrega os itens do carrinho
    let carrinho = JSON.parse(localStorage.getItem("carrinho_pdv")) || [];
    
    // 2. Define o Vendedor / Admin dinamicamente
    let userStorage = JSON.parse(localStorage.getItem("usuario_logado")) || localStorage.getItem("usuario_logado") || "Admin";
    let nomeVendedor = typeof userStorage === "object" ? (userStorage.nome || userStorage.usuario || "Admin") : userStorage;

    // 3. Estado do Cliente Selecionado (Recupera do localStorage do PDV se existir)
    let clienteSalvoPdv = localStorage.getItem("cliente_pdv");
    let nomeCliente = "Consumidor Final";
    let cpfCliente = "";
    let idCliente = null;

    // Trata o cliente vindo do localStorage (seja objeto JSON ou String)
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

    // Referências de Elementos do DOM
    const container = document.getElementById("listaProdutos");
    const badgeCount = document.getElementById("badgeCount");
    const subtotalEl = document.getElementById("subtotalValor");
    const descontoEl = document.getElementById("descontoValor");
    const linhaDesconto = document.getElementById("linhaDesconto");
    const totalEl = document.getElementById("totalValor");
    const btnDesconto = document.getElementById("btnDesconto");
    const inputRecebido = document.getElementById("valorRecebido");
    const trocoEl = document.getElementById("valorTroco");
    const btnConfirmar = document.getElementById("btnConfirmar");
    const painelDinheiro = document.getElementById("painelDinheiro");
    const metodosCards = document.querySelectorAll(".metodo-card");

    let valorDesconto = 0;

    // -------------------------------------------------------------
    // FUNÇÕES AUXILIARES DE FORMATAÇÃO E CÁLCULO
    // -------------------------------------------------------------
    function formatarMoeda(valor) {
        return (Number(valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function calcularTroco(totalFinal) {
        if (!inputRecebido || !trocoEl) return;

        const recebido = parseFloat(inputRecebido.value) || 0;
        const troco = recebido - totalFinal;

        if (troco >= 0) {
            trocoEl.textContent = formatarMoeda(troco);
            trocoEl.style.color = "#16a34a";
        } else {
            trocoEl.textContent = "R$ 0,00";
            trocoEl.style.color = "#ef4444";
        }
    }

    function renderizarResumo() {
        if (!container) return;

        // Se o carrinho estiver vazio, exibe a mensagem amigável
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

        const totalFinal = Math.max(0, totalSubtotal - valorDesconto);

        if (badgeCount) badgeCount.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
        if (subtotalEl) subtotalEl.textContent = formatarMoeda(totalSubtotal);
        if (totalEl) totalEl.textContent = formatarMoeda(totalFinal);

        if (valorDesconto > 0 && linhaDesconto && descontoEl) {
            linhaDesconto.style.display = "flex";
            descontoEl.textContent = `- ${formatarMoeda(valorDesconto)}`;
        } else if (linhaDesconto) {
            linhaDesconto.style.display = "none";
        }

        calcularTroco(totalFinal);
    }

    // -------------------------------------------------------------
    // BUSCAR E INICIALIZAR SELETOR DE CLIENTES (VIA API FASTAPI)
    // -------------------------------------------------------------
    async function inicializarSeletorCliente() {
        let selectEl = document.getElementById("selectCliente");

        // Se o select não existir no HTML, cria automaticamente na tela
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
            
            if (!response.ok) {
                throw new Error("Erro na requisição dos clientes");
            }

            const clientesCadastrados = await response.json();

            if (selectEl) {
                selectEl.innerHTML = `<option value="">Consumidor Final (Sem Cadastro)</option>`;
                
                clientesCadastrados.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c.id;
                    opt.textContent = `${c.nome}${c.cpf ? ' - CPF: ' + c.cpf : ''}`;
                    
                    // Se o cliente já veio pré-selecionado do PDV, deixa selecionado
                    if (idCliente && String(c.id) === String(idCliente)) {
                        opt.selected = true;
                    } else if (!idCliente && nomeCliente && c.nome.trim().toLowerCase() === nomeCliente.trim().toLowerCase()) {
                        opt.selected = true;
                        idCliente = c.id;
                    }

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
        } catch (err) {
            console.error("Erro ao carregar lista de clientes do servidor:", err);
            if (selectEl) {
                selectEl.innerHTML = `<option value="">Consumidor Final (${nomeCliente !== 'Consumidor Final' ? nomeCliente : 'Erro ao carregar lista'})</option>`;
            }
        }
    }

    // -------------------------------------------------------------
    // EVENT LISTENERS E INTERAÇÕES
    // -------------------------------------------------------------

    // Atualização em tempo real do valor recebido
    if (inputRecebido) {
        inputRecebido.addEventListener("input", () => {
            const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
            const totalFinal = Math.max(0, subtotal - valorDesconto);
            calcularTroco(totalFinal);
        });
    }

    // Botão Adicionar Desconto
    if (btnDesconto) {
        btnDesconto.addEventListener("click", async () => {
            const { value: entrada } = await Swal.fire({
                title: 'Aplicar Desconto',
                text: 'Informe o valor do desconto em R$:',
                input: 'number',
                inputPlaceholder: '0,00',
                inputAttributes: { step: '0.01', min: '0' },
                showCancelButton: true,
                confirmButtonText: 'Aplicar Desconto',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#64748b'
            });

            if (entrada !== undefined && entrada !== null && entrada !== "") {
                const valor = parseFloat(entrada);
                if (!isNaN(valor) && valor >= 0) {
                    valorDesconto = valor;
                    renderizarResumo();
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Desconto Aplicado!',
                        text: `Foi concedido um desconto de ${formatarMoeda(valorDesconto)}.`,
                        confirmButtonColor: '#16a34a'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Valor Inválido',
                        text: 'Por favor, insira um valor numérico válido.',
                        confirmButtonColor: '#ef4444'
                    });
                }
            }
        });
    }

    // Seleção de Forma de Pagamento
    metodosCards.forEach(card => {
        card.addEventListener("click", function () {
            metodosCards.forEach(c => c.classList.remove("active"));
            this.classList.add("active");

            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            if (painelDinheiro) {
                if (radio && radio.value === "dinheiro") {
                    painelDinheiro.style.display = "block";
                    inputRecebido?.focus();
                } else {
                    painelDinheiro.style.display = "none";
                }
            }
        });
    });

    // -------------------------------------------------------------
    // IMPRESSÃO DE COMPROVANTE FISCAL / RECIBO
    // -------------------------------------------------------------
    function gerarEImprimirCupom(metodo, totalFinal, recebido, troco, vendaId = "") {
        let cupomAntigo = document.getElementById("comprovante-print");
        if (cupomAntigo) cupomAntigo.remove();

        const dataAtual = new Date().toLocaleString('pt-BR');
        const numVenda = vendaId || Math.floor(1000 + Math.random() * 9000);

        let itensHtml = carrinho.map(item => `
            <tr>
                <td style="text-align: left; padding: 10px 0; color: #0f172a; font-size: 16px; font-weight: 500;">${item.nome}</td>
                <td style="text-align: center; color: #334155; font-size: 16px;">${item.quantidade}</td>
                <td style="text-align: right; color: #334155; font-size: 16px;">${formatarMoeda(item.preco)}</td>
                <td style="text-align: right; font-weight: bold; color: #0f172a; font-size: 16px;">${formatarMoeda(item.preco * item.quantidade)}</td>
            </tr>
        `).join('');

        const cupomDiv = document.createElement("div");
        cupomDiv.id = "comprovante-print";
        cupomDiv.innerHTML = `
            <style>
                @media screen {
                    #comprovante-print { display: none !important; }
                }
                @media print {
                    @page {
                        size: auto;
                        margin: 10mm;
                    }
                    body * { visibility: hidden !important; }
                    #comprovante-print, #comprovante-print * { visibility: visible !important; }
                    #comprovante-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 750px !important;
                        margin: 0 auto !important;
                        padding: 30px !important;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                        color: #000 !important;
                        background: #fff !important;
                        box-sizing: border-box !important;
                    }
                    .cupom-flex { display: flex !important; justify-content: space-between !important; align-items: center !important; }
                    .cupom-linha { border-bottom: 2px dashed #94a3b8 !important; margin: 18px 0 !important; }
                    .cupom-linha-destaque { border-bottom: 3px dashed #0f172a !important; margin: 22px 0 !important; }
                }
            </style>
            
            <div style="text-align: left; margin-bottom: 12px;">
                <h2 style="margin: 0; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Sistema de Ponto de Venda</h2>
                <span style="font-size: 15px; color: #64748b; font-weight: 500;">CNPJ: 00.000.000/0001-00</span>
            </div>

            <div class="cupom-linha"></div>

            <div class="cupom-flex" style="font-size: 18px; font-weight: 700; color: #0f172a;">
                <span>Venda #${numVenda}</span>
                <span>${dataAtual}</span>
            </div>

            <div class="cupom-flex" style="font-size: 15px; color: #475569; margin-top: 8px;">
                <span>Vendedor: <strong>${nomeVendedor}</strong></span>
                <span>Cliente: <strong>${nomeCliente}</strong>${cpfCliente ? ` (${cpfCliente})` : ''}</span>
            </div>

            <div class="cupom-linha"></div>

            <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #64748b; font-size: 15px; text-transform: uppercase;">
                        <th style="padding: 10px 0;">Produto</th>
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
            <div class="cupom-flex" style="font-size: 18px; margin-bottom: 8px;">
                <span>Desconto</span>
                <span style="color: #ef4444; font-weight: 600;">- ${formatarMoeda(valorDesconto)}</span>
            </div>
            ` : ''}

            <div class="cupom-flex" style="font-size: 26px; font-weight: 800; margin: 18px 0; color: #0f172a;">
                <span>TOTAL</span>
                <span>${formatarMoeda(totalFinal)}</span>
            </div>

            <div class="cupom-linha-destaque"></div>

            <div class="cupom-flex" style="font-size: 18px; font-weight: 700;">
                <span>Pagamento: ${metodo.toUpperCase()}</span>
                ${metodo === 'dinheiro' ? `<span style="color: #16a34a;">Troco: ${formatarMoeda(troco)}</span>` : ''}
            </div>

            <div class="cupom-linha"></div>

            <div style="text-align: center; font-size: 15px; color: #64748b; margin-top: 30px; font-weight: 500;">
                Obrigado pela preferência, ${nomeCliente}! Volte sempre.
            </div>
        `;

        document.body.appendChild(cupomDiv);
        window.print();
    }

    // -------------------------------------------------------------
    // FINALIZAR VENDA (COMUNICAÇÃO COM O FASTAPI)
    // -------------------------------------------------------------
    async function finalizarVenda() {
        if (!carrinho || carrinho.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrinho Vazio',
                text: 'Adicione pelo menos um produto ao carrinho antes de finalizar a venda.',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        const metodo = document.querySelector('input[name="forma_pagamento"]:checked')?.value || 'dinheiro';
        const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        const totalFinal = Math.max(0, subtotal - valorDesconto);
        const recebido = parseFloat(inputRecebido?.value) || 0;

        if (metodo === "dinheiro" && recebido < totalFinal) {
            Swal.fire({
                icon: 'error',
                title: 'Valor Insuficiente',
                text: `O valor recebido (${formatarMoeda(recebido)}) é menor que o total (${formatarMoeda(totalFinal)}).`,
                confirmButtonColor: '#ef4444'
            }).then(() => inputRecebido?.focus());
            return;
        }

        const troco = Math.max(0, recebido - totalFinal);

        // Desabilita o botão para evitar envio duplicado
        if (btnConfirmar) btnConfirmar.disabled = true;

        try {
            const payload = {
                cliente_id: idCliente,
                cliente: nomeCliente, // 👈 Garante que o nome do cliente seja enviado ao backend
                vendedor: nomeVendedor,
                forma_pagamento: metodo,
                subtotal: subtotal,
                desconto: valorDesconto,
                total: totalFinal,
                valor_recebido: recebido,
                troco: troco,
                itens: carrinho.map(item => ({
                    produto_id: item.id || item.produto_id,
                    quantidade: Number(item.quantidade),
                    preco_unitario: Number(item.preco)
                }))
            };

            const response = await fetch("/vendas/api/finalizar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const erro = await response.json();
                throw new Error(erro.detail || "Erro ao processar a venda no servidor.");
            }

            const resultado = await response.json();

            // Modal de Sucesso
            Swal.fire({
                title: '🎉 Venda Finalizada!',
                html: `
                    <div style="font-size: 1.05rem; text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px; margin-top: 10px; border: 1px solid #e2e8f0;">
                        <p style="margin: 6px 0; color: #334155;"><strong>Nº da Venda:</strong> #${resultado.venda_id || resultado.id}</p>
                        <p style="margin: 6px 0; color: #334155;"><strong>Vendedor:</strong> ${nomeVendedor}</p>
                        <p style="margin: 6px 0; color: #334155;"><strong>Cliente:</strong> ${nomeCliente}</p>
                        <p style="margin: 6px 0; color: #334155;"><strong>Forma de Pagamento:</strong> ${metodo.toUpperCase()}</p>
                        <p style="margin: 6px 0; color: #334155;"><strong>Total da Venda:</strong> ${formatarMoeda(totalFinal)}</p>
                        ${metodo === 'dinheiro' ? `
                            <p style="margin: 6px 0; color: #334155;"><strong>Valor Recebido:</strong> ${formatarMoeda(recebido)}</p>
                            <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0;">
                            <p style="margin: 6px 0; font-size: 1.25rem; color: #16a34a;"><strong>Troco: ${formatarMoeda(troco)}</strong></p>
                        ` : ''}
                    </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '<i class="fa-solid fa-print"></i> Imprimir Comprovante',
                cancelButtonText: 'Nova Venda',
                confirmButtonColor: '#16a34a',
                cancelButtonColor: '#64748b'
            }).then((result) => {
                if (result.isConfirmed) {
                    gerarEImprimirCupom(metodo, totalFinal, recebido, troco, resultado.venda_id || resultado.id);
                }

                localStorage.removeItem("carrinho_pdv");
                localStorage.removeItem("cliente_pdv");
                window.location.href = "/vendas";
            });

        } catch (err) {
            console.error("Erro ao finalizar venda:", err);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao Finalizar Venda',
                text: err.message || 'Ocorreu um erro ao se comunicar com o servidor.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            if (btnConfirmar) btnConfirmar.disabled = false;
        }
    }

    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", finalizarVenda);
    }

    // Atalho do Teclado: Aperta F5 para finalizar venda rapidamente
    document.addEventListener("keydown", (e) => {
        if (e.key === "F5") {
            e.preventDefault();
            finalizarVenda();
        }
    });

    // Inicialização do fluxo da tela
    renderizarResumo();
    inicializarSeletorCliente();
});