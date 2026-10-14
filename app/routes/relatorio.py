import csv
import io
import json
import math
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.itens_venda import ItemVenda
from app.models.produtos import Produto
from app.models.vendas import Venda

router = APIRouter(
    prefix="/api/relatorio",
    tags=["Relatório"]
)

def processar_pagamentos_venda(forma_raw: str, total_venda: float):
    """
    Converte o campo forma_pagamento (seja JSON ou texto simples)
    num texto formatado para a tabela e num array estruturado de pagamentos.
    """
    if not forma_raw:
        return "N/I", [{"tipo": "dinheiro", "nome": "Dinheiro", "valor": total_venda}]

    texto_raw = str(forma_raw).strip()
    
    # Se for um JSON de múltiplos pagamentos
    if texto_raw.startswith("[") or texto_raw.startswith("{"):
        try:
            parsed = json.loads(texto_raw)
            if isinstance(parsed, list) and len(parsed) > 0:
                pagamentos_formatados = []
                for item in parsed:
                    tipo = item.get("tipo") or item.get("TIPO") or item.get("nome") or item.get("NOME") or "Pagamento"
                    valor = float(item.get("valor") if item.get("valor") is not None else (item.get("VALOR") or 0))
                    pagamentos_formatados.append({
                        "tipo": tipo,
                        "nome": tipo,
                        "valor": valor
                    })
                
                if len(pagamentos_formatados) > 1:
                    texto_exibicao = f"MÚLTIPLO ({len(pagamentos_formatados)})"
                else:
                    texto_exibicao = str(pagamentos_formatados[0]["tipo"]).upper()
                    
                return texto_exibicao, pagamentos_formatados
        except Exception:
            pass

    # Se for texto simples (ex: "dinheiro", "debito")
    return texto_raw.upper(), [{"tipo": texto_raw, "nome": texto_raw, "valor": total_venda}]


@router.get("/")
def obter_relatorio(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
    busca: str = Query(""),
    data: str = Query(""),
    pagamento: str = Query(""),
    pagina: int = Query(1, ge=1),
    limite: int = Query(10, ge=1),
):
    # Traz as vendas ordenadas
    query = db.query(Venda).options(joinedload(Venda.usuario)).order_by(Venda.id.desc())
    vendas_todas = query.all()

    # Filtro por Forma de Pagamento
    if pagamento:
        termo_pag = pagamento.lower()
        vendas_todas = [
            v for v in vendas_todas
            if termo_pag in (v.forma_pagamento or "").lower()
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
            or (getattr(v, "usuario", None) and termo in v.usuario.nome.lower())
        ]

    # Totais dos Cards
    faturamento = sum((v.total or 0) for v in vendas_todas)
    total_vendas = len(vendas_todas)
    ticket_medio = (faturamento / total_vendas) if total_vendas > 0 else 0.0

    venda_ids = [v.id for v in vendas_todas]

    # Consulta unificada dos itens
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

    # --- CÁLCULO DA PAGINAÇÃO ---
    total_registros = total_vendas
    total_paginas = math.ceil(total_registros / limite) if total_registros > 0 else 1
    
    offset = (pagina - 1) * limite
    vendas_pagina = vendas_todas[offset : offset + limite]

    # Montagem do array final de vendas
    vendas_resposta = []
    for v in vendas_pagina:
        texto_pagamento, lista_pagamentos = processar_pagamentos_venda(v.forma_pagamento, float(v.total or 0))
        
        subtotal_v = float(getattr(v, "subtotal", None) or v.total or 0.0)
        desconto_v = float(getattr(v, "desconto", None) or 0.0)
        troco_v = float(getattr(v, "troco", None) or 0.0)
        usuario_nome = v.usuario.nome if getattr(v, "usuario", None) else "Administrador"

        vendas_resposta.append({
            "id": v.id,
            "data": v.data.strftime("%d/%m/%Y %H:%M") if getattr(v, "data", None) else "Data N/A",
            "cliente": v.cliente or "Consumidor Final",
            "usuario": usuario_nome,
            "vendedor": usuario_nome,
            "itens": qtd_itens_por_venda.get(v.id, 0),
            "pagamento": texto_pagamento,
            "forma_pagamento": texto_pagamento,
            "pagamentos": lista_pagamentos,
            "pagamentos_raw": lista_pagamentos,
            "subtotal": subtotal_v,
            "desconto": desconto_v,
            "troco": troco_v,
            "total": float(v.total or 0.0),
        })

    return {
        "pagina_atual": pagina,
        "total_paginas": total_paginas,
        "total_registros": total_registros,
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
        "vendas": vendas_resposta,
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
        texto_pag, _ = processar_pagamentos_venda(venda.forma_pagamento, float(venda.total or 0))
        writer.writerow([
            venda.id,
            venda.data.strftime("%d/%m/%Y %H:%M") if venda.data else "N/A",
            venda.cliente or "Consumidor Final",
            venda.usuario.nome if getattr(venda, "usuario", None) else "Sistema",
            texto_pag,
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