#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-calculator-195116-195125/calculator_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

