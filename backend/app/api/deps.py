from typing import Annotated, Generator
import uuid
from fastapi import Depends, HTTPException, status
import jwt
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core.db import engine
from app.core.config import settings
from app.models import Role, TokenPayload, User, User_Role
from app.core import security

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, uuid.UUID(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(
    current_user: CurrentUser, session: SessionDep
) -> User:
    # Check if a link exists between this user and the SUPER_USER role
    is_superuser = session.exec(
        select(User_Role)
        .join(Role)
        .where(
            User_Role.user_id == current_user.user_id, Role.role_name == "SUPER_USER"
        )
    ).first()

    if not is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )

    return current_user
