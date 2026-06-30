# Multi-Tenant MQTT Architecture

Sentinel-IoT uses a **namespace-based isolation model** where each tenant operates within their own MQTT topic hierarchy. This document describes the security model, credential management, and deployment patterns.

## Topic Namespace Structure

```
tenants/{tenant_slug}/iot/{building}/{room}/{device_id}/telemetry
tenants/{tenant_slug}/iot/{building}/{room}/{device_id}/event
tenants/{tenant_slug}/security/{event_type}/{source}
```

**Example for tenant "acme":**
```
tenants/acme/iot/b1/r101/thermostat-01/telemetry
tenants/acme/iot/b1/r101/thermostat-01/event
tenants/acme/security/unauthorized_access/device-01
```

## Security Model

### ACL Enforcement

The broker enforces tenant isolation through Mosquitto's ACL system:

```
# ACL pattern in mosquitto/config/aclfile
user %u
topic write tenants/%u/#
topic read tenants/%u/#
```

- `%u` is substituted with the authenticated username (tenant slug)
- Each tenant can **only** publish/subscribe to their own namespace
- Cross-tenant publishes are **silently denied** by the broker (QoS 0/1 returns success but message is dropped)

### Credential Types

1. **Tenant Credentials** (username = tenant_slug)
   - Used by device fleets under a single tenant
   - Generated via `php artisan tenant:provision`
   - Stored in `mosquitto/secrets/passwordfile` (bcrypt hashed)

2. **Ingestor Credentials** (username = `sentinel_ingestor`)
   - Internal service with cross-tenant read access
   - Consumes all `tenants/+/iot/#` topics
   - Hardcoded in docker-compose, not in passwordfile

3. **Admin Credentials** (username = `admin`)
   - Full broker access for monitoring/debugging
   - Manually added to passwordfile
   - Used by `mosquitto_sub` commands in scripts

### Connection Security

| Port | Protocol | Use Case |
|------|----------|----------|
| 1883 | MQTT over TCP (plaintext) | Internal services only (bound to 127.0.0.1) |
| 8883 | MQTT over TLS | External devices in production |

**Production checklist:**
- [ ] Generate TLS certificates: `bash mosquitto/gen-certs.sh <domain>`
- [ ] Update `docker-compose.yml` to bind 1883 to internal network only
- [ ] Expose 8883 to external devices
- [ ] Set strong passwords for all tenants
- [ ] Enable `log_type all` for audit trails

## Credential Management

### Provisioning a New Tenant

```bash
php artisan tenant:provision acme
```

Output:
```
✓ Tenant 'acme' provisioned successfully

MQTT Credentials:
  Username: acme
  Password: [auto-generated 32-char password]

Topic Namespace:
  Publish: tenants/acme/iot/<building>/<room>/<device_id>/telemetry
  Events:  tenants/acme/iot/<building>/<room>/<device_id>/event

Reload broker: docker compose restart mosquitto
```

### Regenerating Credentials

```bash
php artisan tenant:provision acme --force
```

**Warning:** This invalidates existing device connections. Coordinate with device firmware updates.

### Manual Credential Management

For advanced use cases (e.g., rotating credentials without downtime):

```bash
# Generate new hash
mosquitto_passwd -n acme <new_password>

# Update mosquitto/secrets/passwordfile
# Format: username:hash

# Reload without restart
docker exec sentinel-mosquitto mosquitto_passwd -r
```

## Verification

### Test Tenant Isolation

```bash
# 1. Tenant A publishes to their namespace (should succeed)
docker exec sentinel-mosquitto mosquitto_pub \
  -u acme -P <password> \
  -t tenants/acme/iot/b1/r1/d1/telemetry \
  -m '{"temp":22.5}' -q 1

# 2. Tenant A publishes to tenant B's namespace (should be denied)
docker exec sentinel-mosquitto mosquitto_pub \
  -u acme -P <password> \
  -t tenants/globex/iot/b1/r1/d1/telemetry \
  -m '{"temp":99.9}' -q 1

# 3. Check broker logs for denial
docker logs sentinel-mosquitto 2>&1 | grep -i "denied"
```

Expected output:
```
Denied PUBLISH from acme (tenants/globex/iot/b1/r1/d1/telemetry)
```

### Test Cross-Tenant Subscription

