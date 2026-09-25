from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import csv
import io
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
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
    # Traz as vendas ordenadas e carrega o relacionamento de itens de uma só vez
    query = db.query(Venda).order_by(Venda.id.desc())
    vendas_todas = query.all()

    # Filtro por Forma de Pagamento
    if pagamento:
        vendas_todas = [
            v for v in vendas_todas
            if (v.forma_pagamento or "").lower() == pagamento.lower()
        ]

    # Filtro por Data (YYYY-MM-DD)
    if data:
        vendas_todas = [
            v for v in vendas_todas
            if v.data and v.data.strftime("%Y-%m-%d") == data
        ]

    # Filtro por Busca (ID, Cliente ou Vendedor)
    if busca:
        termo = busca.lower()
        vendas_todas = [
            v for v in vendas_todas
            if termo in str(v.id).lower()
            or termo in (v.cliente or "").lower()
            or (v.usuario and termo in v.usuario.nome.lower())
        ]

    # Totais dos Cards
    faturamento = sum((v.total or 0) for v in vendas_todas)
    total_vendas = len(vendas_todas)
    ticket_medio = (faturamento / total_vendas) if total_vendas > 0 else 0.0

    venda_ids = [v.id for v in vendas_todas]

    # Consulta unificada dos itens para evitar o problema de N+1 consultas
    itens_filtrados = (
        db.query(ItemVenda)
        .filter(ItemVenda.venda_id.in_(venda_ids))
        .all() if venda_ids else []
    )

    produtos_vendidos = sum(item.quantidade for item in itens_filtrados)

    # Mapeia a quantidade de itens por venda
    qtd_itens_por_venda = {}
    for item in itens_filtrados:
        qtd_itens_por_venda[item.venda_id] = qtd_itens_por_venda.get(item.venda_id, 0) + item.quantidade

    # Top 5 Produtos Mais Vendidos
    produtos_top = (
        db.query(Produto.nome, func.sum(ItemVenda.quantidade).label("quantidade"))
        .join(ItemVenda, Produto.id == ItemVenda.produto_id)
        .filter(ItemVenda.venda_id.in_(venda_ids))
        .group_by(Produto.nome)
        .order_by(func.sum(ItemVenda.quantidade).desc())
        .limit(5)
        .all() if venda_ids else []
    )

    return {
        "faturamento": faturamento,
        "total_vendas": total_vendas,
        "ticket_medio": round(ticket_medio, 2),
        "produtos_vendidos": produtos_vendidos,
        "top_produtos": [
            {
                "nome": p.nome,
                "quantidade": p.quantidade
            } for p in produtos_top
        ],
        "vendas": [
            {
                "id": v.id,
                "data": v.data.strftime("%d/%m/%Y %H:%M") if v.data else "Data N/A",
                "cliente": v.cliente or "Consumidor Final",
                "usuario": v.usuario.nome if getattr(v, "usuario", None) else "Sistema",
                "itens": qtd_itens_por_venda.get(v.id, 0),
                "pagamento": (v.forma_pagamento or "N/I").upper(),
                "total": v.total or 0.0,
            } for v in vendas_todas
        ],
    }


@router.get("/exportar")
def exportar_relatorio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    vendas = db.query(Venda).order_by(Venda.id.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Venda", "Data", "Cliente", "Usuário", "Pagamento", "Total"])
    
    for venda in vendas:
        writer.writerow([
            venda.id,
            venda.data.strftime("%d/%m/%Y %H:%M") if venda.data else "N/A",
            venda.cliente or "Consumidor Final",
            venda.usuario.nome if getattr(venda, "usuario", None) else "Sistema",
            (venda.forma_pagamento or "").upper(),
            f"{(venda.total or 0):.2f}",
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=relatorio-vendas.csv"
        },
    )