// inspired by https://github.com/IHCantabria/Leaflet.CanvasLayer.Field
// developed by and with https://github.com/briangkatz/vector-field-animation


// Create the Leaflet map object to place inside the Map div (id="map")
var map = L.map("map");

// Assign a Leaflet Tile Layer Basemap from CartoDB, Mapbox, etc.
var url = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png';  // replace the URL with a basemap of your choosing
L.tileLayer(url, {
    attribution: 'CartoDB', // attribute the source of your basemap
    maxZoom: 10,  // set the max zoom level
    minZoom: 5  // set the min zoom level
}).addTo(map);  // add the base map to the Leaflet map object

// Bounding Box
var corner1 = L.latLng(51, -126),
    corner2 = L.latLng(24.396308, -66.885444),
    bounds = L.latLngBounds(corner1, corner2);
map.fitBounds(bounds);  // fit the map bounds to the bounding box specified


// ScalarField derived from a Vectorfield (from IHCantabria Leaflet.CanvasLayer.Field)
d3.text('assets/vector_field/july_jan_mag_u.asc', function (u) { // add the U data in ASCIIGrid (.asc) format
    d3.text('assets/vector_field/july_jan_mag_v.asc', function (v) { // add the V data in ASCIIGrid (.asc) format (if you want to see a flowing example, replace the V data with the v data (arag_2050_07_v_original.asc)
        d3.text('assets/vector_field/july_mean.asc', function (mean) { // add in another magnitude / scalar field raster to visualize - for each subsequent input, you have to add / nest an additional d3.text() command. be sure to end with another )}; at the end!

        var toMetersPerSecond = 1; // coefficient multiplied with the U and V data to determine the speed (magnitude) of the animated vector field; larger coefficient result in faster animation speeds (larger magnitudes), smaller coefficient (i.e. decimals) result in slower animation speeds (smaller magnitudes); **This number may need to be modified to normalize the data values as close to their original values as possible. A coefficient very large will overstate the data values, and a small coefficient may understate the data values** Original example was 0.001
        var vf = L.VectorField.fromASCIIGrids(u, v, toMetersPerSecond);  // create the vector field

        // a) First derived field: Magnitude (m/s, or difference in SIF from jan to july)
        var s = vf.getScalarField('magnitude');  // << derived ScalarField
        // custom scale, based on 'earth.nullschool.net' (example:  https://earth.nullschool.net/#current/ocean/surface/currents/overlay=currents/equirectangular=-11.95,29.62,1112)
        var magnitude = L.canvasLayer.scalarField(s, {
            //color: chroma.scale(
            //    ['#E0631D', '#E0631D', '#A5BF15', '#FFFFFF', '#C9F5F6'], [-1.5, -1, 0, 0.5, 1]  // set color scale and break points for styling of magnitude layer
            //),
            //color: chroma.scale('YlGn', [-1.5, -1, 0, 0.5, 1]).gamma(0.75),
            color: chroma.scale(
                ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1]  // set color scale and break points for styling of magnitude layer
            ),
            opacity: 0.75 // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
        }).addTo(map);  // addTo(map) displays the layer on page-load vs. removing it keeps the layer off the map until the check-box is selected in the Leaflet layer control (see direction layer below for example)

        // b) Second derived field: DirectionFrom (º): (0 to 360º) | N is 0º and E is 90º
        var direction = L.canvasLayer.scalarField(
            vf.getScalarField('directionFrom'), {
                type: 'vector',
                color: '#DCDBDB',  // set color of direction arrows
                vectorSize: 20,  // set the size of the direction arrows
                arrowDirection: 'from'
            });

        // c) Animation field
        var animation = L.canvasLayer.vectorFieldAnim(vf, {
            id: "canvas",
            paths: 10000,  // set the number of concurrent animations; 1 is one movement animated at a time, 5000 is five thousand movements animated at a time
            fade: 0.97, // 0 animates sharp point movements with no line visible; 1 animates streamlike paths with an always-visible line; anything between 0 and 1 creates a line that fades away after the animation movement
            maxAge: 100,  // how many milliseconds should the animated movement last from start to end points
            velocityScale: 1 / 50,  // a velocityScale of 1 results in a crazy fast animation speed, and a velocityScale of 0 results in no animation whatsoever (no velocity) -- therefore, set velocityScale to a fraction value instead (i.e. 1 / 200). A fraction closer to 1 (i.e. smaller denominator; e.g. 1 / 50) will be faster than a fraction closer to 0 (i.e. larger denominator; e.g. 1 / 200)
            color: 'rgba(255, 255, 255, 0.7)'  // set color and opacity of animation
        }).addTo(map);

        // d) additional magnitude / raster field
        var t = L.ScalarField.fromASCIIGrid(mean);
        var julymean = L.canvasLayer.scalarField(t, {
                color: chroma.scale(
                    ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1]  // set color scale and break points for styling of magnitude layer
                ),
                opacity: 0.75 // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
            });



        // e) Layer control

        // Define layer groups - group layers so that they are toggled on and off together

        var seasonal_nhemis = L.layerGroup([animation, magnitude]);
        var seasonal_shemis = L.layerGroup([animation, direction]); // stand in for southern hemisphere greenup
        var raw_mean = L.layerGroup([julymean]);


        // Define layer groups - that will display in groups, in the Layer Control. Only one can be on at a time. Can still be turned on and off individually

            var seasonal_maps = {
                "Northern Hemisphere": seasonal_nhemis,
                "Southern Hemisphere": seasonal_shemis
            };

            var raster_maps = {
                "July Mean" : raw_mean
            };

            L.control.layers(seasonal_maps, raster_maps).addTo(map);

        // alt Leaflet layer control - for toggling between views of animation, magnitude, and direction layers. allows viewing any and all of these at the same time.
/*
        L.control.layers({}, {
        //    "Vector animation": animation,
        //    "Derived magnitude": magnitude,
        //    "Derived direction": direction,
        //    "July Mean": julymean,
            "Seasonal Greenup: Northern Hemisphere": seasonal_nhemis,
            "Raw July Mean": raw_mean,
        }, {
            position: 'topright',  // change to your preference
            collapsed: false  // false always displays check-boxes for the animation, magnitude, and direction layers; true creates a layer-selector icon which hides these check-boxes until hovered over or clicked on
        }).addTo(map);
*/

        /////// define legend
        var legend = L.control({position: 'bottomright'});
        // set legend color scale and breaks
        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'legend legend-colors');
            div.innerHTML += '<b>Change in SIF (W/m<sup>2</sup>/sr/&microm) - Average seasonal greenup from January to July</b><br><br>';
            div.innerHTML += '<i style="background: ' + '#EDF0AD' + '; opacity: 1"></i><p>Below -1</p><br>';
            div.innerHTML += '<i style="background: ' + '#E4F132' + '; opacity: 1"></i><p>-1 - -0.5</p><br>';
            div.innerHTML += '<i style="background: ' + '#98CA32' + '; opacity: 1"></i><p>-0.5 - 0</p><br>';
            div.innerHTML += '<i style="background: ' + '#559E54' + '; opacity: 1"></i><p>0 - 0.5</p><br>';
            div.innerHTML += '<i style="background: ' + '#10570F' + '; opacity: 1"></i><p>0.5 - 1</p><br>';
            return div;
        };

        legend.addTo(map);

        // create a popup displaying magnitude values when a pixel is clicked
        magnitude.on('click', function (e) {
            if (e.value !== null) {
                var v = e.value.toFixed(2);
                var html = (`<span class="popupText">SIF seasonal magnitude: ${v*2} </span>`); // multiply value by 2 to compensate for toMetersPerSecond 0.5
                var popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
            }
        });

        // create a popup displaying direction values when a pixel is clicked
        direction.on('click', function (e) {
            if (e.value !== null) {
                var v = e.value.toFixed(0);
                var html = (`<span class="popupText">direction: ${v}&deg;</span>`);
                var popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
            }
        });
    });
});
});

//// PRIORITY: how to make this a multiple view? add addtl divs? to display:
// time series? and/or
// "months above SIF = 1 W/m^2/s
// pixels above XX value in window?


//mult view tables on bottom of window div

//// next up: choose appropriate projection / basemap for data

//// next up: would be cool to be able to toggle between layers that show different seasonal and/or temporal changes / relationships. e.g., drought effects, southern hemisphere seasonality, different years.
// Add additional magnitude, scale vector layers. For: 2012 drought effects, northern hemisphere seasonality, southern hemisphere seasonality
// a way to toggle between legends

// https://leafletjs.com/examples/layers-control/

//// work with color scale -- or just choose one. update legend.

//// add favicon


////

//// add credit at bottom

//// add OSU cartography and geovisualization logo