```bash
# Tenant A tries to subscribe to tenant B's namespace
docker exec sentinel-mosquitto mosquitto_sub \
  -u acme -P <password> \
  -t tenants/globex/iot/# -v

# Should receive no messages (subscription silently rejected)
```

## Deployment Patterns

### Pattern 1: Single-Instance Multi-Tenant

One broker serving multiple tenants via namespace isolation.

```
┌─────────────────────────────────────────┐
│  Mosquitto Broker (sentinel-mosquitto)  │
│  ├── :1883 (internal only)              │
│  └── :8883 (TLS, external)              │
└─────────────────────────────────────────┘
         ▲              ▲
         │              │
    acme devices   globex devices
    tenants/acme/* tenants/globex/*
```

**Pros:** Simple, cost-effective for small tenant counts  
**Cons:** Single point of failure, no tenant-level resource isolation

### Pattern 2: Broker-Per-Tenant

Each tenant gets a dedicated broker instance.

```
┌──────────────┐  ┌──────────────┐
│ Mosquitto-A  │  │ Mosquitto-B  │
│ tenants/acme │  │tenants/globex│
└──────────────┘  └──────────────┘
```

**Pros:** Full isolation, independent scaling, blast radius containment  
**Cons:** Operational complexity, higher infrastructure costs

### Pattern 3: Hybrid (Recommended for SaaS)

Shared broker for development/staging, dedicated brokers for production tenants with SLA requirements.

## Integration with Laravel

### Tenant Model

```php
class Tenant extends Model
{
    protected $fillable = ['slug', 'name', 'mqtt_username'];
    
    public function publish($topic, $payload): void
    {
        $fullTopic = "tenants/{$this->slug}/{$topic}";
        app(MqttClient::class)->publish($fullTopic, $payload);
    }
}
```

### Ingestor Service

The `sentinel-mqtt-ingestor` service:
1. Subscribes to `tenants/+/iot/+/+/+/telemetry`
2. Extracts tenant slug from topic: `tenants/{slug}/iot/...`
3. Stores telemetry with `tenant_id` foreign key
4. Enforces tenant isolation at the database layer

```python
# services/mqtt-ingestor/app.py
def on_message(client, userdata, msg):
    match = re.match(r'tenants/([^/]+)/iot/([^/]+)/([^/]+)/([^/]+)/telemetry', msg.topic)
    if not match:
        return
    
    tenant_slug, building, room, device_id = match.groups()
    tenant = get_or_create_tenant(tenant_slug)
    
    # Store with tenant isolation
    TelemetryLog.create(
        tenant_id=tenant.id,
        device_id=device_id,
        payload=json.loads(msg.payload)
    )
```

## Security Best Practices

1. **Never reuse passwords** across tenants or environments
2. **Rotate credentials quarterly** using `--force` flag
3. **Monitor broker logs** for unauthorized access attempts
4. **Use TLS in production** (port 8883) for all external connections
5. **Restrict plaintext port** (1883) to internal services only
6. **Implement rate limiting** per tenant to prevent abuse
7. **Audit topic patterns** to ensure no wildcards in tenant slugs
8. **Backup passwordfile** before bulk credential updates

## Troubleshooting

### "Connection Refused" for Valid Credentials

```bash
# Check if broker loaded the passwordfile
docker logs sentinel-mosquitto 2>&1 | grep "Loading password file"

# Verify username exists
grep "^acme:" mosquitto/secrets/passwordfile
```

### Tenant Can Publish to Other Namespaces

```bash
# Check ACL file syntax
cat mosquitto/config/aclfile

# Verify ACL loaded
docker logs sentinel-mosquitto 2>&1 | grep "Loading ACL"

# Test with verbose logging
docker exec sentinel-mosquitto mosquitto_pub -u acme -t tenants/other/... -d
```

### High Connection Churn

```bash
# Check connection logs
docker logs sentinel-mosquitto 2>&1 | grep "New connection"

# Verify keepalive settings in client config
# Recommended: keepalive=60, clean_session=true
```

## References

- [Mosquitto Authentication](https://mosquitto.org/man/mosquitto-conf-5.html#authentication)
- [Mosquitto ACL Syntax](https://mosquitto.org/man/mosquitto-conf-5.html#topic)
- [MQTT v3.1.1 Spec](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html)
