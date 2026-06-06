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
rsync -avz --progress -h ./dist package.json pnpm-lock.yaml pnpm-workspace.yaml start-app.sh wa-bot.service $DEPLOY_SCRIPT_SSH_USER@$DEPLOY_SCRIPT_SSH_HOST:$DEPLOY_SCRIPT_BASE_DIR

# restart the service
ssh $DEPLOY_SCRIPT_SSH_HOST "(rm /etc/systemd/system/wa-bot.service 2>/dev/null || true) && \
    cd $DEPLOY_SCRIPT_BASE_DIR && \
    source /home/$DEPLOY_SCRIPT_SSH_USER/.nvm/nvm.sh && \
    export CI=true && \
    pnpm i && \
    chmod +x start-app.sh && \
    sudo ln -sf $DEPLOY_SCRIPT_BASE_DIR/wa-bot.service /etc/systemd/system/wa-bot.service && \
    sudo systemctl daemon-reload && sudo systemctl restart wa-bot"
if [ $? -ne 0 ]; then
    echo "Failed to restart the service. Exiting."
    exit 1
fi

echo "Deployment successful and service restarted."
