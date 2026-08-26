from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Form,
    UploadFile,
    File
)
import os
from uuid import uuid4

from fastapi.responses import (
    HTMLResponse,
    RedirectResponse
)

from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuarios import Usuario
from app.dependencies import get_current_admin, get_current_user
from app.auth import hash_senha

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

templates = Jinja2Templates(
    directory="app/templates"
)

UPLOAD_DIR = "app/static/uploads"


# =========================
# LISTAR USUÁRIOS
# =========================

@router.get("/", response_class=HTMLResponse)
def pagina_usuarios(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.role != "admin":
        return RedirectResponse(
            url="/dashboard?erro=acesso_negado",
            status_code=303
        )

    usuarios = db.query(Usuario).all()

    total_usuarios = len(usuarios)

    total_admins = len([
        u for u in usuarios
        if u.role == "admin"
    ])

    total_vendedores = len([
        u for u in usuarios
        if u.role == "vendedor"
    ])

    total_ativos = len([
        u for u in usuarios
        if u.ativo
    ])

    return templates.TemplateResponse(
        "usuarios.html",
        {
            "request": request,
            "usuarios": usuarios,
            "total_usuarios": total_usuarios,
            "total_admins": total_admins,
            "total_vendedores": total_vendedores,
            "total_ativos": total_ativos
        }
    )


# =========================
# CADASTRAR USUÁRIO
# =========================

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
        url="/usuarios/",
        status_code=303
    )


# =========================
# EDITAR USUÁRIO
# =========================

@router.post("/editar/{usuario_id}")
def editar_usuario(
    usuario_id: int,
    nome: str = Form(...),
    email: str = Form(...),
    role: str = Form(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    email_existente = db.query(Usuario).filter(
        Usuario.email == email,
        Usuario.id != usuario_id
    ).first()

    if email_existente:
        raise HTTPException(
            status_code=400,
            detail="Email já está em uso"
        )

    usuario.nome = nome
    usuario.email = email
    usuario.role = role

    db.commit()

    return RedirectResponse(
        url="/usuarios/",
        status_code=303
    )


# =========================
# ALTERAR SENHA
# =========================

@router.post("/alterar-senha/{usuario_id}")
def alterar_senha(
    usuario_id: int,
    nova_senha: str = Form(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    usuario.senha = hash_senha(nova_senha)

    db.commit()

    return RedirectResponse(
        url="/usuarios/",
        status_code=303
    )


# =========================
# DESATIVAR
# =========================

@router.post("/desativar/{usuario_id}")
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    usuario.ativo = False

    db.commit()
    db.refresh(usuario)

    return RedirectResponse(
        url="/usuarios/",
        status_code=303
    )

# =========================
# ATIVAR
# =========================

@router.post("/ativar/{usuario_id}")
def ativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    usuario.ativo = True

    db.commit()

    return RedirectResponse(
        url="/usuarios/",
        status_code=303
    )


# =========================
# EXCLUIR
# =========================

@router.post("/excluir/{usuario_id}")
def excluir_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    db.delete(usuario)
    db.commit()

    return RedirectResponse(
        url="/usuarios/",
        status_code=303
    )


@router.post("/perfil")
async def atualizar_perfil(
    foto: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not foto.filename:
        raise HTTPException(status_code=400, detail="Selecione uma foto.")

    extensao = os.path.splitext(foto.filename)[1].lower()
    if extensao not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(
            status_code=400,
            detail="Use uma imagem JPG, PNG ou WEBP.",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    nome_arquivo = f"perfil-{current_user.id}-{uuid4()}{extensao}"
    caminho = os.path.join(UPLOAD_DIR, nome_arquivo)
    with open(caminho, "wb") as destino:
        destino.write(await foto.read())

    current_user.foto_perfil = f"/static/uploads/{nome_arquivo}"
    db.commit()

    return RedirectResponse("/dashboard", status_code=303)