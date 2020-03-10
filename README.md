# Stalburg Map
This is [the map of Stalburg](https://map.stalburg.net) repo. 

## Building the map
You'll need GDAL, ImageMagick and GNU Parallel - install those with your favourite package manager, for example `yum install gdal gdal-python ImageMagick parallel`. In some cases you may need to install Python bindings separately with `pip3 install gdal`.

After that just run `build.sh`. Expect to wait a couple of minutes or even more, tile generation isn't a fast process. If you see no errors, you should be good. Grab the `dist` folder and serve it with any webserver.

Run the same script with the `dev` parameter if you want to change map logic or work on locations, that way tiles will be placed in the `src` directory for you to be able to edit the js sources, and open `index.html` locally in your browser. **Never edit anything in `dist` directory, it's for distribution purposes only!**

## Internals
Main source file is `src/stalburg.svg`. It's a good idea to use [Inkscape](https://inkscape.org/) to open it, because unfortunately compatibility between various SVG editors is pretty low. However, in order to generate tiles for Leaflet (see above), we need to export everything to PNG first. Exported layers are also a part of the repo, they are located in `layers` dir.

The map consists of 4 main layers:
 - Base layer (roads, highways, streets and terrain);
 - Public transport (all train, metro and tram lines combined);
 - Developer commentary (small and somewhat useless, but still cool layer with handwritten notes from developers);
 - INFRA levels (all game levels as they are projected on a city map).

Each layer is a **26100** by **19129** pixels image with optional transparency. The resolution is important, because all locations are tied to it.

In order to export needed layer from Inkscape we can enable or disable object groups as needed.
![](https://d7.wtf/LithochromyScillaMetropolitical.png)

In other words, the map editing workflow looks like that:  
**SVG source** (`src/stalburg.svg`) >>> **4 PNG layers** (`layers/`) >>> **4 sets of tiles** (generated with `build.sh`).

Other important files:
 - `src/root/res/map-v2.js` - Main code file with all basic routines;
 - `src/root/res/mark.js` - Mark's route;
 - `src/root/res/objects.js` - Various map objects (station names, locations, aliases).

## Contributing
Feel free to open PRs with useful or not so useful changes.
