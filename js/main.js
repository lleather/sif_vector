// inspired by https://github.com/IHCantabria/Leaflet.CanvasLayer.Field
// developed by and with https://github.com/briangkatz/vector-field-animation


// Create the Leaflet map object to place inside the Map div (id="map")
var map = L.map("map");

// Assign a Leaflet Tile Layer Basemap from CartoDB, Mapbox, etc.
var url = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png';  // replace the URL with a basemap of your choosing
L.tileLayer(url, {
    // credit the data -- attribution not showing up yet
    attribution: '<a href="https://carto.com/attributions">CartoDB </a> | Vector Field by <a href = "https://github.com/IHCantabria/Leaflet.CanvasLayer.Field">IH Cantabria</a>, <a href = "https://d3js.org/">D3</a> | SIF Data &copy; <a href="https://avdc.gsfc.nasa.gov/pub/data/satellite/MetOp/GOME_F/">NASA</a> | Made By <a href = "https://github.com/lleather">Lila Leatherman</a>',
    //attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    //attribution: '&copy; <a href="https://carto.com/attributions">CartoDB,</a>',
    maxZoom: 8,  // set the max zoom level
    minZoom: 3  // set the min zoom level
}).addTo(map);  // add the base map to the Leaflet map object

/*
// Bounding Box - US
var corner1 = L.latLng(51, -126),
    corner2 = L.latLng(24.396308, -66.885444),
    bounds = L.latLngBounds(corner1, corner2);
map.fitBounds(bounds);  // fit the map bounds to the bounding box specified
*/

// Bounding Box - world
var corner1 = L.latLng(60, -150),
    corner2 = L.latLng(-60, 180),
    bounds = L.latLngBounds(corner1, corner2);
map.fitBounds(bounds);  // fit the map bounds to the bounding box specified



