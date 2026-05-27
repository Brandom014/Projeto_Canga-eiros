from app.database import SessionLocal, Base, engine
from app.models.usuarios import Usuario
from app.auth import hash_senha

# garante que tabelas existem
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def criar_admin():
    email = "admin@gmail.com"

    admin_existente = db.query(Usuario).filter(Usuario.email == email).first()

    if admin_existente:
        print("Admin já existe")
        return

    admin = Usuario(
        nome="Administrador",
        email=email,
        senha=hash_senha("admin123"),
        role="admin",
        ativo=True
    )

    db.add(admin)
    db.commit()

    print("Admin criado com sucesso!")

if __name__ == "__main__":
    criar_admin()