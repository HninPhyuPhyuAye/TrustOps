export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "trustops",
      environment: process.env.TRUSTOPS_DEPLOYMENT_ENV ?? "local-demo",
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
