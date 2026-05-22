from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer)
    tipo = Column(String)  # entrada ou saida
    quantidade = Column(Integer)
    data = Column(DateTime, default=datetime.utcnow)