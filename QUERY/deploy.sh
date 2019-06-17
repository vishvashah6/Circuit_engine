#!/usr/bin/env bash
. ../../../scripts/setenv.sh

export FUNCTION_NAME="CIRCUITS_ENGINE_QUERY_CIRCUITS"
export RUNTIME=nodejs6.10
export HANDLER=query.handler
export DESCRIPTION='Queries Circuits'
export MEMORY_SIZE=128
export TIMEOUT=10
export ROLE=$LAMBDA_ROLE
export VARIABLES="Variables={ENV=$ENV}"


LAST_DEPLOY=`cat local_deploy.md5`
MD5=`cat query.js | md5sum | cut -d' ' -f1`
echo $MD5 > local_deploy.md5

if [ "$LAST_DEPLOY" != "$MD5" ];
then

    mkdir build
    cp  *.js build/
    cp package*.json build/
    cd build
    npm install --production=true
    npm link "circuits-engine"
    npm link "circuits-engine-api-helper"
    echo "Creating package"
    zip -rq -X query.zip .
else
    cd build
fi
export PACKAGE=query.zip

# This md5 is used to avoid duplicated deployment for functions that do not control themsefls
arr=`echo $FUNCTION_NAME |  tr '[:upper:]' '[:lower:]' | sed 's/_/ /g' | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) substr($i,2) }}1' `
export CF_FUNCTION_NAME=`printf %s "${arr[@]^}" | sed 's/ //g' `

deploy-function
cd ..