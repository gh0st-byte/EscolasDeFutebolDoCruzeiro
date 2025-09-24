#!/bin/bash
$date = date +%Y-%m-%d
git add .
git status
git commit -m "update $date"
git push origin main