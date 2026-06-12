from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.models.produtos import Produto

router = APIRouter(
    prefix="/api/relatorio",
    tags=["Relatório"]
)

@router.get("/")
def obter_relatorio(
    db: Session = Depends(get_db)
):

    vendas = db.query(Venda).all()

    faturamento = sum(v.total for v in vendas)

    total_vendas = len(vendas)

    ticket_medio = (
        faturamento / total_vendas
        if total_vendas > 0 else 0
    )

    produtos_vendidos = (
        db.query(
            func.sum(ItemVenda.quantidade)
        ).scalar() or 0
    )

    produtos_top = (
        db.query(
            Produto.nome,
            func.sum(ItemVenda.quantidade).label("quantidade")
        )
        .join(
            ItemVenda,
            Produto.id == ItemVenda.produto_id
        )
        .group_by(Produto.nome)
        .order_by(
            func.sum(ItemVenda.quantidade).desc()
        )
        .limit(5)
        .all()
    )

    return {
        "faturamento": faturamento,
        "total_vendas": total_vendas,
        "ticket_medio": round(ticket_medio, 2),
        "produtos_vendidos": produtos_vendidos,

        "top_produtos": [
            {
                "nome": produto.nome,
                "quantidade": produto.quantidade
            }
            for produto in produtos_top
        ],

        "vendas": [
            {
                "id": venda.id,
                "data": venda.data.strftime("%d/%m/%Y %H:%M"),
                "pagamento": venda.forma_pagamento,
                "total": venda.total
            }
            for venda in vendas
        ]
    }