FROM centos:centos6
MAINTAINER Eugen Rochko <eugen@zeonfederated.com>

ENV NODE_ENV production

RUN yum install -y epel-release
RUN yum install -y nodejs npm

COPY package.json /src/package.json
RUN cd /src; npm install
COPY . /src
RUN cd /src; npm run build

EXPOSE 3000
CMD ["node", "/src/server/index.js"]
