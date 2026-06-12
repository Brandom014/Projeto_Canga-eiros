from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.movimentacoes import Movimentacao
from app.models.produtos import Produto
from app.models.usuarios import Usuario


router = APIRouter()

templates = Jinja2Templates(
    directory="app/templates"
)

@router.get("/movimentacoes", response_class=HTMLResponse)
def tela_movimentacoes(request: Request):
    return templates.TemplateResponse(
        "movimentacoes.html",
        {"request": request}
    )

@router.get("/api/movimentacoes")
def listar_movimentacoes(
    db: Session = Depends(get_db)
):

    movimentacoes = db.query(Movimentacao).all()

    return [
        {
            "id": m.id,
            "produto": m.produto.nome if m.produto else "-",
            "usuario": m.usuario.nome if m.usuario else "-",
            "tipo": m.tipo,
            "quantidade": m.quantidade,
            "valor": m.valor,
            "observacao": m.observacao,
            "data": m.data.isoformat() if m.data else None
        }
        for m in movimentacoes
    ]

@router.get("/relatorio", response_class=HTMLResponse)
def tela_relatorio(request: Request):
    return templates.TemplateResponse(
        "relatorio.html",
        {"request": request}
    )

@router.get("/configuracoes", response_class=HTMLResponse)
def tela_relatorio(request: Request):
    return templates.TemplateResponse(
        "configuracoes.html",
        {"request": request}
    )