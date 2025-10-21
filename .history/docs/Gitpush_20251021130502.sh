#!/bin/bash
set -e

$date=$(date +%Y-%m-%d)

if ! git add .; then
    echo "Erro ao adicionar arquivos"
    exit 1
fi

git status

if ! git commit -m "update $date"; then
    echo "Erro no commit (talvez não há mudanças)"
    exit 1
fi

if ! git push origin main; then
    echo "Erro ao fazer push"
    exit 1
fi

echo "Pushed to GitHub successfully!"