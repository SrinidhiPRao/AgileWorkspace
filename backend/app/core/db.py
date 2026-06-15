from sqlmodel import SQLModel, Session, create_engine, select

from app.crud import assign_user_role, create_role, create_user
from app.core.config import settings
from app.models import Role, RoleCreate, User, User_Role, UserCreate

# engine = create_engine(str(settings.MYSQL_DATABASE_URI()))
engine = create_engine(str(settings.SQLITE_DATABASE_URI()))


def init_db(session: Session):
    SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
        )
        user = create_user(session=session, user_create=user_in)
    role = session.exec(select(Role).where(Role.role_name == "SUPER_USER")).first()
    if not role:
        role = create_role(
            session=session, role_create=RoleCreate(role_name="SUPER_USER")
        )
    user_role = session.exec(
        select(User_Role).join(Role).where(Role.role_name == "SUPER_USER")
    ).first()
    if not user_role:
        assign_user_role(
            session=session,
            email=settings.FIRST_SUPERUSER_EMAIL,
            role_name="SUPER_USER",
        )


if __name__ == "__main__":
    with Session(engine) as session:
        init_db(session)
