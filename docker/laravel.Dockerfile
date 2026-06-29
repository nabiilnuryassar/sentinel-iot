# Dev-grade Dockerfile for the Laravel app.
# Uses PHP 8.4 CLI + the artisan dev server. Not production-grade by design.

FROM php:8.4-cli

ENV DEBIAN_FRONTEND=noninteractive

# System deps for Postgres PDO, intl, zip, Composer, and Node (for vite build).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        unzip \
        curl \
        ca-certificates \
        gnupg \
        libpq-dev \
        libicu-dev \
        libzip-dev \
        libonig-dev \
        zlib1g-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        intl \
        zip \
        bcmath \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install -g pnpm@9 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Composer (multi-stage copy keeps the image lean).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy app sources. In dev, override-compose mounts ./ over this layer.
COPY . /var/www/html

# Install PHP deps. --no-scripts because artisan needs a writable .env at boot,
# which exists at runtime via the bind mount but not necessarily at build time.
# composer install skipped — vendor provided via bind mount
#     && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
