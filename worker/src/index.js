import { neon } from "@neondatabase/serverless";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // allow your frontend to call this API
      "access-control-allow-origin": "*",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // basic health check
    if (url.pathname === "/") {
      return new Response("Lessons API is running");
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, time: new Date().toISOString() });
    }

    // DB test endpoint
    if (url.pathname === "/api/db") {
      if (!env.DATABASE_URL) {
        return json(
          { ok: false, error: "DATABASE_URL secret is not set in Cloudflare" },
          500
        );
      }

      const sql = neon(env.DATABASE_URL);
      const rows = await sql`SELECT now() as now`;
      return json({ ok: true, rows });
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
