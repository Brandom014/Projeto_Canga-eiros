from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Form
)

from fastapi.responses import (
    HTMLResponse,
    RedirectResponse
)

from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuarios import Usuario
from app.dependencies import get_current_admin
from app.auth import hash_senha

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

templates = Jinja2Templates(
    directory="app/templates"
)


# LISTAR USUÁRIOS
@router.get("/", response_class=HTMLResponse)
def pagina_usuarios(
    request: Request,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuarios = db.query(Usuario).all()

    return templates.TemplateResponse(
        "usuarios.html",
        {
            "request": request,
            "usuarios": usuarios
        }
    )


# CADASTRAR USUÁRIO
@router.post("/criar")
def criar_usuario(
    nome: str = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    existe = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if existe:
        raise HTTPException(
            status_code=400,
            detail="Email já cadastrado"
        )

    novo_usuario = Usuario(
        nome=nome,
        email=email,
        senha=hash_senha(senha),
        role=role,
        ativo=True
    )

    db.add(novo_usuario)
    db.commit()

    return RedirectResponse(
        url="/usuarios",
        status_code=303
    )


# DESATIVAR
@router.post("/desativar/{usuario_id}")
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    user.ativo = False

    db.commit()

    return RedirectResponse(
        url="/usuarios",
        status_code=303
    )


# ATIVAR
@router.post("/ativar/{usuario_id}")
def ativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    user = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    user.ativo = True

    db.commit()

    return RedirectResponse(
        url="/usuarios",
        status_code=303
    )