import os

from dotenv import load_dotenv


load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY") or os.getenv("SESSION_SECRET")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY não configurada. Defina SECRET_KEY (ou SESSION_SECRET) no ambiente."
    )

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)


def cookie_is_secure() -> bool:
    """Use HTTPS-only cookies in production, while keeping local HTTP usable."""
    return os.getenv("COOKIE_SECURE", "").lower() == "true" or (
        os.getenv("ENVIRONMENT", "").lower() == "production"
    )