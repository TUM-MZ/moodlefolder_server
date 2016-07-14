#!/bin/bash

docker build -t mz/snsconnect .
docker save -o /tmp/sns.docker mz/snsconnect
scp /tmp/sns.docker  dockerhost:
ssh dockerhost 'docker load -i ~/sns.docker'
