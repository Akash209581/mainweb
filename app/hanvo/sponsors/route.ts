import { fail, ok } from "@/lib/api/response";
import { listSponsors } from "@/lib/repositories/public-content.repository";
import { paginationSchema } from "@/lib/validation/schemas";

export async function GET(request: Request) {
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = paginationSchema.parse(params);
    return ok(await listSponsors(query));
  } catch (error) {
    return fail(error);
  }
}
