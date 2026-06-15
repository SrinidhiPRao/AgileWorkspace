from fastapi import APIRouter

from app.api.routes.login import router as login_router
from app.api.routes.users import router as users_router
from app.api.routes.roles import router_roles
from app.api.routes.backlogs import router_backlogs
from app.api.routes.features import router_features
from app.api.routes.stories import router_stories
from app.api.routes.tasks import router_tasks

api_router = APIRouter()

api_router.include_router(login_router)
api_router.include_router(users_router)
api_router.include_router(router_roles)
api_router.include_router(router_backlogs)
api_router.include_router(router_features)
api_router.include_router(router_stories)
api_router.include_router(router_tasks)
