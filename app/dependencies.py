from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db
from app.models.usuarios import Usuario
from app.config import ALGORITHM, SECRET_KEY


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")
    if not token:
        authorization = request.headers.get("Authorization", "")
        scheme, _, header_token = authorization.partition(" ")
        if scheme.lower() == "bearer" and header_token:
            token = header_token.strip()

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
            detail="Apenas administradores podem acessar esta página."
        )

    return current_user