#!/bin/bash

stdW=26100
stdH=19129

GREY='\033[1;37m'
DGREY='\033[1;30m'
RED='\033[1;31m'
GREEN='\033[1;32m'
PURPLE='\033[1;35m'
NC='\033[0m'

die() {
	echo -e "${RED}$@${NC}"
	exit 1
}

checkDep() {
    for prog in "$@"; do
        command -v $prog >/dev/null 2>&1 || die "Please install these dependencies first: $@"
    done
}

checkDep sed parallel gdal2tiles.py identify

cd "${0%/*}" # cd to script dir
cd layers

# checking that we have correct source images first
read baseW  baseH  <<< $(identify -format '%w %h' base.png)
read devW   devH   <<< $(identify -format '%w %h' dev.png)
read ptW    ptH    <<< $(identify -format '%w %h' pt.png)
read infraW infraH <<< $(identify -format '%w %h' infra.png)

if [[
		"$baseW"  != "$stdW" || "$baseH"  != "$stdH" ||
		"$devW"   != "$stdW" || "$devH"   != "$stdH" ||
		"$ptW"    != "$stdW" || "$ptH"    != "$stdH" ||
		"$infraW" != "$stdW" || "$infraH" != "$stdH"

	]]
then
	die "layer(s) size is incorrect, correct size is ${stdW}x${stdH}"
fi

# running tasks in parallel (based on a number of your cpu cores)
echo 'gdal2tiles.py -p raster -w none base.png base
      gdal2tiles.py -p raster -w none dev.png dev
      gdal2tiles.py -p raster -w none pt.png pt
      gdal2tiles.py -p raster -w none infra.png infra' | parallel --bar --halt now,fail=1 :::: || die "tiles generation failed"

if [ "$1" == "dev" ]; then
	mkdir ../src/root/tiles
	mv base ../src/root/tiles/base-{MAPDEV}
	mv dev ../src/root/tiles/dev-{MAPDEV}
	mv pt ../src/root/tiles/pt-{MAPDEV}
	mv infra ../src/root/tiles/infra-{MAPDEV}
else
	commit=$(git rev-parse --short HEAD)

	rm -rf ../dist
	mkdir -p ../dist/tiles
	mv base ../dist/tiles/base-$commit
	mv dev ../dist/tiles/dev-$commit
	mv pt ../dist/tiles/pt-$commit
	mv infra ../dist/tiles/infra-$commit

	cd ..

	cp -r src/root/* dist

	# replacing internal values with short commit id
	sed -i "s/{MAPDEV}/$commit/g" dist/index.html
	sed -i "s/{MAPDEV}/$commit/g" dist/res/map-v2.js
fi
