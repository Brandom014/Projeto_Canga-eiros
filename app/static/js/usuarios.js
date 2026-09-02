// =========================
// SIDEBAR
// =========================

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("collapsed");
    }
}

// =========================
// MODAL CRIAR
// =========================

function abrirModalCriar() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");
    const senhaInput = document.getElementById("senha");
    const senhaHelp = document.getElementById("senhaHelp");

    modal.classList.remove("hidden");
    title.innerText = "Novo Usuário";
    form.action = "/usuarios/criar";

    document.getElementById("nome").value = "";
    document.getElementById("email").value = "";
    senhaInput.value = "";
    document.getElementById("role").value = "vendedor";

    senhaInput.required = true;
    if (senhaHelp) senhaHelp.classList.add("hidden");
}

// =========================
// MODAL EDITAR
// =========================

function abrirModalEditar(id, nome, email, role) {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");
    const senhaInput = document.getElementById("senha");
    const senhaHelp = document.getElementById("senhaHelp");

    modal.classList.remove("hidden");
    title.innerText = "Editar Usuário";
    form.action = `/usuarios/editar/${id}`;

    document.getElementById("nome").value = nome;
    document.getElementById("email").value = email;
    senhaInput.value = "";
    document.getElementById("role").value = role;

    senhaInput.required = false;
    if (senhaHelp) senhaHelp.classList.remove("hidden");
}

// =========================
// FECHAR MODAIS
// =========================

function fecharModal() {
    document.getElementById("modal").classList.add("hidden");
}

window.onclick = function (event) {
    const modal = document.getElementById("modal");
    const confirmModal = document.getElementById("confirmModal");

    if (event.target === modal) {
        fecharModal();
    }

    if (event.target === confirmModal) {
        fecharConfirmacao();
    }
};

// =========================
// FILTROS COMBINADOS
// =========================

function filtrarUsuarios() {
    const searchInput = document.getElementById("searchInput");
    const filtroRole = document.getElementById("filtroRole");
    const filtroStatus = document.getElementById("filtroStatus");

    const textFilter = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const roleFilter = filtroRole ? filtroRole.value.toLowerCase() : "todos";
    const statusFilter = filtroStatus ? filtroStatus.value.toLowerCase() : "todos";

    const rows = document.querySelectorAll("tbody tr.user-row");

    rows.forEach(row => {
        const nome = (row.dataset.nome || row.querySelector(".user-name")?.innerText || "").toLowerCase();
        const email = (row.dataset.email || row.children[1]?.innerText || "").toLowerCase();
        const role = (row.dataset.role || "").toLowerCase();
        const status = (row.dataset.status || "").toLowerCase();

        const matchesSearch = textFilter === "" || nome.includes(textFilter) || email.includes(textFilter);
        const matchesRole = roleFilter === "todos" || role === roleFilter;
        const matchesStatus = statusFilter === "todos" || status === statusFilter;

        if (matchesSearch && matchesRole && matchesStatus) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// =========================
// MODAL DE CONFIRMAÇÃO (EXCLUIR & DESATIVAR)
// =========================

let formAcaoAtual = null;

// Mantido para compatibilidade com o HTML existente de exclusão
function abrirConfirmacao(event, form, nomeUsuario) {
    abrirConfirmacaoExcluir(event, form, nomeUsuario);
}

function abrirConfirmacaoExcluir(event, form, nomeUsuario) {
    event.preventDefault();
    formAcaoAtual = form;

    const modal = document.getElementById("confirmModal");

    document.getElementById("confirmTitle").innerText = "Excluir usuário?";
    document.getElementById("confirmText").innerHTML = `Tem certeza que deseja excluir o usuário <strong>${nomeUsuario ? `"${nomeUsuario}"` : 'este usuário'}</strong>?`;
    document.getElementById("confirmWarning").innerText = "Essa ação não poderá ser desfeita.";

    const btnIcon = document.getElementById("confirmBtnIcon");
    const btnText = document.getElementById("confirmBtnText");

    if (btnIcon) btnIcon.className = "fa-solid fa-trash";
    if (btnText) btnText.innerText = "Excluir usuário";

    modal.classList.remove("hidden");
}

function abrirConfirmacaoDesativar(event, form, nomeUsuario) {
    event.preventDefault();
    formAcaoAtual = form;

    const modal = document.getElementById("confirmModal");

    document.getElementById("confirmTitle").innerText = "Desativar usuário?";
    document.getElementById("confirmText").innerHTML = `Tem certeza que deseja desativar o usuário <strong>${nomeUsuario ? `"${nomeUsuario}"` : 'este usuário'}</strong>?`;
    document.getElementById("confirmWarning").innerText = "O usuário perderá o acesso ao sistema até ser reativado.";

    const btnIcon = document.getElementById("confirmBtnIcon");
    const btnText = document.getElementById("confirmBtnText");

    if (btnIcon) btnIcon.className = "fa-solid fa-user-xmark";
    if (btnText) btnText.innerText = "Desativar usuário";

    modal.classList.remove("hidden");
}

function fecharConfirmacao() {
    const modal = document.getElementById("confirmModal");
    modal.classList.add("hidden");
    formAcaoAtual = null;
}

function confirmarAcao() {
    if (formAcaoAtual) {
        formAcaoAtual.submit();
    }
}