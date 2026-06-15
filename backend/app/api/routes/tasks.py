# =============================================================================
# app/api/routes/tasks.py
# =============================================================================
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AssignedUserPublic,
    AssignmentCreate,
    AssignmentPublic,
    Story,
    Task,
    TaskCreate,
    TaskPublic,
    TaskSubtaskPublic,
    TaskUpdate,
    Task_Assignments,
    User,
)
import app.crud as crud

router_tasks = APIRouter(prefix="/tasks", tags=["tasks"])


def _assignment_public(a: Task_Assignments, session) -> AssignmentPublic:
    to_user = session.get(User, a.assigned_to)
    by_user = session.get(User, a.assigned_by)
    return AssignmentPublic(
        task_assignment_id=a.task_assignment_id,  # type: ignore[arg-type]
        assigned_to=AssignedUserPublic(
            user_id=a.assigned_to, name=to_user.name if to_user else None
        ),
        assigned_by=AssignedUserPublic(
            user_id=a.assigned_by, name=by_user.name if by_user else None
        ),
        assigned_at=a.assigned_at,
        reason=a.reason,
    )


def _task_public(task: Task, session, include_subtasks: bool = False) -> TaskPublic:
    story = session.get(Story, task.story_id)
    assignments = [
        _assignment_public(a, session)
        for a in crud.get_assignments(session=session, task_id=task.task_id)  # type: ignore[arg-type]
    ]
    subtasks = []
    if include_subtasks:
        subtasks = [
            TaskSubtaskPublic(
                task_id=st.task_id,  # type: ignore[arg-type]
                title=st.title,
                status=st.status,
                priority=st.priority,
            )
            for st in crud.get_subtasks(session=session, task_id=task.task_id)  # type: ignore[arg-type]
        ]
    return TaskPublic(
        task_id=task.task_id,  # type: ignore[arg-type]
        story_id=task.story_id,
        story_title=story.title if story else None,
        parent_task_id=task.parent_task_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        created_at=task.created_at,
        updated_at=task.updated_at,
        assignments=assignments,
        subtasks=subtasks,
    )


@router_tasks.get("", response_model=dict)
def list_tasks(
    session: SessionDep,
    _: CurrentUser,
    story_id: uuid.UUID | None = None,
    parent_task_id: uuid.UUID | None = None,
    status: str | None = None,
    priority: str | None = None,
    assigned_to: uuid.UUID | None = None,
    due_before: str | None = None,
    due_after: str | None = None,
    order_by: str = "due_date",
    direction: str = "asc",
    limit: int = 25,
    offset: int = 0,
):
    def _parse(d: str | None):
        return (
            datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=timezone.utc) if d else None
        )

    tasks, total = crud.get_tasks(
        session=session,
        limit=limit,
        offset=offset,
        story_id=story_id,
        parent_task_id=parent_task_id,
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        due_before=_parse(due_before),
        due_after=_parse(due_after),
        order_by=order_by,
        direction=direction,
    )
    return {
        "data": [_task_public(t, session) for t in tasks],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_tasks.post("", status_code=201, response_model=TaskPublic)
def create_task(body: TaskCreate, session: SessionDep, _: CurrentUser):
    if not session.get(Story, body.story_id):
        raise HTTPException(status_code=404, detail="Story not found")
    if body.parent_task_id:
        parent = session.get(Task, body.parent_task_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent task not found")
        if parent.story_id != body.story_id:
            raise HTTPException(
                status_code=422, detail="Parent task belongs to a different story"
            )
    task = crud.create_task(session=session, data=body)
    return _task_public(task, session)


@router_tasks.get("/{task_id}", response_model=TaskPublic)
def get_task(task_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_public(task, session, include_subtasks=True)


@router_tasks.patch("/{task_id}", response_model=TaskPublic)
def patch_task(
    task_id: uuid.UUID,
    body: TaskUpdate,
    session: SessionDep,
    _: CurrentUser,
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updated = crud.update_task(session=session, task=task, data=body)
    return _task_public(updated, session, include_subtasks=True)


@router_tasks.delete("/{task_id}", status_code=204)
def delete_task(task_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if crud.get_subtasks(session=session, task_id=task_id):
        raise HTTPException(
            status_code=409, detail="Task has subtasks — delete them first"
        )
    crud.delete_task(session=session, task=task)


@router_tasks.get("/{task_id}/subtasks", response_model=dict)
def list_subtasks(
    task_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
    status: str | None = None,
    priority: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    if not session.get(Task, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    tasks, total = crud.get_tasks(
        session=session,
        limit=limit,
        offset=offset,
        story_id=None,
        parent_task_id=task_id,
        status=status,
        priority=priority,
        assigned_to=None,
        due_before=None,
        due_after=None,
        order_by="due_date",
        direction="asc",
    )
    return {
        "data": [_task_public(t, session) for t in tasks],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# --- Assignment sub-routes ---


@router_tasks.get("/{task_id}/assignments", response_model=dict)
def list_assignments(task_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    if not session.get(Task, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    assignments = crud.get_assignments(session=session, task_id=task_id)
    data = []
    for a in assignments:
        to_user = session.get(User, a.assigned_to)
        by_user = session.get(User, a.assigned_by)
        data.append(
            {
                "task_assignment_id": a.task_assignment_id,
                "task_id": a.task_id,
                "assigned_to": {
                    "user_id": a.assigned_to,
                    "name": to_user.name if to_user else None,
                    "email": to_user.email if to_user else None,
                },
                "assigned_by": {
                    "user_id": a.assigned_by,
                    "name": by_user.name if by_user else None,
                    "email": by_user.email if by_user else None,
                },
                "assigned_at": a.assigned_at,
                "reason": a.reason,
            }
        )
    return {"data": data, "total": len(data), "limit": 25, "offset": 0}


@router_tasks.post("/{task_id}/assignments", status_code=201)
def create_assignment(
    task_id: uuid.UUID,
    body: AssignmentCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    if not session.get(Task, task_id):
        raise HTTPException(status_code=404, detail="Task not found")
    target = session.get(User, body.assigned_to)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if not target.is_active:
        raise HTTPException(status_code=422, detail="Target user is inactive")
    existing = session.exec(
        select(Task_Assignments).where(
            Task_Assignments.task_id == task_id,
            Task_Assignments.assigned_to == body.assigned_to,
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=409, detail="User already assigned to this task"
        )
    a = crud.create_assignment(
        session=session,
        task_id=task_id,
        data=body,
        assigned_by=current_user.user_id,  # type: ignore[arg-type]
    )
    return _assignment_public(a, session)


@router_tasks.delete("/{task_id}/assignments/{task_assignment_id}", status_code=204)
def delete_assignment(
    task_id: uuid.UUID,
    task_assignment_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
):
    a = session.get(Task_Assignments, task_assignment_id)
    if not a or a.task_id != task_id:
        raise HTTPException(status_code=404, detail="Assignment not found")
    crud.delete_assignment(session=session, a=a)
