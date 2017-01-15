FROM node:6
MAINTAINER Johannes Schickling "schickling.j@gmail.com"

RUN apt-get update && \
    apt-get install -y libgtk2.0-0 libgconf-2-4 \
    libasound2 libxtst6 libxss1 libnss3 xvfb

ENV SCREEN_X=1280
ENV SCREEN_Y=900

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

RUN npm i -g prep

ENTRYPOINT ["/entrypoint.sh"]
