"""Keep the classroom API tests off the Google gate.

The flag is ignored when VERCEL is set. See app.gate.google_gate_required.
"""

import os

os.environ["FATHOM_TESTING"] = "1"
