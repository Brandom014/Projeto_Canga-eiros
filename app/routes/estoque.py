from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.movimentacoes import Movimentacao

router = APIRouter(
    prefix="/estoque",
    tags=["Estoque"]
)

@router.get("/movimentacoes")
def listar_movimentacoes(
    db: Session = Depends(get_db)
):

    return db.query(Movimentacao).all()