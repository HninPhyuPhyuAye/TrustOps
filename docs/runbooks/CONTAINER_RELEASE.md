# Runbook: container build and smoke test

## Build and start

Start Docker Desktop, then run:

```bash
docker compose build --pull
docker compose up -d
```

The Compose profile runs the image as UID 1001, drops all Linux capabilities,
prevents privilege escalation, uses a read-only root filesystem, and provides
temporary writable cache paths. The final runtime image also omits npm,
Corepack, and Yarn because production only needs the Node.js runtime.

## Verify

```bash
curl --fail http://localhost:3000/api/health
docker compose ps
docker compose logs --tail=100 trustops
docker compose exec trustops id
```

Confirm the health endpoint is successful, the container becomes healthy, and
the process user is not root. Exercise workspace switching, one incident, one AI
investigation, one approved simulation, and the audit trail.

## Stop and remove local runtime resources

```bash
docker compose down
```

This removes the local container and network. The image remains locally for
reuse; removing it is optional and unrelated to AWS.
