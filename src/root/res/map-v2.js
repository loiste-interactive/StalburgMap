// WARNING!
// this code is bad and full of shit
// must be careful not to go too deep

function setHash(str) {
	if ("replaceState" in history) {
	    history.replaceState(undefined,undefined,'#' + str);
	} else {
	    location.hash = '#' + str;
	}
}

function removeHash() {
    var scrollV, scrollH, loc = window.location;
    if ("replaceState" in history)
    	history.replaceState({}, document.title, ".");
    else {
        scrollV = document.body.scrollTop;
        scrollH = document.body.scrollLeft;
        loc.hash = "";
        document.body.scrollTop = scrollV;
        document.body.scrollLeft = scrollH;
    }
}

docReady(function() { // for great js COMPATIBILITY (see docready.js, this shit is hilarious)

	locations = L.layerGroup();
	pt = L.layerGroup();
	mark_route = L.layerGroup();

	var stalburg_base = L.tileLayer('tiles/base-{MAPDEV}/{z}/{x}/{y}.png', {
		maxZoom: 7,
		minZoom: 3,
		tms: true,
		continuousWorld: true,
		noWrap: true
	});

	var stalburg_dev = L.tileLayer('tiles/dev-{MAPDEV}/{z}/{x}/{y}.png', {
		maxZoom: 7,
		minZoom: 3,
		tms: true,
		continuousWorld: true,
		noWrap: true
	});

	var stalburg_pt = L.tileLayer('tiles/pt-{MAPDEV}/{z}/{x}/{y}.png', {
		maxZoom: 7,
		minZoom: 3,
		tms: true,
		continuousWorld: true,
		noWrap: true
	}).addTo(pt);

	var stalburg_infra = L.tileLayer('tiles/infra-{MAPDEV}/{z}/{x}/{y}.png', {
		maxZoom: 7,
		minZoom: 3,
		tms: true,
		continuousWorld: true,
		noWrap: true,
		attribution: 'INFRA levels by <a href="https://tonyfox.ws/">TonyRaccoon</a>'
	});

	var southWest = new L.LatLng(-85.04923290826918,-179.96704101562503,true),
		northEast = new L.LatLng(28.835049972635176,106.73217773437501,true),
		bounds = new L.LatLngBounds(southWest, northEast);

	map = L.map('map', {
		attributionControl: false,
		maxBounds: bounds,
		maxBoundsViscosity: 1.0,
		zoom: 3,
		scrollWheelZoom: true,
		layers: [stalburg_base]
	}).setView([-73.13451013251789,-29.410400390625004],5);

	L.control.attribution({prefix: 'made by <a href="http://deseven.info/">deseven</a>, based on original <a href="https://loisteinteractive.com/">Loiste</a> maps, powered by <a href="https://leafletjs.com/">Leaflet</a>'}).addTo(map);

	// all this stuff is now in different files called objects.js and mark.js
	initObjects();
	initMark();

	map.addLayer(pt);
	map.addLayer(locations);

	var baseLayers = {
	    'Stalburg': stalburg_base
	};

	var overlayMaps = {
		'<span class="fas fa-map-marker-alt"></span> Locations': locations,
		'<span class="fas fa-subway"></span> Public Transport': pt,
	    '<span class="fas fa-map"></span> INFRA levels': stalburg_infra,
	    '<span class="fas fa-child"></span> Mark\'s Route': mark_route,
	    '<span class="fas fa-comment"></span> Dev Commentary': stalburg_dev
	};

	L.control.layers(baseLayers,overlayMaps, {
		collapsed: false,
		hideSingleBase: true
	}).addTo(map);

	// if we're coming from stalburg wiki we should display a go back control
	if (document.referrer.indexOf("stalburg.arctar.us") > -1 || document.referrer.indexOf("stalburg.net") > -1) {
		var backToWiki = L.control({
	    	position : 'topcenter'
		});
		backToWiki.onAdd = function(map) {
	    	this._div = L.DomUtil.create('div','backToWikiControl');
	    	this._div.innerHTML = '<a href="' + document.referrer + '">back to Stalburg Wiki</a>';
	    	return this._div;
		}

		backToWiki.addTo(map);
	}

	promptCoordinates = false;
	if (window.location.hash.substring(1).toLowerCase() == 'enable_latlng_selector') {
		promptCoordinates = true;
	}

	if (window.location.hash.substring(1).toLowerCase()) {
		var loc;
		if (window.location.hash.substring(1).toLowerCase().startsWith('loc:')) {
			loc = window.location.hash.substring(1).toLowerCase().split(':');
			loc = loc[1].split(',');
			map.setView([loc[0],loc[1]],loc[2]);
		} else {
			if (eval('typeof _' + window.location.hash.substring(1).toLowerCase()) !== 'undefined') { // yeah, i actually use eval() on user-editable data because security is a priority!
				loc = eval('_' + window.location.hash.substring(1).toLowerCase());
			} else if (eval('typeof ' + window.location.hash.substring(1).toLowerCase()) !== 'undefined') {
				loc = eval(window.location.hash.substring(1).toLowerCase());
			}
			if (typeof loc === 'object') {
				if (typeof loc.togglePopup === 'function') {
					if (typeof loc.getCenter === 'function') {
						map.setView(loc.getCenter());
					} else if (typeof loc.getLatLng === 'function') {
						map.setView(loc.getLatLng());
					}
					loc.togglePopup();
				}
			}
		}
	}

	map.on('click',function(e){
		removeHash();
		var coord = e.latlng;
		var lat = coord.lat;
		var lng = coord.lng;
		if (promptCoordinates) {
			console.log('map coords: [' + lat + ',' + lng + ']');
			prompt('map coords',lat + ',' + lng);
		}
	});

	map.on('moveend',function(e){
		var anyPopupActivated = false;
		locations.eachLayer(function(l){
			if (l.getPopup().isOpen()) {
				anyPopupActivated = true;
				// and you can't actually break easily from this loop, because why would you want to?
				// js knows better anyway
			}
		});
		if (!anyPopupActivated) {
			var latlng = map.getCenter();
			latlng.lat = Math.round(latlng.lat * 1000) / 1000; // this shit exists only
			latlng.lng = Math.round(latlng.lng * 1000) / 1000; // because js can't into math
			setHash('loc:' + latlng.lat + ',' + latlng.lng + ',' + map.getZoom());
		}
	});

	var legend = L.control({position: 'bottomleft'});

	legend.onAdd = function (map) {

		var div = L.DomUtil.create('div','ptLegendControl');
		div.innerHTML = '<img src="res/images/pt-legend.png?2" width="485" height="165">'; // sorry i'm bad with html/css so it was easier to make a legend as an image
		return div;
	};

	legend.addTo(map);

	// this adds/removes pt legend on layer selection
	map.on('layeradd',function(e){
		if (map.hasLayer(pt)) {
			if (!legend._map) {
				legend.addTo(map);
			}
		}
	});
	map.on('layerremove',function(e){
		if (!map.hasLayer(pt)) {
			if (legend._map) {
				map.removeControl(legend);
			}
		}
	});

});
