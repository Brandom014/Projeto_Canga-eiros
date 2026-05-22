from sqlalchemy import Column, Integer, Float
from app.database import Base

class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer)
    produto_id = Column(Integer)
    quantidade = Column(Integer)
    subtotal = Column(Float)