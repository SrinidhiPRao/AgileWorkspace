# =============================================================================
# app/api/routes/features.py
# =============================================================================
import uuid
from fastapi import APIRouter, HTTPException
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Backlog_Item,
    Feature,
    FeatureCreate,
    FeaturePublic,
    FeatureUpdate,
    Story,
    StoryPublic,
)
import app.crud as crud

router_features = APIRouter(prefix="/features", tags=["features"])


def _feat_public(f: Feature, session) -> FeaturePublic:
    bl = session.get(Backlog_Item, f.backlog_item_id)
    return FeaturePublic(
        feature_id=f.feature_id,  # type: ignore[arg-type]
        backlog_item_id=f.backlog_item_id,
        backlog_item_title=bl.title if bl else None,
        title=f.title,
        description=f.description,
        status=f.status,
    )


@router_features.get("", response_model=dict)
def list_features(
    session: SessionDep,
    _: CurrentUser,
    backlog_item_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    feats, total = crud.get_features(
        session=session,
        limit=limit,
        offset=offset,
        backlog_item_id=backlog_item_id,
        status=status,
    )
    return {
        "data": [_feat_public(f, session) for f in feats],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_features.post("", status_code=201, response_model=FeaturePublic)
def create_feature(body: FeatureCreate, session: SessionDep, _: CurrentUser):
    if not session.get(Backlog_Item, body.backlog_item_id):
        raise HTTPException(status_code=404, detail="Backlog item not found")
    feat = crud.create_feature(session=session, data=body)
    return _feat_public(feat, session)


@router_features.get("/{feature_id}", response_model=FeaturePublic)
def get_feature(feature_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    feat = session.get(Feature, feature_id)
    if not feat:
        raise HTTPException(status_code=404, detail="Feature not found")
    return _feat_public(feat, session)


@router_features.patch("/{feature_id}", response_model=FeaturePublic)
def patch_feature(
    feature_id: uuid.UUID,
    body: FeatureUpdate,
    session: SessionDep,
    _: CurrentUser,
):
    feat = session.get(Feature, feature_id)
    if not feat:
        raise HTTPException(status_code=404, detail="Feature not found")
    updated = crud.update_feature(session=session, feat=feat, data=body)
    return _feat_public(updated, session)


@router_features.delete("/{feature_id}", status_code=204)
def delete_feature(feature_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    feat = session.get(Feature, feature_id)
    if not feat:
        raise HTTPException(status_code=404, detail="Feature not found")
    child = session.exec(
        __import__("sqlmodel").select(Story).where(Story.feature_id == feature_id)
    ).first()
    if child:
        raise HTTPException(status_code=409, detail="Feature has dependent stories")
    crud.delete_feature(session=session, feat=feat)


@router_features.get("/{feature_id}/stories", response_model=dict)
def list_stories_under_feature(
    feature_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
    status: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    feat = session.get(Feature, feature_id)
    if not feat:
        raise HTTPException(status_code=404, detail="Feature not found")
    stories, total = crud.get_stories(
        session=session,
        limit=limit,
        offset=offset,
        feature_id=feature_id,
        status=status,
    )
    data = [
        StoryPublic(
            story_id=s.story_id,  # type: ignore[arg-type]
            feature_id=s.feature_id,
            feature_title=feat.title,
            title=s.title,
            description=s.description,
            status=s.status,
        )
        for s in stories
    ]
    return {"data": data, "total": total, "limit": limit, "offset": offset}
