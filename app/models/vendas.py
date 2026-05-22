from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime
from app.database import Base

class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)
    total = Column(Float, nullable=False)
    data = Column(DateTime, default=datetime.utcnow)