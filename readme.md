## Solar-induced chlorophyll fluorescence

#### Seasonal greenup patterns: a hemispheric view

**Prepared for GEOG 572: Geovisualization at Oregon State University**



### Data

Solar-induced chlorophyll fluorescence (SIF) is a relatively new remote sensing index. In contrast to traditional vegetation indices (NDVI, EVI), SIF is connected to the physiology of plant production, rather than the greenness of vegetation. SIF is also more sensitive to intra-annual variation in production related to heat and drought stress. SIF is correlated with the light use efficiency of photosynthesis (LUE; Guanter et al.2014) and with absorbed photosynthetically activeradiation (APAR; Rossini et al. 2010). Thus, SIF provides an ideal proxy for gross primary production (GPP) of an ecosystem.

SIF is measured by the NASA GOME-2 satellite at 0.5 decimal degree spatial resolution. SIF data products cover the globe, and are provided at daily and monthly temporal resolution, from 2002-present. SIF data are uploaded shortly after they are observed, and are available from [NASA](https://avdc.gsfc.nasa.gov/pub/data/satellite/MetOp/GOME_F/). All of our data will be sourced from this site. For this project, we will use monthly data to minimize processing. A focus of our data visualization will be quantifying and visualizing the impacts of a 2012 drought on North America.

For more info about SIF, check out this article from [NASA's Jet Propulsion Lab](https://www.jpl.nasa.gov/news/news.php?release=2014-097).

### Visualization

This visualization is designed to highlight seasonal patterns of greenup in the Northern Hemisphere, vs. the Southern Hemisphere. This is accomplished by displaying map tiles that represent the seasonal difference in SIF, which is a proxy for photosynthesis, calculated as (July - January), for the Northern Hemisphere, and (January - July), for the Southern Hemisphere. January and July values are averaged for the month of interest from 2010-2013. 

The tiles are accompanied by vector field animation, which is a dynamic way to represent the locations in which there is a more pronounced seasonal difference than others. The vector field animation emphasizes areas with strong greenup patterns, and also demonstrates that there is spatial variation within the greenup patterns in those areas. The vector field animation was developed by [IH Cantabria](https://github.com/IHCantabria/Leaflet.CanvasLayer.Field).

The bar charts display frequency tables of the pixel values that represent the magnitude of the seasonal greenup. The bar charts were generated using Crossfilter. The bar charts take the data in the seasonal greenup tiles, but the data are converted to geojson files where each point represents one of the cells in the raster tiles.



### Data Prep

Data prep was executed in [R](https://github.com/lleather/sif_vector/blob/master/R/prep_vectorfield_raster_function.R). The data prep involved: 

- averaging and stacking the january and july rasters, calculating mean rasters for january and july, and calculating the magnitude of seasonal greenup. 
- calculating *u* and *v* rasters for the vector field calculation. I executed this by writing a function to convert the raster representing the magnitude of the season greenup to vector magnitude and direction. [Brian Katz's vector field tutorial](https://github.com/briangkatz/vector-field-animation) and personal help was invaluable in this process.

