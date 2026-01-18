import logging
import os
from threading import Thread

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        # Django's autoreloader spawns a parent process that shouldn't run start-up tasks
        if os.environ.get("RUN_MAIN") != "true":
            return

        from api.ml_service import get_ml_service  # noqa: PLC0415

        def warm_models():
            try:
                logger.info("MLService warm-up starting")
                get_ml_service().ensure_models_loaded()
                logger.info("MLService warm-up complete")
            except Exception as exc:  # pragma: no cover - startup diagnostics only
                logger.warning("MLService warm-up failed: %s", exc, exc_info=True)

        Thread(target=warm_models, name="ml-service-warmup", daemon=True).start()
