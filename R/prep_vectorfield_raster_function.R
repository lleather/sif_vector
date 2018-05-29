#Extract convert a magnitude raster into u and v vector field rasters for animation
#Author: Lila Leatherman


rm(list = ls())

#primary objectives: 
#load magnitude rasters for seaonal greenup, represented by : july - january, and january - july.
#create U and V rasters for vector direction


#install.packages(c("raster", "geojsonio"))
#libraries
library(raster)
library(geojsonio)

#SET DIRECTORIES

js_dir <- "/Volumes/classes/GEOG572/Students/leatherl/sif_vector/assets/vector_field/"

#######################################################################

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
  mag_abs <- raster::calc(mag_t , fun=function(x){x -270})
  
  # calc direction of movement
  # calculated as initial raster * cos(direction)
  
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

#######################################################################

##
#### LOAD AND PREP RAW MAGNITUDE RASTER FOR VECTOR
##

#######################################################################

## input raster load from file: 
july_jan_mag <- raster(paste0(js_dir, "input_asc/july_jan_mag_simple.asc"))
jan_july_mag <- raster(paste0(js_dir, "input_asc/jan_july_mag_simple.asc"))


# # convert to .asc for visualization, if necessary
# writeRaster(july_jan_mag, paste0(js_dir, "input_asc/july_jan_mag_simple.asc"), overwrite = TRUE)

# #inspect
#plot(july_jan_mag)
#plot(jan_july_mag)

#set projection
#scalar field needs EPSG 4326
proj <- "+init=EPSG:4326 +proj=longlat +datum=WGS84 +ellps=WGS84 +towgs84=0,0,0"
crs(july_jan_mag) <- proj
crs(jan_july_mag) <- proj

#######################################################################

##
##### CALC VECTORS OF INTEREST
##

july_jan_mag_u <- vector_UV(july_jan_mag, "u")
july_jan_mag_v <- vector_UV(july_jan_mag, "v")

jan_july_mag_u <- vector_UV(jan_july_mag, "u")
jan_july_mag_v <- vector_UV(jan_july_mag, "v")

# #inspect
# july_jan_mag_u
# plot(july_jan_mag_u)

#######################################################################


####
#######EXPORT
####

#export to javascript directory
writeRaster(july_jan_mag_u, paste0(js_dir, "output_asc/july_jan_mag_u.asc"), overwrite = TRUE)
writeRaster(july_jan_mag_v, paste0(js_dir, "output_asc/july_jan_mag_v.asc"), overwrite = TRUE)


writeRaster(jan_july_mag_u, paste0(js_dir, "output_asc/jan_july_mag_u.asc"), overwrite = TRUE)
writeRaster(jan_july_mag_v, paste0(js_dir, "output_asc/jan_july_mag_v.asc"), overwrite = TRUE)


#export as to geojson for visualization in dc / crossfilter

# convert raster to points so that it can be converted to geojson
july_jan_mag_pts <- rasterToPoints(july_jan_mag)
# export as geojson
geojson_write(july_jan_mag_pts, file = paste0(js_dir, "json/july_jan_mag_simple.geojson"))

#export as to geojson for visualization in dc / crossfilter
jan_july_mag_pts <- rasterToPoints(jan_july_mag)
geojson_write(jan_july_mag_pts, file = paste0(js_dir, "json/jan_july_mag_simple.geojson"))

#######################################################################

#### END
