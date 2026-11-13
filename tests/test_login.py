import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from passlib.context import CryptContext

from app.main import app
from app.database import Base, get_db
from app.models.usuarios import Usuario

# Configuração de banco de dados em memória para testes isolados
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@pytest.fixture(autouse=True)
def setup_database():
    """Reseta o banco de dados antes de cada teste."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def test_tela_login_get():
    """Verifica se a página de login carrega corretamente (Status 200)."""
    response = client.get("/auth/login")
    assert response.status_code == 200


def test_login_sucesso():
    """Verifica se um usuário cadastrado consegue fazer login com sucesso."""
    db = TestingSessionLocal()
    
    # Cria um usuário válido no banco de teste
    senha_hash = pwd_context.hash("123456")
    user = Usuario(
        nome="Administrador SENAI",
        email="admin@senai.com",
        senha=senha_hash,
        role="admin",
        ativo=True
    )
    db.add(user)
    db.commit()
    db.close()

    # Envia os dados via POST (Simulando o formulário)
    response = client.post(
        "/auth/login",
        data={"email": "admin@senai.com", "senha": "123456"},
        follow_redirects=False
    )

    # Deve redirecionar para o dashboard (status 303) e criar o cookie de autenticação
    assert response.status_code == 303
    assert response.headers["location"] == "/dashboard"
    assert "access_token" in response.cookies


def test_login_usuario_nao_encontrado():
    """Verifica o comportamento ao tentar logar com um e-mail que não existe."""
    response = client.post(
        "/auth/login",
        data={"email": "inexistente@senai.com", "senha": "123456"},
        follow_redirects=False
    )
    assert response.status_code == 200
    assert "Usuário não encontrado" in response.text


def test_login_senha_incorreta():
    """Verifica se a senha incorreta retorna a mensagem de erro na tela de login."""
    db = TestingSessionLocal()
    
    senha_hash = pwd_context.hash("123456")
    user = Usuario(
        nome="Administrador SENAI",
        email="admin@senai.com",
        senha=senha_hash,
        role="admin",
        ativo=True
    )
    db.add(user)
    db.commit()
    db.close()

    response = client.post(
        "/auth/login",
        data={"email": "admin@senai.com", "senha": "senhaerrada"},
        follow_redirects=False
    )
    
    assert response.status_code == 200
    assert "Senha inválida" in response.text


def test_logout():
    """Verifica se a rota de logout limpa o cookie e redireciona para o login."""
    response = client.get("/auth/logout", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/auth/login"