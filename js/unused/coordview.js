// Coordinated View Geovisualization
//d3.json('assets/earthquakes.geojson').then(function(data) { // d3 v5 version
d3.json('assets/earthquakes.geojson', function(data) { // d3 v4 version


    //////////////////////////////////////////////////PREP THE DATA////////////////////////////////////////////////////////
    //create crossfilter passes each feature to the filter. We have to pass it through the crossfilter before we can split up with data using
    //the .dimensions() method
    var filter = crossfilter(data.features); //passes the features to the crossfilter

    // groups everything together into one group, this is used to quickly search all of the data at once
    var all = filter.groupAll();


    //Takes each of the records of the dataset and returns each individual line so that they can be used. .dimension() puts
    // the data into an easily searchable/manipulable format for DC
    var everything = filter.dimension(function(d) {
        return d
    });

    //////////////////////////////////////////////SORT THE DATA///////////////////////////////////////////////////////////
    //Now that we have our initial data imported and in the right format using crossfilter we now have to sort out the data that we want to display, set up
    //the chart space and populate the graphs

    //returns the geometry for each feature; this is the points at which each earthquake happened
    var geomDimension = filter.dimension(function(d) {
        return d.geometry
    });

    //defines the categories from magnitude property using a lamda operation
    var magDimension = filter.dimension(function(d) {

        //lamda operations are simple version of if/else statements. EX: If mag is less than 1.2 return the first element, else continue to the second element
        var mag = d.properties.mag; //replace with omega_arag magnitude
        return mag < 1.0 ? '0-1' :
            mag < 1.25 ? '1-1.25' :
                mag < 1.5 ? '1.25-1.5' :
                    mag < 1.75 ? '1.5-1.75' :
                        mag < 2 ? '1.75-2' :
                            '>2'
    });


    //sorts through the data and finds the depth of each earthquake. Then returns a category based on the depth using the lamda operations
    var depthDimension = filter.dimension(function(d) {
        var depth = d.properties.depth;  // replace with sum_stress_months
        return depth < 5 ? ' <5' :
            depth < 10 ? ' 5-10' :
                depth < 50 ? '10-50' :
                    depth < 100 ? '50-100' :
                        '>100'
    });

    var dateDimension = filter.dimension(function(d) {

        return d3.timeDay(new Date(d.properties.time));  // replace with yyyy-mm
    });

    /////////////////////////////////////////GROUP THE DATA///////////////////////////////////////////////////////////////
    // Now that we have the mag dimension captured in an object we have to group them all together so that we can use them
    var magDimensionGroup = magDimension.group();

    var depthDimensionGroup = depthDimension.group();

    var dateDimensionGroup = dateDimension.group(); //

    ///////////////////////////////////////////////ADD THE MARKERS TO THE MAP///////////////////////////////////////////////
    var geoJsonLayer = L.geoJson({
        type: 'FeatureCollection',
        features: geomDimension.top(Infinity) //starts selecting from the .top() and goes until...infinity
    }, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: Math.pow(feature.properties.mag, 2) / 2,  // replace with omega_arag magnitude
                fillColor: "red",
                color: "#fff",
                weight: 1,
                stroke: false,
                opacity: 0,
                fillOpacity: 0
            })
        }
//                    onEachFeature: function(feature, layer) {
//                        layer.bindTooltip(feature.properties.mag.toString());
//                    }
    }).addTo(map);

    /////////////////////////////////////CREATE THE CHARTS////////////////////////////////////////////////////////////////
    //binds the barChart  to the <div> elements that we created earlier in the <body>
    var magChart = dc.barChart('#mag-chart');
    //define the characteristics of the chart before we actually add the data to it
    magChart
        .height(100) //pixel height of the chart
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 40
        }) //margins of the chart
        .dimension(magDimension) //pulls in the mag data
        .group(magDimensionGroup) //is the functions of the data; created earlier
        .elasticY(true) //allows for an OTF adjustable y axis
        .x(d3.scaleOrdinal()) //Do this because there are ORDERs of MAGNITUDE; Its the scale that we want in the chart
        .xUnits(dc.units.ordinal)
        .yAxis() //pulls in data from the dataset
        .ticks(3); //number of ticks in a chart


    var depthChart = dc.barChart('#depth-chart');

    depthChart
        .height(100)
        .margins({
            top: 10,
            right: 50,
            bottom: 30,
            left: 40
        })
        .dimension(depthDimension)
        .group(depthDimensionGroup)
        .elasticY(true)
        .x(d3.scaleOrdinal())
        .xUnits(dc.units.ordinal)
        .yAxis()
        .ticks(3);


    var dateChart = dc.lineChart('#date-chart');
    dateChart
        .renderArea(true) //area or lines
        .height(150)
        .transitionDuration(1000) //how long it takes to transition
        .margins({
            top: 30,
            right: 50,
            bottom: 25,
            left: 40
        })
        .dimension(dateDimension)
        .group(dateDimensionGroup)
        .elasticY(true)
        .x(d3.scaleTime().domain([new Date(2016, 7, 15), new Date(2016, 8, 1)])) //
        .xUnits(d3.timeDays); //timeDate object that has the format for the date

    /////////////////////////////////////////DRAW ALL THE CHARTS//////////////////////////////////////////////////////////
    dc.renderAll(); //activates everything
    //we can render things one at a time but it is more efficient (and easier) to render everything at the end


    ////////////////////////////////////////LISTEN FOR CHANGES ON THE MAP//////////////////////////////////////////////////

    //define in functions what we want to have happen to the map
    //This function sees which features are in the bounding box and returns the points that are in it; This filters the
    //data for the charts and map.
    function updateMapFilter() {
        geomDimension.filter(function(d) {
            return map.getBounds().contains(L.geoJSON(d).getBounds())
        });
        dc.redrawAll();
    }

    function updateMap() {
        geoJsonLayer.clearLayers(); //removes everything
        geoJsonLayer.addData({ //adds the new data to the map/chart within the scope of the filter
            type: 'FeatureCollection',
            features: everything.top(Infinity)
        });
    }


    //selects the map and runs a filter function on it once it's done moving and zooming
    map.on('zoomend moveend', function() { //passes the zoom and move locations as the new filter
        updateMapFilter(); //triggers the new function
    });

    //When the chart is "filtered" it runs the function to update the map
    magChart.on('filtered', function(chart, filter) {
        updateMap() //calls the update map function
    });

    depthChart.on('filtered', function(chart, filter) {
        updateMap()
    });

    dateChart.on('filtered', function(chart, filter) {
        updateMap()
    });

});
