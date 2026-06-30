# Production Laravel image: Node asset build + PHP-FPM runtime.

# ── Stage 1: frontend assets ─────────────────────────────────────
FROM node:22-slim AS frontend

WORKDIR /var/www/html

COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
    && corepack prepare pnpm@9 --activate \
    && pnpm install --frozen-lockfile

COPY resources resources
COPY public public
COPY vite.config.ts tsconfig.json components.json ./
RUN pnpm build

# ── Stage 2: PHP-FPM runtime ─────────────────────────────────────
FROM php:8.4-fpm-alpine AS runtime

WORKDIR /var/www/html

RUN apk add --no-cache \
        bash \
        icu-dev \
        libpq-dev \
        libzip-dev \
        postgresql-client \
        shadow \
        zip \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock artisan ./
COPY app app
COPY bootstrap bootstrap
COPY config config
COPY database database
COPY public public
COPY resources resources
COPY routes routes
COPY storage storage

RUN composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
        --no-progress \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY --from=frontend /var/www/html/public/build /var/www/html/public/build

RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.validate_timestamps=0'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

USER www-data

EXPOSE 9000
CMD ["php-fpm"]
