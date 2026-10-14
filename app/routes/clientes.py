import re
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
# FUNÇÃO AUXILIAR: VALIDAR CPF
# =========================

def validar_cpf(cpf: str) -> bool:
    """Valida se o CPF é matematicamente válido."""
    if not cpf:
        return False

    # Remove pontuações/espaços e mantém apenas números
    cpf = re.sub(r'\D', '', str(cpf))

    # Verifica se tem 11 dígitos ou se é uma sequência repetida (ex: 111.111.111-11)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    # Validação do 1º dígito verificador
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    digito_1 = 0 if resto in (10, 11) else resto
    if digito_1 != int(cpf[9]):
        return False

    # Validação do 2º dígito verificador
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    digito_2 = 0 if resto in (10, 11) else resto
    return digito_2 == int(cpf[10])


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

    # 1. Limpa o CPF (remove pontos e traços)
    cpf_limpo = re.sub(r'\D', '', cpf)

    # 2. Validação matemática do formato do CPF
    if not validar_cpf(cpf_limpo):
        raise HTTPException(
            status_code=400,
            detail="O CPF informado é inválido."
        )

    # 3. Verificação de duplicação na base de dados
    cpf_existente = db.query(Cliente).filter(
        Cliente.cpf == cpf_limpo
    ).first()

    if cpf_existente:
        raise HTTPException(
            status_code=400,
            detail="CPF já cadastrado."
        )

    novo_cliente = Cliente(
        nome=nome,
        cpf=cpf_limpo,
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
            detail="Cliente não encontrado."
        )

    # 1. Limpa o CPF
    cpf_limpo = re.sub(r'\D', '', cpf)

    # 2. Validação matemática do formato do CPF
    if not validar_cpf(cpf_limpo):
        raise HTTPException(
            status_code=400,
            detail="O CPF informado é inválido."
        )

    # 3. Verificação de duplicação na base de dados para outros clientes
    cpf_existente = db.query(Cliente).filter(
        Cliente.cpf == cpf_limpo,
        Cliente.id != cliente_id
    ).first()

    if cpf_existente:
        raise HTTPException(
            status_code=400,
            detail="CPF já está cadastrado para outro cliente."
        )

    cliente.nome = nome
    cliente.cpf = cpf_limpo
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
            detail="Cliente não encontrado."
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
            detail="Cliente não encontrado."
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
            detail="Cliente não encontrado."
        )

    db.delete(cliente)
    db.commit()

    return RedirectResponse(
        url="/clientes/",
        status_code=303
    )


# =========================
# API: LISTAR CLIENTES (JSON)
# =========================

@router.get("/api/listar")
def listar_clientes_json(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # Busca apenas os clientes que estão ativos no banco
    clientes = db.query(Cliente).filter(
        Cliente.ativo == True
    ).order_by(Cliente.nome.asc()).all()

    return [
        {
            "id": c.id,
            "nome": c.nome,
            "cpf": c.cpf,
            "telefone": c.telefone,
            "email": c.email
        }
        for c in clientes
    ]