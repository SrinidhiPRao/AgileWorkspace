# =============================================================================
# app/api/routes/backlogs.py
# =============================================================================
import uuid
from fastapi import APIRouter, HTTPException
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Backlog_Item,
    BacklogCreate,
    BacklogCreatedBy,
    BacklogPublic,
    BacklogUpdate,
    Feature,
    FeaturePublic,
)
import app.crud as crud

router_backlogs = APIRouter(prefix="/backlogs", tags=["backlogs"])


def _backlog_public(item: Backlog_Item, session) -> BacklogPublic:
    from app.models import User

    creator = session.get(User, item.created_by)
    return BacklogPublic(
        backlog_item_id=item.backlog_item_id,  # type: ignore[arg-type]
        title=item.title,
        description=item.description,
        priority=item.priority,
        status=item.status,
        created_by=BacklogCreatedBy(
            user_id=item.created_by,
            name=creator.name if creator else None,
        ),
        created_at=item.created_at,
    )


@router_backlogs.get("", response_model=dict)
def list_backlogs(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    priority: str | None = None,
    created_by: uuid.UUID | None = None,
    order_by: str = "created_at",
    direction: str = "desc",
    limit: int = 25,
    offset: int = 0,
):
    items, total = crud.get_backlogs(
        session=session,
        limit=limit,
        offset=offset,
        status=status,
        priority=priority,
        created_by=created_by,
        order_by=order_by,
        direction=direction,
    )
    return {
        "data": [_backlog_public(i, session) for i in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_backlogs.post("", status_code=201, response_model=BacklogPublic)
def create_backlog(body: BacklogCreate, session: SessionDep, current_user: CurrentUser):
    item = crud.create_backlog(
        session=session, data=body, created_by=current_user.user_id  # type: ignore[arg-type]
    )
    return _backlog_public(item, session)


@router_backlogs.get("/{backlog_item_id}", response_model=BacklogPublic)
def get_backlog(backlog_item_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    item = session.get(Backlog_Item, backlog_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Backlog item not found")
    return _backlog_public(item, session)


@router_backlogs.patch("/{backlog_item_id}", response_model=BacklogPublic)
def patch_backlog(
    backlog_item_id: uuid.UUID,
    body: BacklogUpdate,
    session: SessionDep,
    _: CurrentUser,
):
    item = session.get(Backlog_Item, backlog_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Backlog item not found")
    updated = crud.update_backlog(session=session, item=item, data=body)
    return _backlog_public(updated, session)


@router_backlogs.delete("/{backlog_item_id}", status_code=204)
def delete_backlog(backlog_item_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    item = session.get(Backlog_Item, backlog_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Backlog item not found")
    child = session.exec(
        __import__("sqlmodel")
        .select(Feature)
        .where(Feature.backlog_item_id == backlog_item_id)
    ).first()
    if child:
        raise HTTPException(
            status_code=409, detail="Backlog item has dependent features"
        )
    crud.delete_backlog(session=session, item=item)


@router_backlogs.get("/{backlog_item_id}/features", response_model=dict)
def list_features_under_backlog(
    backlog_item_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
    status: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    item = session.get(Backlog_Item, backlog_item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Backlog item not found")
    feats, total = crud.get_features(
        session=session,
        limit=limit,
        offset=offset,
        backlog_item_id=backlog_item_id,
        status=status,
    )
    data = [
        FeaturePublic(
            feature_id=f.feature_id,  # type: ignore[arg-type]
            backlog_item_id=f.backlog_item_id,
            backlog_item_title=item.title,
            title=f.title,
            description=f.description,
            status=f.status,
        )
        for f in feats
    ]
    return {"data": data, "total": total, "limit": limit, "offset": offset}
