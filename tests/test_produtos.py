
from types import SimpleNamespace
from operator import eq, ne
import asyncio

import pytest
from starlette.requests import Request

from app.routes import produtos


def criar_request():
    return Request({
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/produtos/",
        "raw_path": b"/produtos/",
        "query_string": b"",
        "headers": [],
        "client": ("testclient", 123),
        "server": ("testserver", 80),
    })


class FakeQuery:
    def __init__(self, dados):
        self.dados = dados

    def filter(self, *criterios):
        resultado = self.dados

        for criterio in criterios:
            campo = criterio.left.key
            valor = criterio.right.value

            if criterio.operator == eq:
                resultado = [
                    item for item in resultado
                    if getattr(item, campo) == valor
                ]

            elif criterio.operator == ne:
                resultado = [
                    item for item in resultado
                    if getattr(item, campo) != valor
                ]

        return FakeQuery(resultado)

    def all(self):
        return self.dados

    def first(self):
        return self.dados[0] if self.dados else None


class FakeDB:
    def __init__(self, dados=None):
        self.dados = dados or {
            produtos.Produto: [],
            produtos.Categoria: [],
            produtos.Movimentacao: []
        }

    def query(self, model):
        return FakeQuery(self.dados.get(model, []))

    def add(self, objeto):
        objeto.id = len(self.dados.get(type(objeto), [])) + 1
        self.dados.setdefault(type(objeto), []).append(objeto)

    def commit(self):
        pass

    def refresh(self, objeto):
        pass

    def delete(self, objeto):
        self.dados[type(objeto)].remove(objeto)


@pytest.fixture
def produto():
    return SimpleNamespace(
        id=1,
        nome="Mouse Gamer",
        categoria_id=1,
        preco=100.0,
        estoque=20,
        imagem=None,
        ativo=True
    )


@pytest.fixture
def db(produto):
    return FakeDB({
        produtos.Produto: [produto],
        produtos.Categoria: [
            SimpleNamespace(id=1, nome="Periféricos")
        ],
        produtos.Movimentacao: []
    })


@pytest.fixture
def usuario():
    return SimpleNamespace(
        id=1,
        nome="Administrador",
        role="admin"
    )


def test_listar_produtos(db, usuario):
    response = produtos.pagina_produtos(
        criar_request(),
        db,
        usuario
    )

    assert response.status_code == 200


def test_cadastrar_produto(db, usuario):
    response = asyncio.run(
        produtos.criar_produto(
            nome="Teclado Gamer",
            categoria_id=1,
            preco=150.0,
            estoque=10,
            imagem=None,
            db=db,
            user=usuario
        )
    )

    lista = db.dados[produtos.Produto]
    movimentacoes = db.dados[produtos.Movimentacao]

    assert response.status_code == 303
    assert len(lista) == 2
    assert lista[1].nome == "Teclado Gamer"
    assert len(movimentacoes) == 1
    assert movimentacoes[0].tipo == "Entrada"
    assert movimentacoes[0].quantidade == 10


def delete(self, objeto):
    for lista in self.dados.values():
        if objeto in lista:
            lista.remove(objeto)
            break

    assert response.status_code == 303
    assert len(db.dados[produtos.Produto]) == 0


def test_excluir_produto_inexistente(db, usuario):
    response = produtos.excluir_produto(
        999,
        db,
        usuario
    )

    assert response.status_code == 303
    assert len(db.dados[produtos.Produto]) == 1


def test_editar_produto(db, produto, usuario):
    response = asyncio.run(
        produtos.editar_produto(
            produto.id,
            nome="Mouse Atualizado",
            categoria_id=1,
            preco=120.0,
            estoque=30,
            imagem=None,
            db=db,
            user=usuario
        )
    )

    assert response.status_code == 303
    assert produto.nome == "Mouse Atualizado"
    assert produto.preco == 120.0
    assert produto.estoque == 30


def test_editar_produto_inexistente(db, usuario):
    response = asyncio.run(
        produtos.editar_produto(
            999,
            nome="Produto Novo",
            categoria_id=1,
            preco=50.0,
            estoque=5,
            imagem=None,
            db=db,
            user=usuario
        )
    )

    assert response.status_code == 303
    assert len(db.dados[produtos.Produto]) == 1
