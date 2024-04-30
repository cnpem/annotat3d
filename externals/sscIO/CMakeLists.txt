cmake_minimum_required(VERSION 3.5)

project(sscIO CXX C)

option(SSC_IO_DISABLE_REMOTE_VIS "Disable Message Bus" OFF)
option(SSC_IO_DISABLE_RDMA "Disable RDMA code" OFF)
option(SSC_IO_SHARED "Creates sscIO as a shared library" FALSE)

include_directories(
    src
    include
)
### HDF5 packages ###

if(NOT (SSC_IO_DISABLE_REMOTE_VIS OR SSC_IO_DISABLE_RDMA OR SSC_IO_DISABLE_HDF5))
    set(HDF5_PREFER_PARALLEL TRUE)
    find_package( HDF5 COMPONENTS C HL REQUIRED )

    ### MPI Packages ########
    #####
    #####
    #####
    find_package( MPI REQUIRED)


    include_directories(
    ${HDF5_INCLUDE_DIR}
    ${MPI_INCLUDE_PATH}
    )
endif()

find_library(LIBRT rt)

set(CMAKE_CXX_STANDARD 14)
list(APPEND CMAKE_CXX_FLAGS "-g -Wall -fPIC -fopenmp")

find_package(PkgConfig)

file(GLOB SOURCES_COMMON
    src/ssc_util.h
    src/ssc_util.cpp
    src/ssc_volume.h
    src/ssc_volume.cpp
)

if(SSC_IO_SHARED)
    add_library(sscIO SHARED ${SOURCES_COMMON})
    target_link_libraries( sscIO -lpthread)
else() 
    add_library(sscIO STATIC ${SOURCES_COMMON})
    target_link_libraries( sscIO -lpthread)
endif()
