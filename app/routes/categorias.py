from fastapi import APIRouter, Depends, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.categoria import Categoria
from fastapi.responses import RedirectResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/categorias", tags=["Categorias"])

@router.post("/criar")
def criar_categoria(
    nome: str = Form(...),
    descricao: str = Form(None),
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
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