#Extract convert a magnitude raster into u and v vector field rasters for animation
#Author: Lila Leatherman


rm(list = ls())

#primary objectives: 
#create average rasters for january and july. 
#create magnitude rasters for seaonal greenup, represented by : july - january, and january - july.
#create U and V rasters for vector direction



#libraries
library(raster)
library(tidyverse)
library(ncdf4)
library(ncdf4.helpers)
library(rgeos)
library(geojsonio)

#SET DIRECTORIES

data_dir <- "/Users/lilaleatherman/Documents/big_data/GOME_F/"
proj_dir <- "/Users/lilaleatherman/Documents/BoxSync/current_projects_sync/flux_sif/"
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

#
### PREP INPUT DATA
#

#list files of interest
#start with :
#v27 (newest version with more post-processing) 
#Met-Op A (chosen because it comes first; still not sure the difference between Met-Op A and Met-Op B)
#Level 3 (monthly gridded data)

filenames <- list.files(path = paste0(proj_dir, "data/processed_sif_data/gome_rasters/ascii/world"), pattern = ".asc", full.names = T, recursive = T)

#subset to years or months of interest
yrs <- c("2011", "2012", "2013")
months <- c("0101", "0701")

filenames <- filenames[grepl(paste(months,collapse="|"),
                              filenames)]
filenames

#inspect a sample file
r1 <- raster(filenames[1])
r1

#average january and july

##JANUARY


## loop through months to stack and calc mean
jan_list <- filenames[grepl("0101",
                            filenames)]

jan_stack <- stack()

for (i in 1:length(jan_list)){
  
  ind = i
  fname = jan_list[ind]

  r = raster(fname)
  
  jan_stack = stack(jan_stack, r)

  
}
 
# #inspect
# jan_stack

jan_stack2 = reclassify(jan_stack, cbind(0, NA))

#jan_stack2

jan_mean <- mean(jan_stack2, na.rm=TRUE)

#inspect
#plot(jan_mean)


###JULY 


## loop through months to stack and calc mean
july_list <- filenames[grepl("0701",
                            filenames)]

july_stack <- stack()

for (i in 1:length(july_list)){
  
  ind = i
  fname = july_list[ind]
  
  r = raster(fname)
  
  july_stack = stack(july_stack, r)
  
  
}

# #inspect
# jan_stack

july_stack2 = reclassify(july_stack, cbind(0, NA))

#jan_stack2

july_mean <- mean(july_stack2, na.rm=TRUE)

#inspect
#plot(july_mean)


##################################################

#### CALC MAGNITUDE RASTER FOR VECTOR

##################################################

#set magnitude raster of interest
july_jan_mag <- july_mean - jan_mean

# #inspect
#plot(july_jan_mag)

#set projection
#scalar field needs EPSG 4326

proj <- "+init=EPSG:4326 +proj=longlat +datum=WGS84 +ellps=WGS84 +towgs84=0,0,0"
crs(july_jan_mag) <- proj

#calc magnitude raster
#for s hemisphere greenup
jan_july_mag <- jan_mean - july_mean
crs(jan_july_mag) <- proj

#inspect
#plot(jan_july_mag)

#######################################################################

##
##### CALC VECTORS OF INTEREST
##

#named for the order of subtraction in calculating the seasonal greenup

july_jan_mag_u <- vector_UV(july_jan_mag, "u")
july_jan_mag_v <- vector_UV(july_jan_mag, "v")

jan_july_mag_u <- vector_UV(jan_july_mag, "u")
jan_july_mag_v <- vector_UV(jan_july_mag, "v")

#######################################################################


####
#######EXPORT
####

writeRaster(july_jan_mag_u, paste0(proj_dir, "data/processed_sif_data/vector_rasters/july_jan_mag_u.asc"), overwrite = TRUE)
writeRaster(july_jan_mag_v, paste0(proj_dir, "data/processed_sif_data/vector_rasters/july_jan_mag_v.asc"), overwrite = TRUE)
writeRaster(july_jan_mag, paste0(proj_dir, "data/processed_sif_data/vector_rasters/july_jan_mag_simple.asc"), overwrite = TRUE)


#export to javascript directory
writeRaster(july_jan_mag_u, paste0(js_dir, "july_jan_mag_u.asc"), overwrite = TRUE)
writeRaster(july_jan_mag_v, paste0(js_dir, "july_jan_mag_v.asc"), overwrite = TRUE)
writeRaster(july_jan_mag, paste0(js_dir, "july_jan_mag_simple.asc"), overwrite = TRUE)
writeRaster(july_mean, paste0(js_dir, "july_mean.asc"), overwrite = TRUE)


writeRaster(jan_july_mag_u, paste0(js_dir, "jan_july_mag_u.asc"), overwrite = TRUE)
writeRaster(jan_july_mag_v, paste0(js_dir, "jan_july_mag_v.asc"), overwrite = TRUE)
writeRaster(jan_july_mag, paste0(js_dir, "jan_july_mag_simple.asc"), overwrite = TRUE)
writeRaster(jan_mean, paste0(js_dir, "jan_mean.asc"), overwrite = TRUE)


#export as to geojson for visualization in dc / crossfilter
r_pts <- rasterToPoints(july_jan_mag)
geojson_write(r_pts, file = paste0(js_dir, "json/july_jan_mag_simple.geojson"))

#export as to geojson for visualization in dc / crossfilter
r_pts <- rasterToPoints(jan_july_mag)
geojson_write(r_pts, file = paste0(js_dir, "json/jan_july_mag_simple.geojson"))

