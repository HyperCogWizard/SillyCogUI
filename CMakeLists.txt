cmake_minimum_required(VERSION 3.10)
project(SillyCogUI_OpenCog)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find required packages
find_package(PkgConfig REQUIRED)

# Set up include directories
include_directories(${CMAKE_JS_INC})
include_directories(src/opencog)

# Source files
set(SOURCES
    src/opencog/cpp/opencog_client.cpp
    src/opencog/bindings/addon.cpp
)

# Create the addon library
add_library(${PROJECT_NAME} SHARED ${SOURCES})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Link with Node.js libraries
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Installation
install(TARGETS ${PROJECT_NAME} DESTINATION ${CMAKE_INSTALL_PREFIX})