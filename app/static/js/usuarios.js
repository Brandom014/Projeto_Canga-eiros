// ==========================================
// ESTADO GLOBAL & CONFIGURAÇÕES
// ==========================================
let formAcaoAtual = null;
let paginaAtual = 1;
const itensPorPagina = 1; // Ajuste para a quantidade desejada de itens por página

// ==========================================
// SIDEBAR
// ==========================================
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("collapsed");
    }
}

// ==========================================
// MODAL DE USUÁRIO (CRIAR / EDITAR)
// ==========================================
function abrirModalCriar() {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");
    const senhaInput = document.getElementById("senha");
    const senhaHelp = document.getElementById("senhaHelp");

    if (!modal || !form) return;

    modal.classList.remove("hidden");
    if (title) title.innerText = "Novo Usuário";
    form.action = "/usuarios/criar";

    const nome = document.getElementById("nome");
    const email = document.getElementById("email");
    const role = document.getElementById("role");

    if (nome) nome.value = "";
    if (email) email.value = "";
    if (role) role.value = "vendedor";

    if (senhaInput) {
        senhaInput.value = "";
        senhaInput.required = true;
    }
    if (senhaHelp) senhaHelp.classList.add("hidden");
}

function abrirModalEditar(id, nome, email, role) {
    const modal = document.getElementById("modal");
    const form = document.getElementById("modalForm");
    const title = document.getElementById("modalTitle");
    const senhaInput = document.getElementById("senha");
    const senhaHelp = document.getElementById("senhaHelp");

    if (!modal || !form) return;

    modal.classList.remove("hidden");
    if (title) title.innerText = "Editar Usuário";
    form.action = `/usuarios/editar/${id}`;

    const nomeInput = document.getElementById("nome");
    const emailInput = document.getElementById("email");
    const roleInput = document.getElementById("role");

    if (nomeInput) nomeInput.value = nome;
    if (emailInput) emailInput.value = email;
    if (roleInput) roleInput.value = role;

    if (senhaInput) {
        senhaInput.value = "";
        senhaInput.required = false;
    }
    if (senhaHelp) senhaHelp.classList.remove("hidden");
}

function fecharModal() {
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
}

// ==========================================
// MODAIS DE CONFIRMAÇÃO (EXCLUIR & DESATIVAR)
// ==========================================
function abrirConfirmacao(event, form, nomeUsuario) {
    abrirConfirmacaoExcluir(event, form, nomeUsuario);
}

function abrirConfirmacaoExcluir(event, form, nomeUsuario) {
    if (event) event.preventDefault();
    formAcaoAtual = form;

    const modal = document.getElementById("confirmModal");
    if (!modal) return;

    const title = document.getElementById("confirmTitle");
    const text = document.getElementById("confirmText");
    const warning = document.getElementById("confirmWarning");
    const btnIcon = document.getElementById("confirmBtnIcon");
    const btnText = document.getElementById("confirmBtnText");

    if (title) title.innerText = "Excluir usuário?";
    if (text) text.innerHTML = `Tem certeza que deseja excluir o usuário <strong>${nomeUsuario ? `"${nomeUsuario}"` : 'este usuário'}</strong>?`;
    if (warning) warning.innerText = "Essa ação não poderá ser desfeita.";

    if (btnIcon) btnIcon.className = "fa-solid fa-trash";
    if (btnText) btnText.innerText = "Excluir usuário";

    modal.classList.remove("hidden");
}

function abrirConfirmacaoDesativar(event, form, nomeUsuario) {
    if (event) event.preventDefault();
    formAcaoAtual = form;

    const modal = document.getElementById("confirmModal");
    if (!modal) return;

    const title = document.getElementById("confirmTitle");
    const text = document.getElementById("confirmText");
    const warning = document.getElementById("confirmWarning");
    const btnIcon = document.getElementById("confirmBtnIcon");
    const btnText = document.getElementById("confirmBtnText");

    if (title) title.innerText = "Desativar usuário?";
    if (text) text.innerHTML = `Tem certeza que deseja desativar o usuário <strong>${nomeUsuario ? `"${nomeUsuario}"` : 'este usuário'}</strong>?`;
    if (warning) warning.innerText = "O usuário perderá o acesso ao sistema até ser reativado.";

    if (btnIcon) btnIcon.className = "fa-solid fa-user-xmark";
    if (btnText) btnText.innerText = "Desativar usuário";

    modal.classList.remove("hidden");
}

function fecharConfirmacao() {
    const modal = document.getElementById("confirmModal");
    if (modal) modal.classList.add("hidden");
    formAcaoAtual = null;
}

function confirmarAcao() {
    if (formAcaoAtual) {
        formAcaoAtual.submit();
    }
}

// Fechar modais ao clicar no overlay escuro
window.onclick = function (event) {
    const modal = document.getElementById("modal");
    const confirmModal = document.getElementById("confirmModal");

    if (event.target === modal) fecharModal();
    if (event.target === confirmModal) fecharConfirmacao();
};

// ==========================================
// FILTROS COMBINADOS & PAGINAÇÃO
// ==========================================
function obterLinhasFiltradas() {
    const searchInput = document.getElementById("searchInput");
    const filtroRole = document.getElementById("filtroRole");
    const filtroStatus = document.getElementById("filtroStatus");

    const textFilter = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const roleFilter = filtroRole ? filtroRole.value.toLowerCase() : "todos";
    const statusFilter = filtroStatus ? filtroStatus.value.toLowerCase() : "todos";

    const rows = Array.from(document.querySelectorAll("tbody tr.user-row"));

    return rows.filter(row => {
        const nome = (row.dataset.nome || row.querySelector(".user-name")?.innerText || "").toLowerCase();
        const email = (row.dataset.email || row.children[1]?.innerText || "").toLowerCase();
        const role = (row.dataset.role || "").toLowerCase();
        const status = (row.dataset.status || "").toLowerCase();

        const matchesSearch = textFilter === "" || nome.includes(textFilter) || email.includes(textFilter);
        const matchesRole = roleFilter === "todos" || role === roleFilter;
        const matchesStatus = statusFilter === "todos" || status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });
}

function aplicarPaginacao(linhasVisiveis) {
    const allRows = document.querySelectorAll("tbody tr.user-row");
    allRows.forEach(row => (row.style.display = "none"));

    const totalItens = linhasVisiveis.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;

    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    if (paginaAtual < 1) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    const itensPaginaAtual = linhasVisiveis.slice(inicio, fim);
    itensPaginaAtual.forEach(row => (row.style.display = ""));

    // Atualizar texto informativo
    const pageInfo = document.getElementById("pageInfo");
    if (pageInfo) {
        pageInfo.innerText = `Página ${paginaAtual} de ${totalPaginas}`;
    }

    // Atualizar estado ativo/desativado dos botões
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    if (btnPrev) {
        btnPrev.disabled = (paginaAtual <= 1);
    }
    if (btnNext) {
        btnNext.disabled = (paginaAtual >= totalPaginas || totalItens === 0);
    }
}

function filtrarUsuarios() {
    paginaAtual = 1; // Reseta para a primeira página ao filtrar
    const linhasFiltradas = obterLinhasFiltradas();
    aplicarPaginacao(linhasFiltradas);
}

function mudarPagina(direcao) {
    const linhasFiltradas = obterLinhasFiltradas();
    const totalPaginas = Math.ceil(linhasFiltradas.length / itensPorPagina) || 1;
    const novaPagina = paginaAtual + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        aplicarPaginacao(linhasFiltradas);
    }
}

// Inicializar estado da tabela ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    filtrarUsuarios();
});