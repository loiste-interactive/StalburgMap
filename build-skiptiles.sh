#!/bin/bash

cd "${0%/*}" # cd to script dir

commit=$(git rev-parse --short HEAD)

cp -rf src/root/res/ dist/
cp -f src/root/index.html src/root/favicon.ico dist/

# replacing internal values with short commit id
sed -i "s/{MAPDEV}/$commit/g" dist/index.html
sed -i "s/{MAPDEV}/$commit/g" dist/res/map-v2.js

# renaming existing tiles to match new commit id
mv -f dist/tiles/base-*  dist/tiles/base-$commit
mv -f dist/tiles/dev-*   dist/tiles/dev-$commit
mv -f dist/tiles/infra-* dist/tiles/infra-$commit
mv -f dist/tiles/pt-*    dist/tiles/pt-$commit
