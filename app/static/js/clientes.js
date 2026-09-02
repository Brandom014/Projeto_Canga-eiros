// =========================
// MODAIS
// =========================

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

    form.action = `/clientes/editar/${id}`;

    document.getElementById("editNome").value = nome;
    document.getElementById("editCpf").value = cpf;
    document.getElementById("editTelefone").value = telefone;
    document.getElementById("editEmail").value = email;

    modal.classList.add("show");

    setTimeout(() => {
        document.getElementById("editNome").focus();
    }, 100);
}


function fecharModais() {
    document
        .querySelectorAll(".modal")
        .forEach(modal => {
            modal.classList.remove("show");
        });
}


// Fechar clicando fora do modal
document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", function (event) {

        if (event.target === modal) {
            fecharModais();
        }

    });

});


// Fechar com ESC
document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {
        fecharModais();
    }

});


// =========================
// PESQUISA E FILTROS
// =========================

function pesquisarClientes() {

    const campo = document.getElementById("campoPesquisa");
    const campoStatus = document.getElementById("filtroStatus");

    if (!campo) return;

    const pesquisa = campo.value
        .toLowerCase()
        .trim();

    const filtroStatus = campoStatus ? campoStatus.value : "todos";

    const clientes = document.querySelectorAll(
        "#tabelaClientes .cliente-row"
    );

    let encontrados = 0;

    clientes.forEach(cliente => {

        const nome = (
            cliente.dataset.nome || ""
        ).toLowerCase();

        const cpf = (
            cliente.dataset.cpf || ""
        ).toLowerCase();

        const telefone = (
            cliente.dataset.telefone || ""
        ).toLowerCase();

        const email = (
            cliente.dataset.email || ""
        ).toLowerCase();

        const status = (
            cliente.dataset.status || ""
        ).toLowerCase();

        const combinaTexto =
            pesquisa === "" ||
            nome.includes(pesquisa) ||
            cpf.includes(pesquisa) ||
            telefone.includes(pesquisa) ||
            email.includes(pesquisa);

        const combinaStatus =
            filtroStatus === "todos" ||
            status === filtroStatus;

        const encontrou = combinaTexto && combinaStatus;

        if (encontrou) {

            cliente.style.display = "";

            encontrados++;

        } else {

            cliente.style.display = "none";

        }

    });

    atualizarMensagemPesquisa(encontrados, pesquisa, filtroStatus);
}


function atualizarMensagemPesquisa(
    quantidade,
    pesquisa,
    filtroStatus
) {

    const tabela = document.getElementById(
        "tabelaClientes"
    );

    if (!tabela) return;

    let mensagem = document.getElementById(
        "mensagemPesquisa"
    );

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

// =========================
// CONFIRMAÇÕES
// =========================

function confirmarExclusao() {

    return confirm(
        "Tem certeza que deseja excluir este cliente?\n\n" +
        "Essa ação não poderá ser desfeita."
    );
}


function confirmarAcao(acao) {

    if (acao === "desativar") {

        return confirm(
            "Deseja realmente desativar este cliente?"
        );

    }

    return true;
}


// =========================
// MÁSCARA CPF
// =========================

function aplicarMascaraCPF(input) {

    input.addEventListener("input", function () {

        let valor = input.value.replace(/\D/g, "");

        valor = valor.substring(0, 11);

        if (valor.length > 9) {

            valor =
                valor.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
                    "$1.$2.$3-$4"
                );

        } else if (valor.length > 6) {

            valor =
                valor.replace(
                    /(\d{3})(\d{3})(\d{1,3})/,
                    "$1.$2.$3"
                );

        } else if (valor.length > 3) {

            valor =
                valor.replace(
                    /(\d{3})(\d{1,3})/,
                    "$1.$2"
                );

        }

        input.value = valor;

    });

}


// =========================
// MÁSCARA TELEFONE
// =========================

function aplicarMascaraTelefone(input) {

    input.addEventListener("input", function () {

        let valor = input.value.replace(/\D/g, "");

        valor = valor.substring(0, 11);

        if (valor.length > 10) {

            valor =
                valor.replace(
                    /(\d{2})(\d{5})(\d{1,4})/,
                    "($1) $2-$3"
                );

        } else if (valor.length > 6) {

            valor =
                valor.replace(
                    /(\d{2})(\d{4})(\d{1,4})/,
                    "($1) $2-$3"
                );

        } else if (valor.length > 2) {

            valor =
                valor.replace(
                    /(\d{2})(\d{1,5})/,
                    "($1) $2"
                );

        }

        input.value = valor;

    });

}


// =========================
// INICIALIZAÇÃO
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const cpfs = [
        document.getElementById("cpf"),
        document.getElementById("editCpf")
    ];

    cpfs.forEach(input => {

        if (input) {
            aplicarMascaraCPF(input);
        }

    });


    const telefones = [
        document.getElementById("telefone"),
        document.getElementById("editTelefone")
    ];

    telefones.forEach(input => {

        if (input) {
            aplicarMascaraTelefone(input);
        }

    });

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
    if (!clienteDesativarId) {
        return;
    }

    const form = document.getElementById(
        "formDesativar" + clienteDesativarId
    );

    if (form) {
        form.submit();
    }
}