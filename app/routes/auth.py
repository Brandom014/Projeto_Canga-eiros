from fastapi import APIRouter, Depends, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuarios import Usuario
from app.auth import verificar_senha, criar_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

templates = Jinja2Templates(directory="app/templates")


# =========================
# TELA DE LOGIN
# =========================
@router.get("/login", response_class=HTMLResponse)
def tela_login(request: Request):
    return templates.TemplateResponse(
        "login.html",
        {"request": request}
    )


# =========================
# LOGIN
# =========================

@router.post("/login")
def login(
    email: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    # 🔴 ISSO AQUI FALTAVA
    if not user.ativo:
        raise HTTPException(
            status_code=403,
            detail="Usuário desativado"
        )

    if not verificar_senha(senha, user.senha):
        raise HTTPException(
            status_code=401,
            detail="Senha inválida"
        )

    token = criar_token({
        "id": user.id,
        "sub": user.email,
        "role": user.role
    })

    response = RedirectResponse(
        url="/dashboard",
        status_code=303
    )

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True
    )

    return response

# =========================
# LOGOUT
# =========================
@router.get("/logout")
def logout():
    response = RedirectResponse(
        url="/auth/login",
        status_code=303
    )

    response.delete_cookie("access_token", httponly=True)
    return response