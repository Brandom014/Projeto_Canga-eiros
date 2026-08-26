from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from datetime import datetime
from app.database import Base
from sqlalchemy.orm import relationship

class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True)

    total = Column(Float, nullable=False)

    forma_pagamento = Column(
        String,
        nullable=False,
        default="Dinheiro"
    )

    cliente = Column(String, nullable=True)

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id")
    )

    data = Column(
        DateTime,
        default=datetime.utcnow
    )

    usuario = relationship("Usuario")