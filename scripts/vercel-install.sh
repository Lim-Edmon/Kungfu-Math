#!/bin/sh
set -e
npm install --production=false --foreground-scripts --include=optional
rm -rf node_modules/vite node_modules/@vitejs
npm install vite@5.4.11 @vitejs/plugin-react@4.3.4 --foreground-scripts --no-save
ls node_modules/@vitejs/plugin-react/dist | head -5
