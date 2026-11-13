
from types import SimpleNamespace
from operator import eq, ne

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.routes import usuarios


def criar_request():
    return Request({
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/usuarios/",
        "raw_path": b"/usuarios/",
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

    def first(self):
        return self.dados[0] if self.dados else None

    def all(self):
        return self.dados


class FakeDB:
    def __init__(self, dados=None):
        self.dados = dados or []

    def query(self, model):
        return FakeQuery(self.dados)

    def add(self, usuario):
        usuario.id = len(self.dados) + 1
        self.dados.append(usuario)

    def commit(self):
        pass

    def refresh(self, usuario):
        pass

    def delete(self, usuario):
        self.dados.remove(usuario)


@pytest.fixture
def usuario():
    return SimpleNamespace(
        id=1,
        nome="Usuário Teste",
        email="teste@senai.com",
        senha="senha_hash",
        role="admin",
        ativo=True,
        foto_perfil=None
    )


@pytest.fixture
def db(usuario):
    return FakeDB([usuario])


def test_listar_usuarios(db):
    response = usuarios.pagina_usuarios(
        criar_request(),
        db,
        SimpleNamespace(role="admin")
    )

    assert response.status_code == 200


def test_acesso_negado_lista_usuarios(db):
    response = usuarios.pagina_usuarios(
        criar_request(),
        db,
        SimpleNamespace(role="vendedor")
    )

    assert response.status_code == 303
    assert "/dashboard?erro=acesso_negado" in response.headers["location"]


def test_cadastrar_usuario(db, monkeypatch):
    monkeypatch.setattr(
        usuarios,
        "hash_senha",
        lambda senha: "senha_criptografada"
    )

    response = usuarios.criar_usuario(
        "Novo Usuário",
        "novo@senai.com",
        "123456",
        "vendedor",
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert len(db.dados) == 2
    assert db.dados[1].email == "novo@senai.com"
    assert db.dados[1].senha == "senha_criptografada"


def test_cadastrar_email_existente(db):
    with pytest.raises(HTTPException) as erro:
        usuarios.criar_usuario(
            "Outro Usuário",
            "teste@senai.com",
            "123456",
            "vendedor",
            db,
            admin=SimpleNamespace(role="admin")
        )

    assert erro.value.status_code == 400
    assert erro.value.detail == "Email já cadastrado"


def test_editar_usuario(db, usuario):
    response = usuarios.editar_usuario(
        usuario.id,
        "Nome Atualizado",
        "atualizado@senai.com",
        "vendedor",
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert usuario.nome == "Nome Atualizado"
    assert usuario.email == "atualizado@senai.com"
    assert usuario.role == "vendedor"


def test_editar_usuario_inexistente(db):
    with pytest.raises(HTTPException) as erro:
        usuarios.editar_usuario(
            999,
            "Nome",
            "novo@senai.com",
            "vendedor",
            db,
            admin=SimpleNamespace(role="admin")
        )

    assert erro.value.status_code == 404


def test_alterar_senha(db, usuario, monkeypatch):
    monkeypatch.setattr(
        usuarios,
        "hash_senha",
        lambda senha: "nova_senha_hash"
    )

    response = usuarios.alterar_senha(
        usuario.id,
        "nova_senha",
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert usuario.senha == "nova_senha_hash"


def test_desativar_usuario(db, usuario):
    response = usuarios.desativar_usuario(
        usuario.id,
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert usuario.ativo is False


def test_ativar_usuario(db, usuario):
    usuario.ativo = False

    response = usuarios.ativar_usuario(
        usuario.id,
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert usuario.ativo is True


def test_excluir_usuario(db, usuario):
    response = usuarios.excluir_usuario(
        usuario.id,
        db,
        admin=SimpleNamespace(role="admin")
    )

    assert response.status_code == 303
    assert len(db.dados) == 0


def test_excluir_usuario_inexistente(db):
    with pytest.raises(HTTPException) as erro:
        usuarios.excluir_usuario(
            999,
            db,
            admin=SimpleNamespace(role="admin")
        )

    assert erro.value.status_code == 404
