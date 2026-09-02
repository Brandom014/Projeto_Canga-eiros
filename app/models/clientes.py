from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cpf = Column(String, unique=True, nullable=False)
    telefone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)