# =============================================================================
# app/api/routes/roles.py
# =============================================================================
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep, get_current_active_superuser, CurrentUser
from app.models import Role, RoleCreate, RolePublic, User_Role
import app.crud as crud

router_roles = APIRouter(prefix="/roles", tags=["roles"])


@router_roles.get("", response_model=dict)
def list_roles(session: SessionDep, _: CurrentUser, limit: int = 25, offset: int = 0):
    roles, total = crud.get_roles(session=session, limit=limit, offset=offset)
    return {
        "data": [RolePublic(role_id=r.role_id, role_name=r.role_name, description=r.description) for r in roles],  # type: ignore[arg-type]
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_roles.post(
    "",
    status_code=201,
    response_model=RolePublic,
    dependencies=[Depends(get_current_active_superuser)],
)
def create_role(body: RoleCreate, session: SessionDep):
    existing = session.exec(
        select(Role).where(Role.role_name == body.role_name)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Role name already exists")
    role = crud.create_role(session=session, role_create=body)
    return RolePublic(role_id=role.role_id, role_name=role.role_name, description=role.description)  # type: ignore[arg-type]


@router_roles.delete(
    "/{role_id}",
    status_code=204,
    dependencies=[Depends(get_current_active_superuser)],
)
def delete_role(role_id: str, session: SessionDep):
    import uuid as _uuid

    rid = _uuid.UUID(role_id)
    role = session.get(Role, rid)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    assigned = session.exec(select(User_Role).where(User_Role.role_id == rid)).first()
    if assigned:
        raise HTTPException(
            status_code=409, detail="Role is still assigned to one or more users"
        )
    session.delete(role)
    session.commit()
