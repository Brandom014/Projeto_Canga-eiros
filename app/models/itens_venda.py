from sqlalchemy import Column, Integer, Float, ForeignKey
from app.database import Base

class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id = Column(Integer, primary_key=True)

    venda_id = Column(
        Integer,
        ForeignKey("vendas.id")
    )

    produto_id = Column(
        Integer,
        ForeignKey("produtos.id")
    )

    quantidade = Column(
        Integer,
        default=1
    )

    preco = Column(
        Float,
        nullable=False
    )