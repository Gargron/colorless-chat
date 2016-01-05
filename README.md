Colorless Chat
==============

Based on: Express, Socket.io, Webpack and React.js

Uses Redis as session store and Redis pubsub for potential scalability. If Redis goes down chat goes into local-only mode wherein new connections cannot be authenticated but established ones can keep chatting to each other as long as they're on the same app instance.

Deployable via Docker:

    docker run -d --restart=unless-stopped \
      -e BRAND="The Colorless" \
      -e BASE_URL="http://thecolorless.net" \
      -e REDIS_HOST="127.0.0.1" \
      -e REDIS_PORT=6379 \
      -e PORT=3000 \
      --net=host

The above command will start a new docker container with the chat app that will always be restarted unless you manually stop the container, in the background, using the host's network interface (so the specified port will actually be taken up on the host system).
