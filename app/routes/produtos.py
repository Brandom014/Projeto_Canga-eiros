import os
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    Form,
    UploadFile,
    File,
    Request
)

from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.produtos import Produto
from app.models.categoria import Categoria
from app.models.movimentacoes import Movimentacao

router = APIRouter(prefix="/produtos", tags=["Produtos"])

templates = Jinja2Templates(directory="app/templates")

UPLOAD_DIR = "app/static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/")
def pagina_produtos(
    request: Request,
    db: Session = Depends(get_db)
):

    produtos = db.query(Produto).all()

    total_estoque = sum(
        produto.estoque
        for produto in produtos
    )

    produtos_baixo = len([
        p for p in produtos
        if p.estoque > 0 and p.estoque <= 10
    ])

    produtos_sem = len([
        p for p in produtos
        if p.estoque == 0
    ])

    categorias = db.query(Categoria).all()

    return templates.TemplateResponse(
        "produtos.html",
        {
            "request": request,
            "produtos": produtos,
            "categorias": categorias,
            "total_estoque": total_estoque,
            "produtos_baixo": produtos_baixo,
            "produtos_sem": produtos_sem
        }
    )

@router.post("/criar")
async def criar_produto(
    nome: str = Form(...),
    categoria_id: int = Form(...),
    preco: float = Form(...),
    estoque: int = Form(...),
    imagem: UploadFile = File(None),
    db: Session = Depends(get_db)
):

    filename = None

    if imagem and imagem.filename:

        extensao = imagem.filename.split(".")[-1]
        filename = f"{uuid4()}.{extensao}"

        caminho = os.path.abspath(
            os.path.join(UPLOAD_DIR, filename)
        )

        print("SALVANDO IMAGEM EM:")
        print(caminho)

        conteudo = await imagem.read()

        with open(caminho, "wb") as buffer:
            buffer.write(conteudo)

        print("ARQUIVO EXISTE?", os.path.exists(caminho))

    produto = Produto(
        nome=nome,
        categoria_id=categoria_id,
        preco=preco,
        estoque=estoque,
        imagem=f"/static/uploads/{filename}" if filename else None
    )

    db.add(produto)
    db.commit()
    db.refresh(produto)

    movimentacao = Movimentacao(
    produto_id=produto.id,
    usuario_id=1,  # depois pegamos o usuário logado
    tipo="Entrada",
    quantidade=estoque,
    valor=preco,
    observacao="Cadastro de produto"
)

    db.add(movimentacao)
    db.commit()

    return RedirectResponse(
        url="/produtos?sucesso=produto",
        status_code=303
    )


@router.post("/excluir/{produto_id}")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db)
):

    produto = db.query(Produto).filter(
        Produto.id == produto_id
    ).first()

    if produto:

        if produto.imagem:

            caminho = produto.imagem.replace("/", os.sep)

            caminho = caminho.lstrip(os.sep)

            if os.path.exists(caminho):
                os.remove(caminho)

        db.delete(produto)
        db.commit()

    return RedirectResponse(
        url="/produtos",
        status_code=303
    )

@router.post("/editar/{produto_id}")
async def editar_produto(
    produto_id: int,
    nome: str = Form(...),
    categoria_id: int = Form(...),
    preco: float = Form(...),
    estoque: int = Form(...),
    imagem: UploadFile = File(None),
    db: Session = Depends(get_db)
):

    produto = db.query(Produto).filter(
        Produto.id == produto_id
    ).first()

    if not produto:
        return RedirectResponse(
            url="/produtos",
            status_code=303
        )

    produto.nome = nome
    produto.categoria_id = categoria_id
    produto.preco = preco
    produto.estoque = estoque

    if imagem and imagem.filename:

        if produto.imagem:

            caminho_antigo = (
                produto.imagem
                .replace("/static/", "app/static/")
                .replace("/", os.sep)
            )

            if os.path.exists(caminho_antigo):
                os.remove(caminho_antigo)

        extensao = imagem.filename.split(".")[-1]

        filename = f"{uuid4()}.{extensao}"

        caminho_novo = os.path.join(
            UPLOAD_DIR,
            filename
        )

        with open(caminho_novo, "wb") as buffer:
            buffer.write(await imagem.read())

        produto.imagem = f"/static/uploads/{filename}"

    db.commit()

    return RedirectResponse(
        url="/produtos?sucesso=produto",
        status_code=303
    )