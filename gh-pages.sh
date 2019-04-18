#!/bin/bash
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"
git checkout master

# Build production script into gh-pages directory
npx webpack --config ./config/webpack-prod.js --mode production -o gh-pages/aframe-ambisonic-component.js

# Copy only checked-in example files into gh-pages directory
tar cf -  -C ./examples/ $(git ls-files examples | sed -e 's/^examples\//\.\//') | (cd ./gh-pages; tar xf -)

# Deploy gh-pages directory to github pages
npx gh-pages -d ./gh-pages

# Clean up
rm -rf gh-pages/*
rmdir gh-pages