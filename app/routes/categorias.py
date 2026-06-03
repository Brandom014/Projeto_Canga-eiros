from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.categoria import Categoria
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/categorias", tags=["Categorias"])

@router.post("/criar")
def criar_categoria(
    nome: str = Form(...),
    descricao: str = Form(None),
    db: Session = Depends(get_db)
):
    cat = Categoria(
        nome=nome,
        descricao=descricao
    )

    db.add(cat)
    db.commit()

    return RedirectResponse(
        url="/produtos?sucesso=categoria",
        status_code=303
    )