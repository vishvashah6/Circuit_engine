#!/usr/bin/env bash
. ../../scripts/setenv.sh

export FUNCTION_NAME="CIRCUITS_ENGINE_CIRCUIT_DEFINITIONS_ENDPOINT"




mkdir build
cd build
echo "Creating package".

# This md5 is used to avoid duplicated deployment for functions that do not control themsefls
arr=`echo $FUNCTION_NAME |  tr '[:upper:]' '[:lower:]' | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) substr($i,2) }}1' `
export CF_FUNCTION_NAME=`printf %s "${ENV}${arr[@]^}" | sed 's/ //g' `

deploy-cloudformation
cd ..