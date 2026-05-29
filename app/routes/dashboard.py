from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.produtos import Produto
from app.models.vendas import Venda
from app.models.itens_venda import ItemVenda

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

templates = Jinja2Templates(directory="app/templates")


@router.get("/", response_class=HTMLResponse)
def dashboard(request: Request, db: Session = Depends(get_db)):

    produtos = db.query(Produto).count()
    vendas = db.query(Venda).all()

    total_vendas = len(vendas)
    faturamento = sum(v.total for v in vendas)

    hoje = datetime.now().date()
    vendas_hoje = [v for v in vendas if v.data.date() == hoje]

    faturamento_hoje = sum(v.total for v in vendas_hoje)

    itens = db.query(ItemVenda).all()

    produto_mais_vendido = None

    if itens:
        contagem = {}

        for item in itens:

            if item.produto_id in contagem:
                contagem[item.produto_id] += item.quantidade
            else:
                contagem[item.produto_id] = item.quantidade

        produto_mais_vendido = max(contagem, key=contagem.get)

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "total_produtos": produtos,
            "total_vendas": total_vendas,
            "faturamento_total": faturamento,
            "faturamento_hoje": faturamento_hoje,
            "produto_mais_vendido_id": produto_mais_vendido
        }
    )