from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuarios import Usuario
from app.auth import hash_senha, verificar_senha, criar_token

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/cadastro")
def cadastro(nome: str, email: str, senha: str, db: Session = Depends(get_db)):

    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email já existe")

    novo = Usuario(
        nome=nome,
        email=email,
        senha=hash_senha(senha)
    )

    db.add(novo)
    db.commit()

    return {"msg": "Usuário criado"}

@router.post("/login")
def login(email: str, senha: str, db: Session = Depends(get_db)):

    user = db.query(Usuario).filter(Usuario.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if not verificar_senha(senha, user.senha):
        raise HTTPException(status_code=401, detail="Senha inválida")

    token = criar_token({"sub": user.email})

    return {"access_token": token, "token_type": "bearer"}