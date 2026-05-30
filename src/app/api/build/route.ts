const buildId = process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString();

export async function GET() {
  return Response.json({ id: buildId });
}
