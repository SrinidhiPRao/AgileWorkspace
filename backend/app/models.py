from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, EmailStr
from sqlmodel import SQLModel, Field
from sqlalchemy import DateTime


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


class UserBase(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr = Field(unique=True, max_length=255)
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    user_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    is_superuser: bool = False
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class UserUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    is_active: bool | None = None


class UserPublic(SQLModel):
    user_id: uuid.UUID
    name: str | None
    email: EmailStr
    is_active: bool
    created_at: datetime | None
    roles: list["RolePublic"] = []


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------


class RoleCreate(SQLModel):
    role_name: str
    description: str | None = None


class Role(SQLModel, table=True):
    role_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    role_name: str = Field(unique=True)
    description: str | None = None


class RolePublic(SQLModel):
    role_id: uuid.UUID
    role_name: str
    description: str | None = None
    assigned_at: datetime | None = None  # populated manually when returned via user


class User_Role(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.user_id", primary_key=True)
    role_id: uuid.UUID = Field(foreign_key="role.role_id", primary_key=True)
    assigned_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# ---------------------------------------------------------------------------
# Backlogs
# ---------------------------------------------------------------------------


class BacklogCreate(SQLModel):
    title: str
    description: str
    priority: str  # low | medium | high
    status: str  # to-do | in-progress | completed


class BacklogUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    status: str | None = None


class BacklogCreatedBy(SQLModel):
    user_id: uuid.UUID
    name: str | None


class BacklogPublic(SQLModel):
    backlog_item_id: uuid.UUID
    title: str
    description: str
    priority: str
    status: str
    created_by: BacklogCreatedBy
    created_at: datetime | None


class Backlog_Item(SQLModel, table=True):
    backlog_item_id: uuid.UUID | None = Field(
        default_factory=uuid.uuid4, primary_key=True
    )
    created_by: uuid.UUID = Field(foreign_key="user.user_id")
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# ---------------------------------------------------------------------------
# Features
# ---------------------------------------------------------------------------


class FeatureCreate(SQLModel):
    backlog_item_id: uuid.UUID
    title: str
    description: str
    status: str


class FeatureUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None


class FeaturePublic(SQLModel):
    feature_id: uuid.UUID
    backlog_item_id: uuid.UUID
    backlog_item_title: str | None = None
    title: str
    description: str
    status: str


class Feature(SQLModel, table=True):
    feature_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    backlog_item_id: uuid.UUID = Field(foreign_key="backlog_item.backlog_item_id")
    title: str
    description: str
    status: str


# ---------------------------------------------------------------------------
# Stories
# ---------------------------------------------------------------------------


class StoryCreate(SQLModel):
    feature_id: uuid.UUID
    title: str
    description: str
    status: str


class StoryUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None


class StoryPublic(SQLModel):
    story_id: uuid.UUID
    feature_id: uuid.UUID
    feature_title: str | None = None
    title: str
    description: str
    status: str


class Story(SQLModel, table=True):
    story_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    feature_id: uuid.UUID = Field(foreign_key="feature.feature_id")
    title: str
    description: str
    status: str


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


class TaskCreate(SQLModel):
    story_id: uuid.UUID
    parent_task_id: uuid.UUID | None = None
    title: str
    description: str
    status: str
    priority: str
    due_date: str  # YYYY-MM-DD, parsed in route


class TaskUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: str | None = None


class TaskSubtaskPublic(SQLModel):
    task_id: uuid.UUID
    title: str
    status: str
    priority: str


class AssignedUserPublic(SQLModel):
    user_id: uuid.UUID
    name: str | None


class AssignmentPublic(SQLModel):
    task_assignment_id: uuid.UUID
    assigned_to: AssignedUserPublic
    assigned_by: AssignedUserPublic
    assigned_at: datetime | None
    reason: str


class TaskPublic(SQLModel):
    task_id: uuid.UUID
    story_id: uuid.UUID
    story_title: str | None = None
    parent_task_id: uuid.UUID | None
    title: str
    description: str
    status: str
    priority: str
    due_date: datetime
    created_at: datetime | None
    updated_at: datetime | None
    assignments: list[AssignmentPublic] = []
    subtasks: list[TaskSubtaskPublic] = []


class Task(SQLModel, table=True):
    task_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    story_id: uuid.UUID = Field(foreign_key="story.story_id")
    parent_task_id: uuid.UUID | None = Field(default=None, foreign_key="task.task_id")
    title: str
    description: str
    status: str
    priority: str
    due_date: datetime
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# ---------------------------------------------------------------------------
# Task Assignments
# ---------------------------------------------------------------------------


class AssignmentCreate(SQLModel):
    assigned_to: uuid.UUID
    reason: str


class Task_Assignments(SQLModel, table=True):
    task_assignment_id: uuid.UUID | None = Field(
        default_factory=uuid.uuid4, primary_key=True
    )
    task_id: uuid.UUID = Field(foreign_key="task.task_id")
    assigned_to: uuid.UUID = Field(foreign_key="user.user_id")
    assigned_by: uuid.UUID = Field(foreign_key="user.user_id")
    assigned_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    reason: str


# ---------------------------------------------------------------------------
# Auth / token schemas
# ---------------------------------------------------------------------------


class UserRegister(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenPayload(SQLModel):
    sub: str | None = None


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 3600


# ---------------------------------------------------------------------------
# Pagination envelope
# ---------------------------------------------------------------------------


class PaginatedResponse(SQLModel):
    total: int
    limit: int
    offset: int
