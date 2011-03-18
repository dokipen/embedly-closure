#!/bin/sh

CLOSURE_LIB="../closure-library"
CLOSURE_COMPILER="../closure-compiler"
TYPE="${1:-compiled}"
COMPILATION_LEVEL="ADVANCED_OPTIMIZATIONS"

python "${CLOSURE_LIB}/closure/bin/build/closurebuilder.py" \
  --namespace embedly.exports \
  --root . \
  --root "${CLOSURE_LIB}" \
  -o "${TYPE}" \
  -c "${CLOSURE_COMPILER}/compiler.jar" \
  -f "--compilation_level=${COMPILATION_LEVEL}" \
  --output_file=embedly.min.js
  #-f --debug \
