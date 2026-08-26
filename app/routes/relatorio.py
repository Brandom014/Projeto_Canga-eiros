from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.models.produtos import Produto
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/api/relatorio",
    tags=["Relatório"]
)

@router.get("/")
def obter_relatorio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    busca: str = Query(""),
    data: str = Query(""),
    pagamento: str = Query(""),
):
    vendas = db.query(Venda).order_by(Venda.data.desc()).all()

    if pagamento:
        vendas = [
            venda for venda in vendas
            if (venda.forma_pagamento or "").lower() == pagamento.lower()
        ]

    if data:
        vendas = [
            venda for venda in vendas
            if venda.data and venda.data.strftime("%Y-%m-%d") == data
        ]

    if busca:
        termo = busca.lower()
        vendas = [
            venda for venda in vendas
            if termo in str(venda.id).lower()
            or termo in (venda.cliente or "").lower()
            or termo in (
                venda.usuario.nome.lower()
                if venda.usuario else ""
            )
        ]

    faturamento = sum(v.total for v in vendas)

    total_vendas = len(vendas)

    ticket_medio = (
        faturamento / total_vendas
        if total_vendas > 0 else 0
    )

    venda_ids = [venda.id for venda in vendas]
    itens_filtrados = (
        db.query(ItemVenda)
        .filter(ItemVenda.venda_id.in_(venda_ids))
        .all()
        if venda_ids else []
    )

    produtos_vendidos = sum(
        item.quantidade for item in itens_filtrados
    )

    produtos_top = (
        db.query(Produto.nome, func.sum(ItemVenda.quantidade).label("quantidade"))
        .join(ItemVenda, Produto.id == ItemVenda.produto_id)
        .filter(ItemVenda.venda_id.in_(venda_ids))
        .group_by(Produto.nome)
        .order_by(func.sum(ItemVenda.quantidade).desc())
        .limit(5)
        .all()
        if venda_ids else []
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
                "data": venda.data.isoformat() if venda.data else None,
                "cliente": venda.cliente,
                "usuario": venda.usuario.nome if venda.usuario else None,
                "itens": sum(
                    item.quantidade
                    for item in db.query(ItemVenda)
                    .filter(ItemVenda.venda_id == venda.id)
                    .all()
                ),
                "pagamento": venda.forma_pagamento,
                "total": venda.total,
            }
            for venda in vendas
        ],
    }


@router.get("/exportar")
def exportar_relatorio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    vendas = db.query(Venda).order_by(Venda.data.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Venda", "Data", "Cliente", "Usuário", "Pagamento", "Total"])
    for venda in vendas:
        writer.writerow([
            venda.id,
            venda.data.strftime("%d/%m/%Y %H:%M") if venda.data else "",
            venda.cliente or "",
            venda.usuario.nome if venda.usuario else "",
            venda.forma_pagamento or "",
            f"{venda.total:.2f}",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=relatorio-vendas.csv"
        },
    )