from datetime import datetime, timezone
import uuid
from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Backlog_Item,
    BacklogCreate,
    BacklogUpdate,
    Feature,
    FeatureCreate,
    FeatureUpdate,
    Role,
    RoleCreate,
    Story,
    StoryCreate,
    StoryUpdate,
    Task,
    TaskCreate,
    TaskUpdate,
    Task_Assignments,
    AssignmentCreate,
    User,
    UserCreate,
    UserUpdate,
    User_Role,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_user_by_email(*, session: Session, email: str) -> User | None:
    return session.exec(select(User).where(User.email == email)).first()


DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$8s6yDA/+jo+2cUyX7Re37w$KTa+uNeMplVI+F7bAymYiotxgmzj7UXA8bpg0/cOMiA"


def authenticate_user(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running verification even when user doesn't exist
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh()
    return db_user


def get_users(*, session: Session, limit: int, offset: int, is_active: bool | None):
    q = select(User)
    if is_active is not None:
        q = q.where(User.is_active == is_active)
    total = len(session.exec(q).all())
    users = session.exec(q.offset(offset).limit(limit)).all()
    return users, total


def update_user(*, session: Session, user: User, update: UserUpdate) -> User:
    data = update.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(user, k, v)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def deactivate_user(*, session: Session, user: User) -> None:
    user.is_active = False
    session.add(user)
    session.commit()


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


def create_role(*, session: Session, role_create: RoleCreate) -> Role:
    role = Role(**role_create.model_dump())
    session.add(role)
    session.commit()
    session.refresh(role)
    return role


def get_roles(*, session: Session, limit: int, offset: int):
    all_roles = session.exec(select(Role)).all()
    total = len(all_roles)
    roles = session.exec(select(Role).offset(offset).limit(limit)).all()
    return roles, total


def assign_user_role(
    *,
    session: Session,
    email: str | None = None,
    user_id: uuid.UUID | None = None,
    role_name: str | None = None,
    role_id: uuid.UUID | None = None,
) -> User_Role:
    if user_id is None:
        user = session.exec(select(User).where(User.email == email)).first()
        user_id = user.user_id  # type: ignore[union-attr]
    if role_id is None:
        role = session.exec(select(Role).where(Role.role_name == role_name)).first()
        role_id = role.role_id  # type: ignore[union-attr]
    ur = User_Role(user_id=user_id, role_id=role_id)
    session.add(ur)
    session.commit()
    session.refresh(ur)
    return ur


def remove_user_role(
    *, session: Session, user_id: uuid.UUID, role_id: uuid.UUID
) -> None:
    ur = session.exec(
        select(User_Role).where(
            User_Role.user_id == user_id, User_Role.role_id == role_id
        )
    ).first()
    if ur:
        session.delete(ur)
        session.commit()


def get_user_roles(
    *, session: Session, user_id: uuid.UUID
) -> list[tuple[Role, User_Role]]:
    rows = session.exec(
        select(Role, User_Role)
        .join(User_Role, User_Role.role_id == Role.role_id)
        .where(User_Role.user_id == user_id)
    ).all()
    return list(rows)


# ---------------------------------------------------------------------------
# Backlogs
# ---------------------------------------------------------------------------


def create_backlog(
    *, session: Session, data: BacklogCreate, created_by: uuid.UUID
) -> Backlog_Item:
    item = Backlog_Item(**data.model_dump(), created_by=created_by)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def get_backlogs(
    *,
    session: Session,
    limit: int,
    offset: int,
    status: str | None,
    priority: str | None,
    created_by: uuid.UUID | None,
    order_by: str,
    direction: str,
):
    q = select(Backlog_Item)
    if status:
        q = q.where(Backlog_Item.status == status)
    if priority:
        q = q.where(Backlog_Item.priority == priority)
    if created_by:
        q = q.where(Backlog_Item.created_by == created_by)
    col = getattr(Backlog_Item, order_by, Backlog_Item.created_at)
    q = q.order_by(col.desc() if direction == "desc" else col.asc())
    total = len(session.exec(q).all())
    items = session.exec(q.offset(offset).limit(limit)).all()
    return items, total


def update_backlog(
    *, session: Session, item: Backlog_Item, data: BacklogUpdate
) -> Backlog_Item:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_backlog(*, session: Session, item: Backlog_Item) -> None:
    session.delete(item)
    session.commit()


# ---------------------------------------------------------------------------
# Features
# ---------------------------------------------------------------------------


def create_feature(*, session: Session, data: FeatureCreate) -> Feature:
    feat = Feature(**data.model_dump())
    session.add(feat)
    session.commit()
    session.refresh(feat)
    return feat


def get_features(
    *,
    session: Session,
    limit: int,
    offset: int,
    backlog_item_id: uuid.UUID | None,
    status: str | None,
):
    q = select(Feature)
    if backlog_item_id:
        q = q.where(Feature.backlog_item_id == backlog_item_id)
    if status:
        q = q.where(Feature.status == status)
    total = len(session.exec(q).all())
    feats = session.exec(q.offset(offset).limit(limit)).all()
    return feats, total


def update_feature(*, session: Session, feat: Feature, data: FeatureUpdate) -> Feature:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(feat, k, v)
    session.add(feat)
    session.commit()
    session.refresh(feat)
    return feat


def delete_feature(*, session: Session, feat: Feature) -> None:
    session.delete(feat)
    session.commit()


# ---------------------------------------------------------------------------
# Stories
# ---------------------------------------------------------------------------


def create_story(*, session: Session, data: StoryCreate) -> Story:
    s = Story(**data.model_dump())
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


def get_stories(
    *,
    session: Session,
    limit: int,
    offset: int,
    feature_id: uuid.UUID | None,
    status: str | None,
):
    q = select(Story)
    if feature_id:
        q = q.where(Story.feature_id == feature_id)
    if status:
        q = q.where(Story.status == status)
    total = len(session.exec(q).all())
    stories = session.exec(q.offset(offset).limit(limit)).all()
    return stories, total


def update_story(*, session: Session, story: Story, data: StoryUpdate) -> Story:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(story, k, v)
    session.add(story)
    session.commit()
    session.refresh(story)
    return story


def delete_story(*, session: Session, story: Story) -> None:
    session.delete(story)
    session.commit()


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


def create_task(*, session: Session, data: TaskCreate) -> Task:
    due = datetime.strptime(data.due_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    task = Task(
        story_id=data.story_id,
        parent_task_id=data.parent_task_id,
        title=data.title,
        description=data.description,
        status=data.status,
        priority=data.priority,
        due_date=due,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def get_tasks(
    *,
    session: Session,
    limit: int,
    offset: int,
    story_id: uuid.UUID | None,
    parent_task_id: uuid.UUID | None,
    status: str | None,
    priority: str | None,
    assigned_to: uuid.UUID | None,
    due_before: datetime | None,
    due_after: datetime | None,
    order_by: str,
    direction: str,
):
    q = select(Task)
    if story_id:
        q = q.where(Task.story_id == story_id)
    if parent_task_id is not None:
        q = q.where(Task.parent_task_id == parent_task_id)
    if status:
        q = q.where(Task.status == status)
    if priority:
        q = q.where(Task.priority == priority)
    if due_before:
        q = q.where(Task.due_date <= due_before)
    if due_after:
        q = q.where(Task.due_date >= due_after)
    if assigned_to:
        q = q.join(Task_Assignments, Task_Assignments.task_id == Task.task_id).where(
            Task_Assignments.assigned_to == assigned_to
        )
    col = getattr(Task, order_by, Task.due_date)
    q = q.order_by(col.desc() if direction == "desc" else col.asc())
    total = len(session.exec(q).all())
    tasks = session.exec(q.offset(offset).limit(limit)).all()
    return tasks, total


def update_task(*, session: Session, task: Task, data: TaskUpdate) -> Task:
    patch = data.model_dump(exclude_unset=True)
    if "due_date" in patch and patch["due_date"]:
        patch["due_date"] = datetime.strptime(patch["due_date"], "%Y-%m-%d").replace(
            tzinfo=timezone.utc
        )
    for k, v in patch.items():
        setattr(task, k, v)
    task.updated_at = _now()
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_task(*, session: Session, task: Task) -> None:
    session.delete(task)
    session.commit()


def get_subtasks(*, session: Session, task_id: uuid.UUID) -> list[Task]:
    return list(session.exec(select(Task).where(Task.parent_task_id == task_id)).all())


# ---------------------------------------------------------------------------
# Task Assignments
# ---------------------------------------------------------------------------


def get_assignments(*, session: Session, task_id: uuid.UUID) -> list[Task_Assignments]:
    return list(
        session.exec(
            select(Task_Assignments).where(Task_Assignments.task_id == task_id)
        ).all()
    )


def create_assignment(
    *,
    session: Session,
    task_id: uuid.UUID,
    data: AssignmentCreate,
    assigned_by: uuid.UUID,
) -> Task_Assignments:
    a = Task_Assignments(
        task_id=task_id,
        assigned_to=data.assigned_to,
        assigned_by=assigned_by,
        reason=data.reason,
    )
    session.add(a)
    session.commit()
    session.refresh(a)
    return a


def delete_assignment(*, session: Session, a: Task_Assignments) -> None:
    session.delete(a)
    session.commit()
