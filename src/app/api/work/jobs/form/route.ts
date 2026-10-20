import { NextResponse } from "next/server";
import { rpc } from "@/lib/server/db";
import { readJson, requireUser, UUID_RE } from "@/lib/server/user";
import { invalidResponse, workError } from "@/lib/server/work";
import { jobPayload, validateJobForm, type JobInput } from "@/lib/add-forms";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const guard = await requireUser(request);
  if (guard.error) return guard.error;
  const body = await readJson(request);
  const mode = body.mode === "publish" ? "publish" : "draft";
  const input: JobInput = {
    title: String(body.title ?? ""),
    clinic: String(body.clinic ?? ""),
    city: String(body.city ?? ""),
    district: String(body.district ?? ""),
    address: String(body.address ?? ""),
    type: String(body.type ?? "full"),
    salaryMin: body.salaryMin == null ? "" : String(body.salaryMin),
    salaryMax: body.salaryMax == null ? "" : String(body.salaryMax),
    negotiable: body.salaryNegotiable === true || body.negotiable === true,
    experienceYears: String(body.experienceYears ?? "0"),
    requirements: Array.isArray(body.requirements) ? body.requirements.filter((item): item is string => typeof item === "string").join("\n") : String(body.requirements ?? ""),
    duties: Array.isArray(body.duties) ? body.duties.filter((item): item is string => typeof item === "string").join("\n") : String(body.duties ?? ""),
    benefits: Array.isArray(body.benefits) ? body.benefits.filter((item): item is string => typeof item === "string") : [],
    benefitNote: String(body.benefitNote ?? ""),
    phone: String(body.phone ?? ""),
    telegram: String(body.telegram ?? ""),
    email: String(body.email ?? ""),
    sourceUrl: String(body.sourceUrl ?? ""),
    instagram: String(body.instagram ?? ""),
    acceptApplications: body.acceptApplications !== false,
    salaryMode: body.salaryMode === "percent" || body.salaryMode === "negotiable" ? body.salaryMode : "amount",
  };
  const errors = validateJobForm(input, mode);
  const id = typeof body.id === "string" ? body.id : "";
  if (id && !UUID_RE.test(id)) return NextResponse.json({ ok: false, error: "Vakansiya topilmadi." }, { status: 400 });
  if (Object.keys(errors).length) return invalidResponse(errors);
  try {
    const job = await rpc("sh_job_save", { p_user: guard.userId, p_id: id || null, p_data: jobPayload(input, mode, id) });
    return NextResponse.json({ ok: true, job });
  } catch (e) {
    return workError(e);
  }
}
