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
from app.models.clientes import Cliente
from app.dependencies import get_current_user, get_current_admin


router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)

templates = Jinja2Templates(
    directory="app/templates"
)


# =========================
# LISTAR CLIENTES
# =========================

@router.get("/", response_class=HTMLResponse)
def pagina_clientes(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    clientes = db.query(Cliente).order_by(
        Cliente.nome.asc()
    ).all()

    total_clientes = len(clientes)

    total_ativos = len([
        cliente for cliente in clientes
        if cliente.ativo
    ])

    total_inativos = len([
        cliente for cliente in clientes
        if not cliente.ativo
    ])

    return templates.TemplateResponse(
        "clientes.html",
        {
            "request": request,
            "clientes": clientes,
            "total_clientes": total_clientes,
            "total_ativos": total_ativos,
            "total_inativos": total_inativos
        }
    )


# =========================
# CADASTRAR CLIENTE
# =========================

@router.post("/criar")
def criar_cliente(
    nome: str = Form(...),
    cpf: str = Form(...),
    telefone: str = Form(""),
    email: str = Form(""),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    cpf_existente = db.query(Cliente).filter(
        Cliente.cpf == cpf
    ).first()

    if cpf_existente:
        raise HTTPException(
            status_code=400,
            detail="CPF já cadastrado"
        )

    novo_cliente = Cliente(
        nome=nome,
        cpf=cpf,
        telefone=telefone,
        email=email,
        ativo=True
    )

    db.add(novo_cliente)
    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )


# =========================
# EDITAR CLIENTE
# =========================

@router.post("/editar/{cliente_id}")
def editar_cliente(
    cliente_id: int,
    nome: str = Form(...),
    cpf: str = Form(...),
    telefone: str = Form(""),
    email: str = Form(""),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado"
        )

    cpf_existente = db.query(Cliente).filter(
        Cliente.cpf == cpf,
        Cliente.id != cliente_id
    ).first()

    if cpf_existente:
        raise HTTPException(
            status_code=400,
            detail="CPF já está cadastrado para outro cliente"
        )

    cliente.nome = nome
    cliente.cpf = cpf
    cliente.telefone = telefone
    cliente.email = email

    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )


# =========================
# DESATIVAR CLIENTE
# =========================

@router.post("/desativar/{cliente_id}")
def desativar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado"
        )

    cliente.ativo = False

    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )


# =========================
# ATIVAR CLIENTE
# =========================

@router.post("/ativar/{cliente_id}")
def ativar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado"
        )

    cliente.ativo = True

    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )


# =========================
# EXCLUIR CLIENTE
# =========================

@router.post("/excluir/{cliente_id}")
def excluir_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):

    cliente = db.query(Cliente).filter(
        Cliente.id == cliente_id
    ).first()

    if not cliente:
        raise HTTPException(
            status_code=404,
            detail="Cliente não encontrado"
        )

    db.delete(cliente)
    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )