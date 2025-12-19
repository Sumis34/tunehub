import os
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

# Files you want in the build output
INCLUDE_FILES = [
    "main.py",
    "app.py",
    "requirements.txt",
    "connection.py",
    "handlers.py",
    "sonos.py",
    "state.py",
]

# Directories you actually have — adjust this for YOUR repo
INCLUDE_DIRS = [
]

IGNORE_DIRS = {
    "__pycache__",
    ".venv",
    ".pytest_cache",
    "dist",
}

def copy_file(src, dest):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy2(src, dest)

def copy_dir(src, dest):
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        rel = os.path.relpath(root, src)
        dest_dir = os.path.join(dest, rel)
        os.makedirs(dest_dir, exist_ok=True)

        for file in files:
            shutil.copy2(os.path.join(root, file), os.path.join(dest_dir, file))

# Reset dist/
if os.path.exists(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)

# Copy single files
for file in INCLUDE_FILES:
    src = os.path.join(ROOT, file)
    if os.path.exists(src):
        copy_file(src, os.path.join(DIST, file))

# Copy directories
for folder in INCLUDE_DIRS:
    src = os.path.join(ROOT, folder)
    if os.path.exists(src):
        copy_dir(src, os.path.join(DIST, folder))

print("Python app built into dist/")
