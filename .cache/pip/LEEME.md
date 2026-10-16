Caché local de ruedas para montar worktrees sin red (`worktree.preparar` usa `--no-index --find-links .cache/pip`).
Llénala una vez, con red, desde la raíz del proyecto:

    python3 -m pip download -d .cache/pip -r requirements-dev.txt

Y añade `.cache/pip/*.whl` y `*.tar.gz` a `.gitignore` si no quieres versionar las ruedas.
