function toggleSidebar() {
    document.getElementById("sidebar").classList.toggle("collapsed");
}

async function carregarMovimentacoes() {

    try {

        const response = await fetch('/api/movimentacoes');
        const movimentacoes = await response.json();
        let entradas = 0;
        let saidas = 0;
        let valorTotal = 0;

        const hoje = new Date().toLocaleDateString("pt-BR");
        let movimentacoesHoje = 0;

        const tabela = document.getElementById('tabelaMovimentacoes');

        tabela.innerHTML = '';

        movimentacoes.forEach(mov => {

            if (mov.tipo === "Entrada") {
                entradas++;
            }

            if (mov.tipo === "Saída") {
                saidas++;
            }

            valorTotal += Number(mov.valor || 0);

            const dataMov = new Date(mov.data)
                .toLocaleDateString("pt-BR");

            if (dataMov === hoje) {
                movimentacoesHoje++;
            }

            tabela.innerHTML += `
                <tr>
                    <td>${mov.id}</td>
                    <td>
                        <span class="${
                            mov.tipo === 'Entrada'
                            ? 'tipo-entrada'
                            : 'tipo-saida'
                        }">
                            ${mov.tipo}
                        </span>
                    </td>
                    <td>${mov.produto}</td>
                    <td>${mov.quantidade}</td>
                    <td>R$ ${mov.valor || 0}</td>
                    <td>${mov.usuario}</td>
                    <td>${new Date(mov.data).toLocaleString()}</td>
                    <td>${mov.observacao || '-'}</td>
                </tr>
            `;
        });

        movimentacoes.forEach(mov => {

    // seu código...

});

/* ADICIONE AQUI */

    document.getElementById("totalEntradas").textContent = entradas;
    document.getElementById("totalSaidas").textContent = saidas;
    document.getElementById("movHoje").textContent = movimentacoesHoje;
    document.getElementById("valorMov").textContent =
        valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });

    } catch(error) {
        console.error(error);
    }

}

carregarMovimentacoes();

document
    .getElementById("busca")
    .addEventListener("input", filtrarMovimentacoes);

document
    .getElementById("tipo")
    .addEventListener("change", filtrarMovimentacoes);

document
    .getElementById("data")
    .addEventListener("change", filtrarMovimentacoes);

function filtrarMovimentacoes() {

    const busca = document
        .getElementById("busca")
        .value
        .toLowerCase();

    const tipo = document
        .getElementById("tipo")
        .value;

    const linhas = document.querySelectorAll(
        "#tabelaMovimentacoes tr"
    );

    linhas.forEach(linha => {

        const textoLinha =
            linha.textContent.toLowerCase();

        const tipoLinha =
            linha.children[1].textContent.trim();

        const passaBusca =
            textoLinha.includes(busca);

        const passaTipo =
            tipo === "" ||
            tipoLinha === tipo;

        linha.style.display =
            passaBusca && passaTipo
            ? ""
            : "none";

    });
}