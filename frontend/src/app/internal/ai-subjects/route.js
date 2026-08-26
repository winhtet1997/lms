export async function GET() {
  try {
    const res = await fetch(process.env.AI_TUTOR_API_URL, {
      headers: { Authorization: `Bearer ${process.env.AI_TUTOR_API_KEY}` },
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return Response.json(data);
  } catch {
    return Response.json({ success: false, data: [] }, { status: 500 });
  }
}
