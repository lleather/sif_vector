// Coordinated View Geovisualization
//d3.json('assets/earthquakes.geojson').then(function(data) { // d3 v5 version
d3.json('assets/vector_field/json/july_jan_mag_simple.geojson', function(july_mag) { // d3 v4 version
    d3.json('assets/vector_field/json/jan_july_mag_simple.geojson', function(jan_mag) { // d3 v4 version

    // if i also load in the jan_july mag... and parse the data differently... i can show the seasonal patterns for both subsets / datasets.

        //////
        //////////// JULY GREENUP DATA - PREP
        //////

        //////////////////////////////////////////////////PREP THE DATA////////////////////////////////////////////////////////
        //create crossfilter passes each feature to the filter. We have to pass it through the crossfilter before we can split up with data using
        //the .dimensions() method
        var filter_n = crossfilter(july_mag.features); //passes the features to the crossfilter

        // groups everything together into one group, this is used to quickly search all of the data at once
        var all_n = filter_n.groupAll();


        //Takes each of the records of the dataset and returns each individual line so that they can be used. .dimension() puts
        // the data into an easily searchable/manipulable format for DC
        var everything_n = filter_n.dimension(function(d1) {
            return d1
        });


        //defines the categories from magnitude property using a lamda operation
        var sifDimension_n = filter_n.dimension(function(d1) {

            //lamda operations are simple version of if/else statements. EX: If mag is less than 1.2 return the first element, else continue to the second element
            var sif = d1.properties.NA; //sif is called "NA" in this file...
            return sif < -1 ? '< -1' :
                sif < -0.5 ? '-1 - -0.5' :
                    sif < 0 ? '-0.5 - 0' :
                        sif < 0.5 ? '0 - 0.5' :
                            sif < 1 ? '0.5 - 1' :
                                '>1'
        });

        //returns the geometry for each feature; this is the points at which sif was observed
        var geomDimension_n = filter_n.dimension(function(d1) {
            return d1.geometry
        });


        /////////////////////////////////////////GROUP THE DATA///////////////////////////////////////////////////////////////
        // Now that we have the mag dimension captured in an object we have to group them all together so that we can use them
        var sifDimensionGroup_n = sifDimension_n.group();


        ///////
        //////////// JANUARY GREENUP DATA - PREP
        ///////

        //////////////////////////////////////////////////PREP THE DATA////////////////////////////////////////////////////////
        //create crossfilter passes each feature to the filter. We have to pass it through the crossfilter before we can split up with data using
        //the .dimensions() method
        var filter_s = crossfilter(jan_mag.features); //passes the features to the crossfilter

        // groups everything together into one group, this is used to quickly search all of the data at once
        var all_s = filter_s.groupAll();


        //Takes each of the records of the dataset and returns each individual line so that they can be used. .dimension() puts
        // the data into an easily searchable/manipulable format for DC
        var everything_s = filter_s.dimension(function(d) {
            return d
        });


        //defines the categories from magnitude property using a lamda operation
        var sifDimension_s = filter_s.dimension(function(d) {

            //lamda operations are simple version of if/else statements. EX: If mag is less than 1.2 return the first element, else continue to the second element
            var sif = d.properties.NA; //sif is called "NA" in this file...
            return sif < -1 ? '< -1' :
                sif < -0.5 ? '1 - -0.5' :
                    sif < 0 ? '-0.5 - 0' :
                        sif < 0.5 ? '0 - 0.5' :
                            sif < 1 ? '0.5 - 1' :
                                '>1'
        });

        //returns the geometry for each feature; this is the points at which sif was observed
        var geomDimension_s = filter_s.dimension(function(d) {
            return d.geometry
        });


        /////////////////////////////////////////GROUP THE DATA///////////////////////////////////////////////////////////////
        // Now that we have the mag dimension captured in an object we have to group them all together so that we can use them
        var sifDimensionGroup_s = sifDimension_s.group();




        /////////////////////////////////////CREATE THE CHARTS////////////////////////////////////////////////////////////////
        //binds the barChart  to the <div> elements that we created earlier in the <body>


        var sifChart_n = dc.barChart('#sif-chart-n');
        //define the characteristics of the chart before we actually add the data to it
        sifChart_n
            .height(100) //pixel height of the chart
            .margins({
                top: 10,
                right: 50,
                bottom: 30,
                left: 40
            }) //margins of the chart
            .dimension(sifDimension_n) //pulls in the mag data
            .group(sifDimensionGroup_n) //is the functions of the data; created earlier
            .elasticY(true) //allows for an OTF adjustable y axis
            .x(d3.scaleOrdinal()) //Do this because there are ORDERs of MAGNITUDE; Its the scale that we want in the chart
            .xUnits(dc.units.ordinal)
            .yAxis() //pulls in data from the dataset
            .ticks(3) //number of ticks in a chart
            ;

        var sifChart_s = dc.barChart('#sif-chart-s');
        //define the characteristics of the chart before we actually add the data to it
        sifChart_s
            .height(100) //pixel height of the chart
            .margins({
                top: 10,
                right: 50,
                bottom: 30,
                left: 40
            }) //margins of the chart
            .dimension(sifDimension_s) //pulls in the mag data
            .group(sifDimensionGroup_s) //is the functions of the data; created earlier
            .elasticY(true) //allows for an OTF adjustable y axis
            .x(d3.scaleOrdinal()) //Do this because there are ORDERs of MAGNITUDE; Its the scale that we want in the chart
            .xUnits(dc.units.ordinal)
            .yAxis() //pulls in data from the dataset
            .ticks(3); //number of ticks in a chart



    /////////////////////////////////////////DRAW ALL THE CHARTS//////////////////////////////////////////////////////////
    dc.renderAll(); //activates everything
    //we can render things one at a time but it is more efficient (and easier) to render everything at the end


    ////////////////////////////////////////LISTEN FOR CHANGES ON THE MAP//////////////////////////////////////////////////

    //define in functions what we want to have happen to the map
    //This function sees which features are in the bounding box and returns the points that are in it; This filters the
    //data for the charts and map.
    function updateMapFilter() {
        geomDimension_n.filter(function(d) {
            return map.getBounds().contains(L.geoJSON(d).getBounds())
        });
        dc.redrawAll();
    }



        function updateMap() {
            geoJsonLayer.clearLayers(); //removes everything
            geoJsonLayer.addData({ //adds the new data to the map/chart within the scope of the filter
                type: 'FeatureCollection',
                features: [everything_n.top(Infinity), everything_s.top(Infinity)]
            });
        }


        //selects the map and runs a filter function on it once it's done moving and zooming
        map.on('zoomend moveend', function() { //passes the zoom and move locations as the new filter
            updateMapFilter(); //triggers the new function
        });

        //When the chart is "filtered" it runs the function to update the map
        sifChart_n.on('filtered', function(chart, filter) {
            updateMap() //calls the update map function
        });

        //When the chart is "filtered" it runs the function to update the map
        sifChart_s.on('filtered', function(chart, filter) {
            updateMap() //calls the update map function
        });



});
});

// coord view for second chart is not updating dynamically
// x scale on bar charts is out of order