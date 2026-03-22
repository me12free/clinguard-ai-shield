"""Default USE_ML=0 so pytest passes without torch; ML tests use @pytest.mark.ml."""
import os

import pytest


@pytest.fixture(autouse=True)
def _use_ml_env(request):
    if request.node.get_closest_marker("ml"):
        os.environ.pop("USE_ML", None)
    else:
        os.environ["USE_ML"] = "0"
    yield
    os.environ.pop("USE_ML", None)
