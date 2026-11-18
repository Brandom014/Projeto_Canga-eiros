
import pytest
from types import SimpleNamespace
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.dependencies import get_current_user

from app.models.produtos import Produto
from app.models.categoria import Categoria
from app.models.movimentacoes import Movimentacao
from app.models import usuarios


# Configuração do banco de dados em memória
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# Preparação do banco
@pytest.fixture
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


# Configuração do cliente de testes
@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    app.dependency_overrides[get_current_user] = (
        lambda: SimpleNamespace(id=1)
    )

    with TestClient(
        app,
        follow_redirects=False,
        raise_server_exceptions=False
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()


# Função auxiliar para criar produto
def criar_produto_teste(db):
    produto = Produto(
        nome="Produto Teste",
        preco=50.00,
        estoque=10,
        ativo=True
    )

    db.add(produto)
    db.commit()
    db.refresh(produto)

    return produto


# TESTE 1 - Acessar página de estoque
def test_listar_estoque(client):
    response = client.get("/estoque/")

    assert response.status_code == 200


# TESTE 2 - Criar produto
def test_criar_produto(client, db):
    response = client.post(
        "/estoque/criar",
        data={
            "nome": "Teclado",
            "preco": "100",
            "estoque": "20"
        }
    )

    assert response.status_code == 303

    produto = db.query(Produto).filter(
        Produto.nome == "Teclado"
    ).first()

    assert produto is not None
    assert produto.preco == 100
    assert produto.estoque == 20


# TESTE 3 - Não permitir estoque negativo
def test_criar_produto_estoque_negativo(client):
    response = client.post(
        "/estoque/criar",
        data={
            "nome": "Mouse",
            "preco": "50",
            "estoque": "-5"
        }
    )

    assert response.status_code == 400


# TESTE 4 - Editar produto
def test_editar_produto(client, db):
    produto = criar_produto_teste(db)

    response = client.post(
        f"/estoque/editar/{produto.id}",
        data={
            "nome": "Produto Atualizado",
            "preco": "80",
            "estoque": "15"
        }
    )

    assert response.status_code == 303

    db.refresh(produto)

    assert produto.nome == "Produto Atualizado"
    assert produto.preco == 80
    assert produto.estoque == 15


# TESTE 5 - Atualizar quantidade do estoque
def test_atualizar_estoque(client, db):
    produto = criar_produto_teste(db)

    response = client.post(
        f"/estoque/atualizar/{produto.id}",
        data={
            "estoque": "30"
        }
    )

    assert response.status_code == 303

    db.refresh(produto)

    assert produto.estoque == 30


# TESTE 6 - Ativar e desativar produto
def test_toggle_produto(client, db):
    produto = criar_produto_teste(db)

    response = client.post(
        f"/estoque/toggle/{produto.id}"
    )

    assert response.status_code == 303

    db.refresh(produto)

    assert produto.ativo is False


# TESTE 7 - Excluir produto
def test_excluir_produto(client, db):
    produto = criar_produto_teste(db)
    produto_id = produto.id

    response = client.post(
        f"/estoque/excluir/{produto_id}" 
    )

    assert response.status_code == 303

    resultado = db.query(Produto).filter(
        Produto.id == produto_id
    ).first()

    assert resultado is None
