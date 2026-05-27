from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")


def hash_senha(senha: str):
    return pwd_context.hash(senha)


def verificar_senha(senha: str, hash_senha: str):
    return pwd_context.verify(senha, hash_senha)


def criar_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    )

    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)