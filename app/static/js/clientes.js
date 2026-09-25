// ==========================================
// ESTADO GLOBAL & PAGINAÇÃO
// ==========================================
let paginaAtual = 1;
const itensPorPagina = 4; // Alterado para 4 itens por página
let clientesFiltrados = [];

// ==========================================
// MODAIS (CADASTRO E EDIÇÃO)
// ==========================================

function abrirModalCadastro() {
    const modal = document.getElementById("modalCadastro");
    if (!modal) return;

    modal.classList.add("show");

    const nome = document.getElementById("nome");
    if (nome) {
        setTimeout(() => nome.focus(), 100);
    }
}

function abrirModalEdicao(botao) {
    const modal = document.getElementById("modalEdicao");
    const form = document.getElementById("formEdicao");

    if (!modal || !form) return;

    const id = botao.dataset.id;
    const nome = botao.dataset.nome;
    const cpf = botao.dataset.cpf;
    const telefone = botao.dataset.telefone;
    const email = botao.dataset.email;
    const matricula = botao.dataset.matricula;

    form.action = `/clientes/editar/${id}`;

    if (document.getElementById("editNome")) document.getElementById("editNome").value = nome || "";
    if (document.getElementById("editCpf")) document.getElementById("editCpf").value = cpf || "";
    if (document.getElementById("editTelefone")) document.getElementById("editTelefone").value = telefone || "";
    if (document.getElementById("editEmail")) document.getElementById("editEmail").value = email || "";
    if (document.getElementById("edit-matricula")) document.getElementById("edit-matricula").value = matricula || "";

    modal.classList.add("show");

    setTimeout(() => {
        const inputNome = document.getElementById("editNome");
        if (inputNome) inputNome.focus();
    }, 100);
}

function fecharModais() {
    document.querySelectorAll(".modal").forEach(modal => {
        modal.classList.remove("show");
    });
}

// Fechar ao clicar no fundo do modal
document.querySelectorAll(".modal").forEach(modal => {
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            fecharModais();
            fecharDesativacao();
        }
    });
});

// Fechar ao pressionar a tecla ESC
document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        fecharModais();
        fecharDesativacao();
    }
});

// ==========================================
// MODAL DE DESATIVAÇÃO
// ==========================================

let clienteDesativarId = null;

function abrirModalDesativacao(id, nome) {
    clienteDesativarId = id;

    const modal = document.getElementById("desativarModal");
    const nomeElemento = document.getElementById("clienteDesativarNome");

    if (nomeElemento) {
        nomeElemento.textContent = nome;
    }

    if (modal) {
        modal.classList.add("show");
    }
}

function fecharDesativacao() {
    clienteDesativarId = null;
    const modal = document.getElementById("desativarModal");

    if (modal) {
        modal.classList.remove("show");
    }
}

function confirmarDesativacao() {
    if (!clienteDesativarId) return;

    const form = document.getElementById("formDesativar" + clienteDesativarId);
    if (form) {
        form.submit();
    }
}

// ==========================================
// PESQUISA, FILTROS E PAGINAÇÃO
// ==========================================

function pesquisarClientes() {
    const campo = document.getElementById("campoPesquisa");
    const campoStatus = document.getElementById("filtroStatus");

    const pesquisa = campo ? campo.value.toLowerCase().trim() : "";
    const filtroStatus = campoStatus ? campoStatus.value : "todos";

    const todosClientes = Array.from(document.querySelectorAll("#tabelaClientes .cliente-row"));

    // Filtrar clientes
    clientesFiltrados = todosClientes.filter(cliente => {
        const nome = (cliente.dataset.nome || "").toLowerCase();
        const cpf = (cliente.dataset.cpf || "").toLowerCase();
        const telefone = (cliente.dataset.telefone || "").toLowerCase();
        const email = (cliente.dataset.email || "").toLowerCase();
        const status = (cliente.dataset.status || "").toLowerCase();

        const combinaTexto =
            pesquisa === "" ||
            nome.includes(pesquisa) ||
            cpf.includes(pesquisa) ||
            telefone.includes(pesquisa) ||
            email.includes(pesquisa);

        const combinaStatus =
            filtroStatus === "todos" ||
            status === filtroStatus;

        return combinaTexto && combinaStatus;
    });

    paginaAtual = 1;
    atualizarTabelaEPaginacao(pesquisa, filtroStatus);
}

