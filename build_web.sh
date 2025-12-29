#!/usr/bin/env bash

set -e

cd elytra-web
npm run build

mdbook build --dest-dir ./dist/ ../docs