from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuarios import Usuario
from app.dependencies import get_current_admin

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

# LISTAR USUÁRIOS
@router.get("/")
def listar_usuarios(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    return db.query(Usuario).all()


# DESATIVAR USUÁRIO
@router.post("/desativar/{usuario_id}")
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    user.ativo = False
    db.commit()

    return {"msg": "Usuário desativado"}


# ATIVAR USUÁRIO
@router.post("/ativar/{usuario_id}")
def ativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    user.ativo = True
    db.commit()

    return {"msg": "Usuário ativado"}