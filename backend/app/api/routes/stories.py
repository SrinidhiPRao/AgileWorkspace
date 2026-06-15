# =============================================================================
# app/api/routes/stories.py
# =============================================================================
import uuid
from fastapi import APIRouter, HTTPException
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Feature,
    Story,
    StoryCreate,
    StoryPublic,
    StoryUpdate,
    Task,
    TaskPublic,
)
import app.crud as crud

router_stories = APIRouter(prefix="/stories", tags=["stories"])


def _story_public(s: Story, session) -> StoryPublic:
    feat = session.get(Feature, s.feature_id)
    return StoryPublic(
        story_id=s.story_id,  # type: ignore[arg-type]
        feature_id=s.feature_id,
        feature_title=feat.title if feat else None,
        title=s.title,
        description=s.description,
        status=s.status,
    )


@router_stories.get("", response_model=dict)
def list_stories(
    session: SessionDep,
    _: CurrentUser,
    feature_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    stories, total = crud.get_stories(
        session=session,
        limit=limit,
        offset=offset,
        feature_id=feature_id,
        status=status,
    )
    return {
        "data": [_story_public(s, session) for s in stories],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_stories.post("", status_code=201, response_model=StoryPublic)
def create_story(body: StoryCreate, session: SessionDep, _: CurrentUser):
    if not session.get(Feature, body.feature_id):
        raise HTTPException(status_code=404, detail="Feature not found")
    story = crud.create_story(session=session, data=body)
    return _story_public(story, session)


@router_stories.get("/{story_id}", response_model=StoryPublic)
def get_story(story_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    s = session.get(Story, story_id)
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    return _story_public(s, session)


@router_stories.patch("/{story_id}", response_model=StoryPublic)
def patch_story(
    story_id: uuid.UUID,
    body: StoryUpdate,
    session: SessionDep,
    _: CurrentUser,
):
    s = session.get(Story, story_id)
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    updated = crud.update_story(session=session, story=s, data=body)
    return _story_public(updated, session)


@router_stories.delete("/{story_id}", status_code=204)
def delete_story(story_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    s = session.get(Story, story_id)
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    child = session.exec(
        __import__("sqlmodel").select(Task).where(Task.story_id == story_id)
    ).first()
    if child:
        raise HTTPException(status_code=409, detail="Story has dependent tasks")
    crud.delete_story(session=session, story=s)


@router_stories.get("/{story_id}/tasks", response_model=dict)
def list_tasks_under_story(
    story_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
    status: str | None = None,
    priority: str | None = None,
    assigned_to: uuid.UUID | None = None,
    limit: int = 25,
    offset: int = 0,
):
    s = session.get(Story, story_id)
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    # top-level tasks only (parent_task_id IS NULL) — pass a sentinel handled in crud
    tasks, total = crud.get_tasks(
        session=session,
        limit=limit,
        offset=offset,
        story_id=story_id,
        parent_task_id=None,
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        due_before=None,
        due_after=None,
        order_by="due_date",
        direction="asc",
    )
    # filter out subtasks (parent_task_id is not None) since crud passes None as "no filter"
    top_level = [t for t in tasks if t.parent_task_id is None]
    return {
        "data": top_level,
        "total": len(top_level),
        "limit": limit,
        "offset": offset,
    }
