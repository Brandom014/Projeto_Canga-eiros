from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.movimentacoes import Movimentacao

router = APIRouter(
    prefix="/estoque",
    tags=["Estoque"]
)

templates = Jinja2Templates(directory="app/templates")

# Página HTML do estoque
@router.get("/", response_class=HTMLResponse)
def pagina_estoque(
    request: Request,
    db: Session = Depends(get_db)
):

    movimentacoes = db.query(Movimentacao).all()

    return templates.TemplateResponse(
        "estoque.html",
        {
            "request": request,
            "movimentacoes": movimentacoes
        }
    )