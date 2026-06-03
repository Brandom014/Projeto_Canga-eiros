// =========================
// SIDEBAR
// =========================

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
}

// =========================
// MODAL CRIAR
// =========================

function abrirModalCriar() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");

    modal.classList.remove("hidden");

    title.innerText = "Criar Usuário";

    form.action = "/usuarios/criar";

    document.getElementById("nome").value = "";
    document.getElementById("email").value = "";
    document.getElementById("senha").value = "";
    document.getElementById("role").value = "vendedor";
}

// =========================
// MODAL EDITAR
// =========================

function abrirModalEditar(id, nome, email, role) {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");

    modal.classList.remove("hidden");

    title.innerText = "Editar Usuário";

    form.action = `/usuarios/editar/${id}`;

    document.getElementById("nome").value = nome;
    document.getElementById("email").value = email;
    document.getElementById("senha").value = "";
    document.getElementById("role").value = role;
}

// =========================
// FECHAR MODAL
// =========================

function fecharModal() {
    document.getElementById("modal").classList.add("hidden");
}

// fechar clicando fora
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
// BUSCA
// =========================

function filtrarUsuarios() {
    const input = document.getElementById("searchInput");
    const filter = input.value.toLowerCase();

    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const nome = row.querySelector(".user-name")?.innerText.toLowerCase();
        const email = row.children[1]?.innerText.toLowerCase();

        if (nome.includes(filter) || email.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// =========================
// DELETE MODAL (SEM CONFIRM FEIO)
// =========================

let formDeleteAtual = null;

function abrirConfirmacao(event, form) {
    event.preventDefault();
    formDeleteAtual = form;

    document.getElementById("confirmModal")
        .classList.remove("hidden");
}

function fecharConfirmacao() {
    document.getElementById("confirmModal")
        .classList.add("hidden");

    formDeleteAtual = null;
}

function confirmarDelete() {
    if (formDeleteAtual) {
        formDeleteAtual.submit();
    }
}