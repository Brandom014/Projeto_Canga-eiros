
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.vendas import Venda
from app.models.usuarios import Usuario

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

Base.metadata.create_all(bind=engine)


@pytest.fixture
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()


# TESTE 1 - Cadastrar uma venda
def test_criar_venda(db):
    venda = Venda(
        total=150.00,
        forma_pagamento="Dinheiro",
        cliente="João",
        usuario_id=1
    )

    db.add(venda)
    db.commit()
    db.refresh(venda)

    assert venda.id is not None
    assert venda.total == 150.00
    assert venda.cliente == "João"


# TESTE 2 - Listar vendas
def test_listar_vendas(db):
    venda1 = Venda(
        total=100.00,
        forma_pagamento="Pix",
        cliente="Maria",
        usuario_id=1
    )

    venda2 = Venda(
        total=200.00,
        forma_pagamento="Cartão",
        cliente="Pedro",
        usuario_id=1
    )

    db.add_all([venda1, venda2])
    db.commit()

    vendas = db.query(Venda).all()

    assert len(vendas) == 2


# TESTE 3 - Buscar venda pelo ID
def test_buscar_venda(db):
    venda = Venda(
        total=250.00,
        forma_pagamento="Pix",
        cliente="Carlos",
        usuario_id=1
    )

    db.add(venda)
    db.commit()
    db.refresh(venda)

    resultado = db.query(Venda).filter(
        Venda.id == venda.id
    ).first()

    assert resultado is not None
    assert resultado.total == 250.00


# TESTE 4 - Atualizar venda
def test_atualizar_venda(db):
    venda = Venda(
        total=100.00,
        forma_pagamento="Dinheiro",
        cliente="Ana",
        usuario_id=1
    )

    db.add(venda)
    db.commit()

    venda.total = 300.00
    venda.forma_pagamento = "Pix"

    db.commit()
    db.refresh(venda)

    assert venda.total == 300.00
    assert venda.forma_pagamento == "Pix"


# TESTE 5 - Excluir venda
def test_excluir_venda(db):
    venda = Venda(
        total=180.00,
        forma_pagamento="Cartão",
        cliente="Lucas",
        usuario_id=1
    )

    db.add(venda)
    db.commit()

    venda_id = venda.id

    db.delete(venda)
    db.commit()

    resultado = db.query(Venda).filter(
        Venda.id == venda_id
    ).first()

    assert resultado is None


# TESTE 6 - Verificar data automática
def test_data_automatica(db):
    venda = Venda(
        total=90.00,
        forma_pagamento="Dinheiro",
        usuario_id=1
    )

    db.add(venda)
    db.commit()
    db.refresh(venda)

    assert venda.data is not None
