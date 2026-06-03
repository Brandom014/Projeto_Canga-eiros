from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.produtos import Produto
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

templates = Jinja2Templates(
    directory="app/templates"
)

@router.get("/", response_class=HTMLResponse)
def dashboard(
    request: Request,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):

    # =========================
    # PRODUTOS
    # =========================
    total_produtos = db.query(Produto).count()

    estoque_baixo = (
        db.query(Produto)
        .filter(Produto.estoque <= 5)
        .count()
    )

    # =========================
    # VENDAS
    # =========================
    vendas = db.query(Venda).all()

    total_vendas = len(vendas)

    faturamento_total = sum(
        venda.total
        for venda in vendas
    )

    hoje = datetime.now().date()

    vendas_hoje = [
        venda
        for venda in vendas
        if venda.data.date() == hoje
    ]

    faturamento_hoje = sum(
        venda.total
        for venda in vendas_hoje
    )

    # =========================
    # ITENS VENDIDOS
    # =========================
    itens = db.query(ItemVenda).all()

    itens_vendidos = sum(
        item.quantidade
        for item in itens
    )

    # =========================
    # CLIENTES ATENDIDOS
    # =========================
    clientes_atendidos = total_vendas

    # =========================
    # PRODUTO MAIS VENDIDO
    # =========================
    produto_mais_vendido = "Nenhum"

    if itens:

        contagem = {}

        for item in itens:
            contagem[item.produto_id] = (
                contagem.get(item.produto_id, 0)
                + item.quantidade
            )

        produto_id = max(
            contagem,
            key=contagem.get
        )

        produto = (
            db.query(Produto)
            .filter(
                Produto.id == produto_id
            )
            .first()
        )

        if produto:
            produto_mais_vendido = produto.nome

    # =========================
    # ÚLTIMAS VENDAS
    # =========================
    ultimas_vendas = (
        db.query(Venda)
        .order_by(Venda.data.desc())
        .limit(5)
        .all()
    )

    # =========================
    # TEMPLATE
    # =========================
    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,

            "usuario": user.nome,
            "perfil": user.role,

            "total_produtos": total_produtos,

            "total_vendas": total_vendas,

            "faturamento_total": faturamento_total,

            "faturamento_hoje": faturamento_hoje,

            "itens_vendidos": itens_vendidos,

            "clientes_atendidos": clientes_atendidos,

            "produto_mais_vendido": produto_mais_vendido,

            "estoque_baixo": estoque_baixo,

            "ultimas_vendas": ultimas_vendas
        }
    )