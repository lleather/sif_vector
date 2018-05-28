## Solar-induced chlorophyll fluorescence

#### Seasonal greenup patterns: a hemispheric view

**Prepared for GEOG 572: Geovisualization at Oregon State University**

### 1. Data

Solar-induced chlorophyll fluorescence (SIF) is a relatively new remote sensing index. In contrast to traditional vegetation indices (NDVI, EVI), SIF is connected to the physiology of plant production, rather than the greenness of vegetation. SIF is also more sensitive to intra-annual variation in production related to heat and drought stress. SIF is correlated with the light use efficiency of photosynthesis (LUE; Guanter et al.2014) and with absorbed photosynthetically activeradiation (APAR; Rossini et al. 2010). Thus, SIF provides an ideal proxy for gross primary production (GPP) of an ecosystem.

SIF is measured by the NASA GOME-2 satellite at 0.5 decimal degree spatial resolution. SIF data products cover the globe, and are provided at daily and monthly temporal resolution, from 2002-present. SIF data are uploaded shortly after they are observed, and are available from [NASA](https://avdc.gsfc.nasa.gov/pub/data/satellite/MetOp/GOME_F/). All of our data will be sourced from this site. For this project, we will use monthly data to minimize processing. A focus of our data visualization will be quantifying and visualizing the impacts of a 2012 drought on North America.

For more info about SIF, check out this article from [NASA's Jet Propulsion Lab](https://www.jpl.nasa.gov/news/news.php?release=2014-097).

### 2. Visualization

This visualization is designed to highlight seasonal patterns of greenup in the Northern Hemisphere, vs. the Southern Hemisphere. This is accomplished by displaying map tiles that represent the seasonal difference in SIF, which is a proxy for photosynthesis, calculated as (July - January), for the Northern Hemisphere, and (January - July), for the Southern Hemisphere. January and July values are averaged for the month of interest from 2010-2013. 

The tiles are accompanied by vector field animation, which is a dynamic way to represent the locations in which there is a more pronounced seasonal difference than others. The vector field animation emphasizes areas with strong greenup patterns, and also demonstrates that there is spatial variation within the greenup patterns in those areas. The vector field animation was developed by [IH Cantabria](https://github.com/IHCantabria/Leaflet.CanvasLayer.Field).

The bar charts display frequency tables of the pixel values that represent the magnitude of the seasonal greenup. The bar charts were generated using Crossfilter. The bar charts take the data in the seasonal greenup tiles, but the data are converted to geojson files where each point represents one of the cells in the raster tiles.



### 3. Data Prep

Data prep was executed in [R](https://github.com/lleather/sif_vector/blob/master/R/prep_vectorfield_raster_function.R). The data prep involved: 

- averaging and stacking the january and july rasters, calculating mean rasters for january and july, and calculating the magnitude of seasonal greenup. 
- calculating *u* and *v* rasters for the vector field calculation. I executed this by writing a function to convert the raster representing the magnitude of the season greenup to vector magnitude and direction. [Brian Katz's vector field tutorial](https://github.com/briangkatz/vector-field-animation) and personal help was invaluable in this process.



### 4. Vector field animation tutorial  

This project uses the Vector Field Animation and Scalar Field derivation developed by [IH Cantabria](https://github.com/IHCantabria/Leaflet.CanvasLayer.Field). This package was interpreted by [Brian Katz](https://github.com/briangkatz/vector-field-animation), who developed an excellent tutorial for implementing this utility. My project draws from and expands upon this tutorial to: 

* use an R script for input data processing
* visualize additional layers alongside the vector field animation



#### 4.1 Vector field animation: what is it?

Vector field animation is a method of visualizing the *magnitude* and *direction* of cells in a raster. When an input raster does not explicitly represent a magnitude or direction raster, the vector field can be used to visualize *heterogeneity* in the input raster, and the relative patterning of that heterogeneity. I.e., where are there differences in the value of the rasters? And in contrast to visualizing these differences statically: in which direction are the differences oriented?



#### 4.2 Preparing inputs: background

To use the Vector Field utility, you must create input rasters that represent both the *magnitude* and the *direction* of the vector that you wish you visualize. You cannot simply input your raw raster. Importantly, the Vector Field utility uses inputs in ASCII (.asc) format.

Brian provides a great explanation of vectors:

> [The vector components of your original data] are called **U** and **V**.
>
> - **V** relates to the vector **magnitude**
> - **U** relates to the vector **direction**
>
> [![Vector Components](https://github.com/briangkatz/vector-field-animation/raw/master/img/vector_components.png)](https://github.com/briangkatz/vector-field-animation/blob/master/img/vector_components.png)
>
> Source: [Elementary Vector Analysis](https://www.math.hmc.edu/calculus/tutorials/vectoranalysis/vectoranalysis.pdf)
>
> In the figure above, the perpendicular lines represent the **V** (blue) and **U** (red) vector components that the Leaflet.CanvasLayer.Field library uses to dynamically calculate and animate the original data's magnitude (pixel values). Thus, the *green* line labeled **v** represents your starting ASCII raster that you want visualized from two other ASCII rasters, **V** and **U**.



While GUI-based GIS softwares can execute this task, script-based analysis streamlines this process. The [R](https://www.r-project.org/) coding environment includes a [raster](https://cran.r-project.org/web/packages/raster/index.html) package that is ideal for processing and analyzing raster data. The scripting environment also means that it is a straightforward to convert between file types and projections. 

#### 4.3 Preparing inputs: practice

In your R coding environment ([R Studio](https://www.rstudio.com/) is strongly recommended), open a new script. 

**4.3.1 First, load the necessary libraries.** If you do not already have the requisite libraries installed, you can install them using the command: 

```r 
install.packages(c("raster", "tidyverse", "ndcf4", "ndcf4.helpers", "rgeos", "geojsonio")) 
```

**4.3.2** Then **create objects that name the directories where you will be working.** Rather than setting the working directory (e.g, setwd()), I prefer to do this, so that I have more control over where objects are exported, and because naming the directories explicitly works better in an [R Markdown](https://rmarkdown.rstudio.com/) framework. I use separate directories for my working directory, and the directory for this project 

E.g., 

```r 
proj_dir <- "/Users/lilaleatherman/Documents/BoxSync/current_projects_sync/flux_sif/"
js_dir <- "/Volumes/classes/GEOG572/Students/leatherl/sif_vector/assets/vector_field/"
```

This means that you can directly access your assets folder. 

**4.3.4** The **function used to calculate ** the **u** and **v** rasters is below. This function takes as an input: 

* a raw magnitude raster that you wish to visualize (r)
* a string indicating the type of vector that should be returned (type, can be "v" or "u")

This function calculates both u and v rasters from the input. 

```r 
##
###### CALC VECTOR FIELDS: WRITE FUNCTION FORM
##

vector_UV <- function(r, type) {
  
  require(raster)
  
  #load input magnitude vector of interest-- whatever you want to visualize
  #this should be a .asc file
  mag <- r
  
  #type tells the function which type of vector raster to return
  #"type" should be either "u" or "v"
  out <- type
  
  #convert to "terrain" / theta raster
  #computes the relative "angle", or direction of movement, of the magnitude raster, in decimal degrees
  mag_t <- terrain(mag, opt = "aspect", unit = "degrees")
  
  #adjust angle of movement for theta raster - default is off by 90 degrees
  mag_abs <- raster::calc(mag_t , fun=function(x){x - 270})
  
  # V raster: vector magnitude. 
  # calculated as sin(theta) * input 
  mag_v <- overlay(mag_abs, mag, fun=function(x, y){sin(x) * y})
  
  # U raster: vector direction. 
  # calculated as cos(theta) * input 
  mag_u <- overlay(mag_abs , mag, fun=function(x, y){cos(x) *y})
  
  ifelse(out == "v", return(mag_v), 
         ifelse(out == "u", return(mag_u), 
                NA))
  
}
```

You can copy this function directly into your R script. You will call it to calculate your vector rasters of interest. 

**4.3.5** next section in the [R script](https://github.com/lleather/sif_vector/blob/master/R/prep_vectorfield_raster_function.R) was used to process the input data, by:

1. Listing all raster files in the directory 
2. Grouping them, or creating raster **stacks** by the months of interest (January and July)
3. Calculating a **mean raster stack** for each month.
4. Calculating a raw magnitude raster for input to the vector field calculator. My raw magnitude raster is the seasonal difference in solar-induced chlorophyll fluorescence between July and January. So, I named the rasters for the order of subtraction that I used between the two months. 

If you already have your raw magnitude raster prepared, you can skip the "Prep Input Data" Section. 

**4.3.6** **Load your data.**

The raster() command loads in raster format files. Your raw magnitude input raster can be in any raster format; we will convert it to .asc later. 

Load in your input raster:

```r 
## input raster load from file: 
july_jan_mag <- raster(paste0(js_dir, "july_jan_mag_simple.asc"))
```

Though the Vector Field utility calculates a derived raw magnitude layer to visualize, this looks distinct from the raw input raster (for a reason that I haven't yet figured out). Thus, I am still plotting the original input raster under my vector field animation-- which also needs to be in .asc format. If you would like to do the same, you can export your input file as a .asc file using the writeRaster() function. 

```r 
# convert to .asc for visualization, if necessary
writeRaster(july_jan_mag, paste0(js_dir, "july_jan_mag_simple.asc"), overwrite = TRUE)
```

**4.3.7 Set the projection.** The vector field calculation function in R needs the input rasters to have a projection specified. The Vector Field utility in js requires EPSG 4326. 

``` r
#set projection
#scalar field needs EPSG 4326
proj <- "+init=EPSG:4326 +proj=longlat +datum=WGS84 +ellps=WGS84 +towgs84=0,0,0"
crs(july_jan_mag) <- proj
```

**4.3.8 Calculate the u and v rasters for input to the Vector Field utility**.

Now that we have the function written and our raw magnitude rasters loaded, we have to put the two together. Make sure to assign the results of the function to a new object.

```r 
##
##### CALC VECTORS OF INTEREST
##

#rasters are named for the order of subtraction in calculating the seasonal greenup

july_jan_mag_u <- vector_UV(july_jan_mag, "u")
july_jan_mag_v <- vector_UV(july_jan_mag, "v")
```



**4.3.9 Export your calculated rasters for input into the Vector Field utility.**

The writeRaster() function exports your rasters to your directory of choice.

```r
####
#######EXPORT
####

#export to javascript directory
writeRaster(july_jan_mag_u, paste0(js_dir, "july_jan_mag_u.asc"), overwrite = TRUE)
writeRaster(july_jan_mag_v, paste0(js_dir, "july_jan_mag_v.asc"), overwrite = TRUE)
```

**4.3.10 If desired, convert and export your rasters as GeoJSON for visualization using DC / crossfilter.** 

DC and crossfilter interface well with GeoJSON files for calculating area statistics. To visualize any one of your rasters using these utilities, you first convert them from a raster to a list of points with the x and y coordinates and value at each point. Then, you export as a GeoJson format using geojson_write() from the [geojsonio](https://cran.r-project.org/web/packages/geojsonio/index.html) package. 

```r 
#export as to geojson for visualization in dc / crossfilter

# convert raster to points so that it can be converted to geojson
july_jan_mag_pts <- rasterToPoints(july_jan_mag)
# export as geojson
geojson_write(july_jan_mag_pts, file = paste0(js_dir, "json/july_jan_mag_simple.geojson"))
```

#### 4.4 Vector Field Utility: getting it online

