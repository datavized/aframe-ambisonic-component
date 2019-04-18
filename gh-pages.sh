#!/bin/bash
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"
git checkout master
npx webpack --config ./config/webpack-prod.js --mode production -o gh-pages/aframe-ambisonic-component.js
tar cf -  -C ./examples/ $(git ls-files examples | sed -e 's/^examples\//\.\//') | (cd ./gh-pages; tar xf -)
npx gh-pages -d ./gh-pages
rm -rf gh-pages/*
rmdir gh-pages