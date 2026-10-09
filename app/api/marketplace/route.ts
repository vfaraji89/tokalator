const QUERY = {
  filters: [{ criteria: [{ filterType: 7, value: "vfaraji89.tokalator" }] }],
  flags: 914,
};

export async function GET() {
  try {
    const res = await fetch("https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json;api-version=7.2-preview.1" },
      body: JSON.stringify(QUERY),
      signal: AbortSignal.timeout(5000),
    });
    const ext = (await res.json())?.results?.[0]?.extensions?.[0];
    const stat = (name: string) => ext?.statistics?.find((s: { statisticName: string }) => s.statisticName === name)?.value ?? null;
    return Response.json(
      { installs: stat("install"), downloads: stat("downloadCount"), version: ext?.versions?.[0]?.version ?? null },
      { headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json({ installs: null, downloads: null, version: null }, { status: 502 });
  }
}
