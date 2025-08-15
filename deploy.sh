#!/bin/bash

# source the .env file
set -o allexport
source .env
set +o allexport

pnpm build
if [ $? -ne 0 ]; then
    echo "Build failed. Exiting."
    exit 1
fi

# copy the build files to server
ssh $DEPLOY_SCRIPT_SSH_HOST "mkdir -p $DEPLOY_SCRIPT_BASE_DIR && \
    rm -rf $DEPLOY_SCRIPT_BASE_DIR/dist"
rsync -avz --progress -h ./dist package.json start-app.sh wa-bot.service root@$DEPLOY_SCRIPT_SSH_HOST:$DEPLOY_SCRIPT_BASE_DIR

# restart the service
ssh $DEPLOY_SCRIPT_SSH_HOST "(rm /etc/systemd/system/wa-bot.service 2>/dev/null || true) && \
    cd $DEPLOY_SCRIPT_BASE_DIR && \
    export PATH=\$HOME/.local/share/fnm/:\$PATH && \
    eval \"\$(fnm env)\" && \
    pnpm i && \
    chmod +x start-app.sh && \
    ln -s $DEPLOY_SCRIPT_BASE_DIR/wa-bot.service /etc/systemd/system/wa-bot.service && \
    systemctl daemon-reload && systemctl restart wa-bot"
if [ $? -ne 0 ]; then
    echo "Failed to restart the service. Exiting."
    exit 1
fi

echo "Deployment successful and service restarted."
