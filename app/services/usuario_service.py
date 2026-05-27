from app.models.usuarios import Usuario
from app.services.auth_service import hash_senha


def criar_usuario(db, nome: str, email: str, senha: str, role: str = "vendedor"):
    usuario = Usuario(
        nome=nome,
        email=email,
        senha=hash_senha(senha),
        role=role,
        ativo=True
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


def listar_usuarios(db):
    return db.query(Usuario).all()


def desativar_usuario(db, usuario_id: int):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()

    if usuario:
        usuario.ativo = False
        db.commit()

    return usuario