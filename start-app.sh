#!/bin/bash

eval "$(/root/.local/share/fnm/fnm env --use-on-cd --shell bash)"
exec node dist/ # or whatever your entry point is
