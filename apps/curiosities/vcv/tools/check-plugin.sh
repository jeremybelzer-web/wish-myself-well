#!/bin/sh
# Syntax-checks the generated plugin code against tools/mock-rack/rack.hpp, a tiny stand-in for the parts of
# Rack's API it uses. This catches typos in the generator. It does not prove the code builds against the real
# Rack SDK; for that: cd vcv/plugin && make RACK_DIR=<path to Rack-SDK>
set -e
cd "$(dirname "$0")/../plugin"
g++ -std=c++17 -fsyntax-only -I../tools/mock-rack src/plugin.cpp src/Curio.cpp
echo "plugin code: syntax OK against the stand-in API"
