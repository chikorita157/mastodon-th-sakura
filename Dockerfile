# syntax=docker/dockerfile:1.4
# This needs to be bookworm-slim because the Ruby image is built on bookworm-slim
ARG NODE_VERSION="20.6-bookworm-slim"
ARG RUBY_IMAGE=ghcr.io/moritzheiber/ruby-jemalloc:3.2.2-slim

# hadolint ignore=DL3006
FROM ${RUBY_IMAGE} as ruby

# build-base
# hadolint ignore=DL3006
FROM ${NODE_IMAGE} as build-base

COPY --link --from=ruby /opt/ruby /opt/ruby

ENV DEBIAN_FRONTEND="noninteractive" \
    PATH="${PATH}:/opt/ruby/bin"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /opt/mastodon

# hadolint ignore=DL3008,DL3009
RUN --mount=type=cache,id=apt,target=/var/cache/apt,sharing=private \
    set -eux && \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    apt-get update && \
    apt-get -yq dist-upgrade && \
    apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        git \
        libgdbm-dev \
        libgmp-dev \
        libicu-dev \
        libidn-dev \
        libjemalloc-dev \
        libpq-dev \
        libreadline8 \
        libssl-dev \
        libyaml-0-2 \
        python3 \
        shared-mime-info \
        zlib1g-dev

COPY --link .yarn/releases/ /opt/mastodon/.yarn/releases/
COPY --link Gemfile* package.json yarn.lock .yarnrc.yml /opt/mastodon/

ENV NODE_OPTIONS=--openssl-legacy-provider \
    YARN_GLOBAL_FOLDER=/opt/yarn \
    YARN_ENABLE_GLOBAL_CACHE=1

# hadolint ignore=DL3060
RUN --mount=type=cache,id=bundle,target=/opt/bundle/cache,sharing=private \
    --mount=type=cache,id=yarn,target=/opt/yarn/cache,sharing=private \
    set -eux && \
    bundle config set cache_path /opt/bundle/cache && \
    bundle config set silence_root_warning 'true' && \
    bundle cache --no-install && \
    bundle config set --local deployment true && \
    bundle install --local -j"$(nproc)" && \
    yarn install --immutable

# Precompile assets
# TODO(kouhai): we're currently patching node_modules because of emoji-mart.
# we should integrate our own fork instead.
COPY --link . /opt/mastodon

# build
FROM build-base AS build

ENV RAILS_ENV=production \
    NODE_ENV=production

ENV NODE_OPTIONS=--openssl-legacy-provider \
    YARN_GLOBAL_FOLDER=/opt/yarn \
    YARN_ENABLE_GLOBAL_CACHE=1

ENV OTP_SECRET=precompile_placeholder \
    SECRET_KEY_BASE=precompile_placeholder \
    RAKE_NO_YARN_INSTALL_HACK=1

# override this at will
ENV BOOTSNAP_READONLY=1

RUN --mount=type=cache,id=yarn,target=/opt/yarn/cache,sharing=private \
    --mount=type=cache,id=webpacker,target=/opt/webpacker/cache,sharing=private \
    set -eux && \
    mkdir -p tmp/cache && \
    ln -sf /opt/webpacker/cache tmp/cache/webpacker && \
    mv ./emoji_data/all.json ./node_modules/emoji-mart/data/all.json && \
    yarn install && \
    bundle exec rails assets:precompile

# final image
# hadolint ignore=DL3006
FROM ${NODE_IMAGE} as output-base

ENV DEBIAN_FRONTEND="noninteractive"

# Ignoring these here since we don't want to pin any versions and the Debian image removes apt-get content after use
# hadolint ignore=DL3008,DL3009
RUN --mount=type=cache,id=apt,target=/var/cache/apt,sharing=private \
    set -eux && \
    rm -f /etc/apt/apt.conf.d/docker-clean && \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache && \
    echo "Etc/UTC" > /etc/localtime && \
    apt-get update && \
    apt-get -y --no-install-recommends install \
        ca-certificates \
        ffmpeg \
        file \
        imagemagick \
        libicu72 \
        libidn12 \
        libjemalloc2 \
        libpq5 \
        libreadline8 \
        libssl3 \
        libyaml-0-2 \
        procps \
        tini \
        tzdata \
        wget \
        whois

# final image
FROM output-base as output

# Use those args to specify your own version flags & suffixes
ARG SOURCE_TAG=""
ARG MASTODON_VERSION_PRERELEASE=""
ARG MASTODON_VERSION_METADATA=""

ARG UID="991"
ARG GID="991"

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV PATH="${PATH}:/opt/ruby/bin:/opt/mastodon/bin"

# Ignoring these here since we don't want to pin any versions and the Debian image removes apt-get content after use
# hadolint ignore=DL3008,DL3009
RUN groupadd -g "${GID}" mastodon && \
    useradd -l -u "${UID}" -g "${GID}" -m -d /opt/mastodon mastodon && \
    ln -s /opt/mastodon /mastodon

# Note: no, cleaning here since Debian does this automatically
# See the file /etc/apt/apt.conf.d/docker-clean within the Docker image's filesystem

COPY --link --from=ruby /opt/ruby /opt/ruby
COPY --link --chown=mastodon:mastodon --from=build /opt/mastodon /opt/mastodon

ENV RAILS_ENV="production" \
    NODE_ENV="production" \
    RAILS_SERVE_STATIC_FILES="true" \
    BIND="0.0.0.0" \
    SOURCE_TAG="${SOURCE_TAG}" \
    MASTODON_VERSION_PRERELEASE="${MASTODON_VERSION_PRERELEASE}" \
    MASTODON_VERSION_METADATA="${MASTODON_VERSION_METADATA}"

# override this at will
ENV BOOTSNAP_READONLY=1

# Set the run user
USER mastodon
WORKDIR /opt/mastodon

# Set the work dir and the container entry point
ENTRYPOINT ["/usr/bin/tini", "--"]
EXPOSE 3000 4000
