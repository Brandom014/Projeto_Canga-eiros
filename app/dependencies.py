from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from dotenv import load_dotenv
import os

from app.database import get_db
from app.models.usuarios import Usuario

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Não autenticado"
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

    user = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    return user


def get_current_admin(
    current_user: Usuario = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Acesso negado"
        )

    return current_user