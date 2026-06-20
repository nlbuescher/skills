# Workspace Guidance

- No absolute paths. Use relative paths or `~/`.
- Treat files in this workspace as the editable source of truth.
- Treat installed skill copies under `~/.agents/` as runtime artifacts and read-only reference material.
    - When rewriting an installed skill into this workspace, treat the entire skill folder as input.
    - Read and account for any companion files in the source directory before claiming semantic parity.
- Only copy from `~/.agents/` into the workspace when the workspace intentionally vendors or derives from an installed skill and the spec or user request says to do that.
