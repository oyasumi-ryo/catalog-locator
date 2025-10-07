export async function POST(req: Request) {
  const body = await req.json();
  const { store, item } = body;

  return new Response(`「${store}」で「${item}」を買うなら文房具コーナーです！`, {
    status: 200,
  });
}
