from sqlalchemy import Column, Integer, Float, DateTime, String
from datetime import datetime
from app.database import Base

class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)

    total = Column(Float, nullable=False)

    forma_pagamento = Column(
        String,
        nullable=False,
        default="Dinheiro"
    )

    data = Column(
        DateTime,
        default=datetime.utcnow
    )