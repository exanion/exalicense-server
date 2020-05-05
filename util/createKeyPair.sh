#!/bin/sh

# Create a RSA keypair for signing of the license leases
# Requires openssl
# Usage: ./createKeyPair.sh <name> <output-path-directory>

usageAndExit()
{
    echo "Usage: ./createKeyPair.sh <name> <output-path-directory>"
    exit 1
}

if ! type openssl > /dev/null 2>&1; then
    echo "This script requires openssl!"
    exit 1
fi

if [ -z "$1" ]
then
    echo "Name for keychain is required!"
    usageAndExit
fi

if [ -z "$2" ]
then
    echo "Output directory is required!"
    usageAndExit
fi

mkdir -p "$2"
openssl genrsa -out "$2/$1.key" 2048
openssl rsa -in "$2/$1.key" -outform PEM -pubout -out "$2/$1.pem"