from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime
from app.database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    tipo = Column(String, nullable=False)
    quantidade = Column(Integer, nullable=False)
    valor = Column(Float)
    observacao = Column(String)
    data = Column(DateTime, default=datetime.utcnow)

    produto = relationship("Produto")
    usuario = relationship("Usuario")