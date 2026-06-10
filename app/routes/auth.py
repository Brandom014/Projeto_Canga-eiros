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

    erro = request.query_params.get("erro")

    return templates.TemplateResponse(
        "login.html",
        {
            "request": request,
            "erro": erro
        }
    )


# =========================
# LOGIN
# =========================
@router.post("/login")
def login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if not user:
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Usuário não encontrado"
            }
        )

    if not user.ativo:
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Usuário desativado. Entre em contato com um administrador."
            }
        )

    if not verificar_senha(senha, user.senha):
        return templates.TemplateResponse(
            "login.html",
            {
                "request": request,
                "erro": "Senha inválida"
            }
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