// ScalarField derived from a Vectorfield (from IHCantabria Leaflet.CanvasLayer.Field)
d3.text('assets/vector_field/july_jan_mag_u.asc', function (u_n) { // add the U data in ASCIIGrid (.asc) format
    d3.text('assets/vector_field/july_jan_mag_v.asc', function (v_n) { // add the V data in ASCIIGrid (.asc) format (if you want to see a flowing example, replace the V data with the v data (arag_2050_07_v_original.asc)
        d3.text('assets/vector_field/july_mean.asc', function (jul_mean) { // add in another magnitude / scalar field raster to visualize - for each subsequent input, you have to add / nest an additional d3.text() command. be sure to end with another )}; at the end!

            d3.text('assets/vector_field/jan_july_mag_u.asc', function (u_s) {
                d3.text('assets/vector_field/jan_july_mag_v.asc', function (v_s) {
                    d3.text('assets/vector_field/jan_mean.asc', function (ja_mean) {
                        // load in pre-calculated magnitude rasters; back-calculation doesn't provide same output. more a problem for the jan_july_mag
                        d3.text('assets/vector_field/jan_july_mag_simple.asc', function (jan_july_mag) {
                            d3.text('assets/vector_field/july_jan_mag_simple.asc', function (july_jan_mag) {




                    var toMetersPerSecond = 1; // coefficient multiplied with the U and V data to determine the speed (magnitude) of the animated vector field; larger coefficient result in faster animation speeds (larger magnitudes), smaller coefficient (i.e. decimals) result in slower animation speeds (smaller magnitudes); **This number may need to be modified to normalize the data values as close to their original values as possible. A coefficient very large will overstate the data values, and a small coefficient may understate the data values** Original example was 0.001

                    ////// for northern hemisphere visualization:    aka: july - january greenup

                    var vf_n = L.VectorField.fromASCIIGrids(u_n, v_n, toMetersPerSecond);  // create the vector field

                    // a) First derived field: Magnitude (m/s, or difference in SIF from jan to july)
                    var s_n = vf_n.getScalarField('magnitude');  // << derived ScalarField

                    // // custom scale, based on 'earth.nullschool.net' (example:  https://earth.nullschool.net/#current/ocean/surface/currents/overlay=currents/equirectangular=-11.95,29.62,1112)
                    // var magnitude_n = L.canvasLayer.scalarField(s_n, {
                    //     //color: chroma.scale(
                    //         //    ['#E0631D', '#E0631D', '#A5BF15', '#FFFFFF', '#C9F5F6'], [-1.5, -1, 0, 0.5, 1]  // set color scale and break points for styling of magnitude layer
                    //         //),
                    //         //color: chroma.scale('YlGn', [-1.5, -1, 0, 0.5, 1]).gamma(0.75),
                    //     color : chroma.scale(
                    //     ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                    //     ),
                    //     opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                    // interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                    // }).addTo(map);  // addTo(map) displays the layer on page-load vs. removing it keeps the layer off the map until the check-box is selected in the Leaflet layer control (see direction layer below for example)

                                // a2) addlt load of calculated magnitude raster...
                                var mag_n2 = L.ScalarField.fromASCIIGrid(july_jan_mag);
                                var magnitude_n = L.canvasLayer.scalarField(mag_n2, {
                                    color: chroma.scale(
                                        ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                                    ),
                                    opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                                    interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                                }).addTo(map);

                    // b) Second derived field: DirectionFrom (º): (0 to 360º) | N is 0º and E is 90º
                    var direction_n = L.canvasLayer.scalarField(
                        vf_n.getScalarField('directionFrom'), {
                        type: 'vector',
                        color: '#DCDBDB',  // set color of direction arrows
                        vectorSize: 20,  // set the size of the direction arrows
                        arrowDirection: 'from'
                    });

                    // c) Animation field
                    var animation_n = L.canvasLayer.vectorFieldAnim(vf_n, {
                        id: "canvas",
                        paths: 10000,  // set the number of concurrent animations; 1 is one movement animated at a time, 5000 is five thousand movements animated at a time
                        fade: 0.97, // 0 animates sharp point movements with no line visible; 1 animates streamlike paths with an always-visible line; anything between 0 and 1 creates a line that fades away after the animation movement
                        maxAge: 100,  // how many milliseconds should the animated movement last from start to end points
                        velocityScale: 1 / 50,  // a velocityScale of 1 results in a crazy fast animation speed, and a velocityScale of 0 results in no animation whatsoever (no velocity) -- therefore, set velocityScale to a fraction value instead (i.e. 1 / 200). A fraction closer to 1 (i.e. smaller denominator; e.g. 1 / 50) will be faster than a fraction closer to 0 (i.e. larger denominator; e.g. 1 / 200)
                        color: 'rgba(255, 255, 255, 0.7)'  // set color and opacity of animation
                    }).addTo(map);

                    // d) additional magnitude / raster field
                    var jul_n = L.ScalarField.fromASCIIGrid(jul_mean);
                    var july_mean = L.canvasLayer.scalarField(jul_n, {
                            color: chroma.scale(
                                ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                            ),
                         opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                        interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                        });



                    ////// for southern hemisphere visualization:    aka: july to january greenup

                    var vf_s = L.VectorField.fromASCIIGrids(u_s, v_s, toMetersPerSecond);  // create the vector field

                    // a) First derived field: Magnitude (m/s, or difference in SIF from jan to july)
                    var s_s = vf_s.getScalarField('magnitude');  // << derived ScalarField

                    // // custom scale, based on 'earth.nullschool.net' (example:  https://earth.nullschool.net/#current/ocean/surface/currents/overlay=currents/equirectangular=-11.95,29.62,1112)
                    // var magnitude_s = L.canvasLayer.scalarField(s_s, {
                    //     //color: chroma.scale(
                    //     //    ['#E0631D', '#E0631D', '#A5BF15', '#FFFFFF', '#C9F5F6'], [-1.5, -1, 0, 0.5, 1]  // set color scale and break points for styling of magnitude layer
                    //     //),
                    //     //color: chroma.scale('YlGn', [-1.5, -1, 0, 0.5, 1]).gamma(0.75),
                    //     color : chroma.scale(
                    //         ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                    //     ),
                    //     opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                    //     interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                    // });

                        // a2) addlt load of calculated magnitude raster...
                        var mag_s2 = L.ScalarField.fromASCIIGrid(jan_july_mag);
                        var magnitude_s = L.canvasLayer.scalarField(mag_s2, {
                            color: chroma.scale(
                                ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                            ),
                            opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                            interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                        });

                    // b) Second derived field: DirectionFrom (º): (0 to 360º) | N is 0º and E is 90º
                    var direction_s = L.canvasLayer.scalarField(
                        vf_s.getScalarField('directionFrom'), {
                            type: 'vector',
                            color: '#DCDBDB',  // set color of direction arrows
                            vectorSize: 20,  // set the size of the direction arrows
                            arrowDirection: 'from'
                        });

                    // c) Animation field
                    var animation_s = L.canvasLayer.vectorFieldAnim(vf_s, {
                        id: "canvas",
                        paths: 10000,  // set the number of concurrent animations; 1 is one movement animated at a time, 5000 is five thousand movements animated at a time
                        fade: 0.97, // 0 animates sharp point movements with no line visible; 1 animates streamlike paths with an always-visible line; anything between 0 and 1 creates a line that fades away after the animation movement
                        maxAge: 100,  // how many milliseconds should the animated movement last from start to end points
                        velocityScale: 1 / 50,  // a velocityScale of 1 results in a crazy fast animation speed, and a velocityScale of 0 results in no animation whatsoever (no velocity) -- therefore, set velocityScale to a fraction value instead (i.e. 1 / 200). A fraction closer to 1 (i.e. smaller denominator; e.g. 1 / 50) will be faster than a fraction closer to 0 (i.e. larger denominator; e.g. 1 / 200)
                        color: 'rgba(255, 255, 255, 0.7)'  // set color and opacity of animation
                    });

                    // d) additional magnitude / raster field
                    var jan_s = L.ScalarField.fromASCIIGrid(ja_mean);
                    var jan_mean = L.canvasLayer.scalarField(jan_s, {
                        color: chroma.scale(
                            ['#EDF0AD', '#E4F132', '#98CA32', '#559E54', '#10570F'], [-1, -0.5, 0, 0.5, 1.3]  // set color scale and break points for styling of magnitude layer
                        ),
                        opacity: 0.75, // 1 will block view of animation if magnitude layer is selected and brought to the front of the map object
                        interpolate: true, // uses bilinear interpolation to create a smoother-appearing surface
                    });





        // e) Layer control

        // Define layer groups - group layers so that they are toggled on and off together

        var seasonal_nhemis = L.layerGroup([animation_n, magnitude_n]);
        var seasonal_shemis = L.layerGroup([animation_s, magnitude_s]); // stand in for southern hemisphere greenup
        //var raw_mean = L.layerGroup([july_mean, jan_mean]);


        // // Define layer groups - that will display in groups, in the Layer Control. Only one can be on at a time. Can still be turned on and off individually
        //
        //     var seasonal_maps = {
        //         "Northern Hemisphere": seasonal_nhemis,
        //         "Southern Hemisphere": seasonal_shemis
        //     };
        //
        //     var raster_maps = {
        //         "July Mean" : july_mean,
        //         "January Mean" : jan_mean
        //     };
        //
        //     L.control.layers(seasonal_maps, raster_maps,
        //         {
        //             position: 'bottomleft',  // change to your preference
        //             collapsed: false  // false always displays check-boxes for the animation, magnitude, and direction layers; true creates a layer-selector icon which hides these check-boxes until hovered over or clicked on
        //         }).addTo(map);

        // alt Leaflet layer control - for toggling between views of animation, magnitude, and direction layers. allows viewing any and all of these at the same time.

        L.control.layers({}, {
        //    "Vector animation": animation,
        //    "Derived magnitude": magnitude,
        //    "Derived direction": direction,
        //    "July Mean": julymean,
            "Seasonal Greenup: Northern Hemisphere": seasonal_nhemis,
            "Seasonal Greenup: Southern Hemisphere": seasonal_shemis,
            "July Mean": july_mean,
            "January Mean" : jan_mean
        }, {
            position: 'bottomleft',  // change to your preference
            collapsed: false  // false always displays check-boxes for the animation, magnitude, and direction layers; true creates a layer-selector icon which hides these check-boxes until hovered over or clicked on
        }).addTo(map);


        /////// define legend
        var legend = L.control({position: 'bottomright'});
        // set legend color scale and breaks
        legend.onAdd = function () {
            var div = L.DomUtil.create('div', 'legend legend-colors');
            div.innerHTML += '<b>Change in SIF (W/m<sup>2</sup>/sr/&microm) - Average seasonal greenup</b><br><br>';
            div.innerHTML += '<i style="background: ' + '#EDF0AD' + '; opacity: 1"></i><p>Below -1</p><br>';
            div.innerHTML += '<i style="background: ' + '#E4F132' + '; opacity: 1"></i><p>-1 - -0.5</p><br>';
            div.innerHTML += '<i style="background: ' + '#98CA32' + '; opacity: 1"></i><p>-0.5 - 0</p><br>';
            div.innerHTML += '<i style="background: ' + '#559E54' + '; opacity: 1"></i><p>0 - 0.5</p><br>';
            div.innerHTML += '<i style="background: ' + '#10570F' + '; opacity: 1"></i><p>0.5 - 1.3</p><br>';
            return div;
        };

        legend.addTo(map);

        // create a popup displaying magnitude values when a pixel is clicked
        magnitude_n.on('click', function (e) {
            if (e.value !== null) {
                var v = e.value.toFixed(2);
                var html = (`<span class="popupText">SIF seasonal magnitude, July-Jan: ${v*2} </span>`); // multiply value by 2 to compensate for toMetersPerSecond 0.5
                var popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
            }
        });

                        magnitude_s.on('click', function (e) {
                            if (e.value !== null) {
                                var v = e.value.toFixed(2);
                                var html = (`<span class="popupText">SIF seasonal magnitude, Jan-July: ${v*2} </span>`); // multiply value by 2 to compensate for toMetersPerSecond 0.5
                                var popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
                            }
                        });

        // // create a popup displaying direction values when a pixel is clicked
        // direction.on('click', function (e) {
        //     if (e.value !== null) {
        //         var v = e.value.toFixed(0);
        //         var html = (`<span class="popupText">direction: ${v}&deg;</span>`);
        //         var popup = L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
        //     }
        // });



        });
});
});
        });
    });
});
});
});

// ends sections adding the data

//// PRIORITY: how to make this a multiple view? add addtl divs? to display:
// time series? and/or
// "months above SIF = 1 W/m^2/s
// pixels above XX value in window?


//mult view tables on bottom of window div

//// next up: choose appropriate projection / basemap for data



////

//// add credit at bottom


//// note: coordinated view example uses d3 v5. scalar field vector depends on d3 v4.

//