function atualizarTabelaEPaginacao(pesquisa = "", filtroStatus = "todos") {
    const totalEncontrados = clientesFiltrados.length;
    const totalPaginas = Math.ceil(totalEncontrados / itensPorPagina) || 1;

    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    // Ocultar todas as linhas
    const todosClientes = document.querySelectorAll("#tabelaClientes .cliente-row");
    todosClientes.forEach(cliente => {
        cliente.style.display = "none";
    });

    // Exibir apenas os itens da página atual
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    clientesFiltrados.slice(inicio, fim).forEach(cliente => {
        cliente.style.display = "";
    });

    // Atualizar texto e estado dos botões
    const pageInfo = document.getElementById("pageInfo");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (pageInfo) {
        pageInfo.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    // Bloqueia e desabilita o clique nas pontas (sem loop)
    if (btnPrev) {
        btnPrev.disabled = paginaAtual <= 1;
        btnPrev.style.opacity = paginaAtual <= 1 ? "0.5" : "1";
        btnPrev.style.cursor = paginaAtual <= 1 ? "not-allowed" : "pointer";
    }

    if (btnNext) {
        btnNext.disabled = paginaAtual >= totalPaginas;
        btnNext.style.opacity = paginaAtual >= totalPaginas ? "0.5" : "1";
        btnNext.style.cursor = paginaAtual >= totalPaginas ? "not-allowed" : "pointer";
    }

    atualizarMensagemPesquisa(totalEncontrados, pesquisa, filtroStatus);
}

function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina) || 1;
    const novaPagina = paginaAtual + direcao;

    // Navegação estrita (não ultrapassa nem faz loop)
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;

        const campo = document.getElementById("campoPesquisa");
        const campoStatus = document.getElementById("filtroStatus");

        const pesquisa = campo ? campo.value.toLowerCase().trim() : "";
        const filtroStatus = campoStatus ? campoStatus.value : "todos";

        atualizarTabelaEPaginacao(pesquisa, filtroStatus);
    }
}

function atualizarMensagemPesquisa(quantidade, pesquisa, filtroStatus) {
    const tabela = document.getElementById("tabelaClientes");
    if (!tabela) return;

    let mensagem = document.getElementById("mensagemPesquisa");
    const comFiltroAtivo = pesquisa !== "" || filtroStatus !== "todos";

    if (quantidade === 0 && comFiltroAtivo) {
        if (!mensagem) {
            mensagem = document.createElement("tr");
            mensagem.id = "mensagemPesquisa";
            mensagem.innerHTML = `
                <td colspan="6" class="empty">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <strong>Nenhum cliente encontrado</strong>
                    <span>Tente alterar a pesquisa ou o filtro de status selecionado.</span>
                </td>
            `;
            tabela.appendChild(mensagem);
        }
    } else {
        if (mensagem) {
            mensagem.remove();
        }
    }
}

// ==========================================
// CONFIRMAÇÕES
// ==========================================

function confirmarExclusao() {
    return confirm(
        "Tem certeza que deseja excluir este cliente?\n\n" +
        "Essa ação não poderá ser desfeita."
    );
}

// ==========================================
// MÁSCARAS (CPF & TELEFONE)
// ==========================================

function aplicarMascaraCPF(input) {
    input.addEventListener("input", function () {
        let valor = input.value.replace(/\D/g, "").substring(0, 11);

        if (valor.length > 9) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
        } else if (valor.length > 6) {
            valor = valor.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (valor.length > 3) {
            valor = valor.replace(/(\d{3})(\d{1,3})/, "$1.$2");
        }

        input.value = valor;
    });
}

function aplicarMascaraTelefone(input) {
    input.addEventListener("input", function () {
        let valor = input.value.replace(/\D/g, "").substring(0, 11);

        if (valor.length > 10) {
            valor = valor.replace(/(\d{2})(\d{5})(\d{1,4})/, "($1) $2-$3");
        } else if (valor.length > 6) {
            valor = valor.replace(/(\d{2})(\d{4})(\d{1,4})/, "($1) $2-$3");
        } else if (valor.length > 2) {
            valor = valor.replace(/(\d{2})(\d{1,5})/, "($1) $2");
        }

        input.value = valor;
    });
}

// ==========================================
// INICIALIZAÇÃO E EVENTOS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    const cpfs = [document.getElementById("cpf"), document.getElementById("editCpf")];
    cpfs.forEach(input => input && aplicarMascaraCPF(input));

    const telefones = [document.getElementById("telefone"), document.getElementById("editTelefone")];
    telefones.forEach(input => input && aplicarMascaraTelefone(input));

    const campoPesquisa = document.getElementById("campoPesquisa");
    if (campoPesquisa) {
        campoPesquisa.addEventListener("input", pesquisarClientes);
    }

    const filtroStatus = document.getElementById("filtroStatus");
    if (filtroStatus) {
        filtroStatus.addEventListener("change", pesquisarClientes);
    }

    pesquisarClientes();
});