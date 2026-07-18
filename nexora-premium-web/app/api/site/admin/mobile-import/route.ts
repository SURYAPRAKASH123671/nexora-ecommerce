import * as XLSX from "xlsx";
import { commerceEnv, errorResponse, HttpError, requireAdmin } from "@/lib/site-commerce";

type Raw = Record<string, unknown>;
type ImportError = { rowNumber: number; fieldName: string | null; errorCode: string; message: string; raw: Raw };
type MobileRow = {
  externalId: string; officialName: string; brand: string; brandOfficialUrl: string;
  series: string | null; seriesOfficialUrl: string | null; launchDate: string | null;
  indiaAvailability: string; availabilitySourceUrl: string; specificationSourceUrl: string;
  mediaSourceUrl: string | null; verifiedAt: string;
  variants: Array<{ id: string; sku: string | null; ram: string | null; storage: string | null; colour: string | null; officialVariantName: string; sourceUrl: string }>;
  specifications: Array<{ groupName: string; specKey: string; specValue: string; sourceUrl: string }>;
  media: Array<{ id: string; variantId: string | null; mediaType: string; url: string; altText: string; position: number; sourceUrl: string }>;
};

export async function GET(request: Request) {
  try {
    requireAdmin(request);
    const template = [
      "externalId,officialName,brand,brandOfficialUrl,series,seriesOfficialUrl,launchDate,indiaAvailability,availabilitySourceUrl,specificationSourceUrl,mediaSourceUrl,verifiedAt,variants,specifications,media",
    ].join("\n");
    return new Response(template, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="nexora-mobile-import-template.csv"' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const admin = requireAdmin(request);
    const { records, fileName, format } = await readRecords(request);
    if (!records.length) throw new HttpError(400, "The import contains no records.");
    if (records.length > 10_000) throw new HttpError(400, "Import a maximum of 10,000 models per job.");

    const errors: ImportError[] = [];
    const seen = new Set<string>();
    const valid: MobileRow[] = [];
    records.forEach((raw, index) => {
      try {
        const row = validate(raw, index + 2);
        if (seen.has(row.externalId)) throw new Validation("externalId", "DUPLICATE_EXTERNAL_ID", "Duplicate externalId in this import.");
        seen.add(row.externalId);
        valid.push(row);
      } catch (error) {
        const issue = error instanceof Validation ? error : new Validation(null, "INVALID_RECORD", error instanceof Error ? error.message : "Invalid record.");
        errors.push({ rowNumber: index + 2, fieldName: issue.field, errorCode: issue.code, message: issue.message, raw });
      }
    });

    const { DB } = commerceEnv();
    const jobId = crypto.randomUUID();
    const now = new Date().toISOString();
    await DB.prepare("INSERT INTO mobile_import_jobs (id, actor_email, file_name, format, status, total_rows, rejected_rows, created_at) VALUES (?, ?, ?, ?, 'PROCESSING', ?, ?, ?)")
      .bind(jobId, admin.email, fileName, format, records.length, errors.length, now).run();

    if (!valid.length) {
      await saveErrors(DB, jobId, errors);
      await DB.prepare("UPDATE mobile_import_jobs SET status='REJECTED', completed_at=? WHERE id=?").bind(now, jobId).run();
      return Response.json({ jobId, total: records.length, inserted: 0, updated: 0, rejected: errors.length, errors: publicErrors(errors) }, { status: 422 });
    }

    await runBatches(DB, uniqueBy(valid, (row) => row.brand).map((row) =>
      DB.prepare("INSERT INTO mobile_brands (name, slug, official_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET official_url=excluded.official_url, updated_at=excluded.updated_at")
        .bind(row.brand, slug(row.brand), row.brandOfficialUrl, now, now)));
    const brandRows = await DB.prepare("SELECT id, name FROM mobile_brands").all<{ id: number; name: string }>();
    const brandIds = new Map(brandRows.results.map((row) => [row.name, Number(row.id)]));

    const seriesRows = uniqueBy(valid.filter((row) => row.series), (row) => `${row.brand}|${row.series}`);
    await runBatches(DB, seriesRows.map((row) => DB.prepare("INSERT INTO mobile_series (brand_id, name, slug, official_url) VALUES (?, ?, ?, ?) ON CONFLICT(brand_id, slug) DO UPDATE SET name=excluded.name, official_url=excluded.official_url")
      .bind(brandIds.get(row.brand), row.series, slug(row.series!), row.seriesOfficialUrl)));
    const allSeries = await DB.prepare("SELECT id, brand_id, slug FROM mobile_series").all<{ id: number; brand_id: number; slug: string }>();
    const seriesIds = new Map(allSeries.results.map((row) => [`${row.brand_id}|${row.slug}`, Number(row.id)]));
    const existing = await existingIds(DB, valid.map((row) => row.externalId));

    await runBatches(DB, valid.map((row) => {
      const brandId = brandIds.get(row.brand)!;
      const seriesId = row.series ? seriesIds.get(`${brandId}|${slug(row.series)}`) ?? null : null;
      return DB.prepare("INSERT INTO mobile_models (brand_id, series_id, external_id, official_name, slug, launch_date, india_availability, availability_source_url, specification_source_url, media_source_url, verification_status, publish_status, verified_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED_REGISTRY', 'DRAFT', ?, ?, ?) ON CONFLICT(external_id) DO UPDATE SET brand_id=excluded.brand_id, series_id=excluded.series_id, official_name=excluded.official_name, slug=excluded.slug, launch_date=excluded.launch_date, india_availability=excluded.india_availability, availability_source_url=excluded.availability_source_url, specification_source_url=excluded.specification_source_url, media_source_url=excluded.media_source_url, verification_status='VERIFIED_REGISTRY', verified_at=excluded.verified_at, updated_at=excluded.updated_at")
        .bind(brandId, seriesId, row.externalId, row.officialName, slug(`${row.brand}-${row.officialName}-${row.externalId}`), row.launchDate, row.indiaAvailability, row.availabilitySourceUrl, row.specificationSourceUrl, row.mediaSourceUrl, row.verifiedAt, now, now);
    }));

    const modelRows = await idsFor(DB, valid.map((row) => row.externalId));
    const modelIds = new Map(modelRows.map((row) => [row.external_id, row.id]));
    const childStatements: unknown[] = [];
    for (const row of valid) {
      const modelId = modelIds.get(row.externalId)!;
      for (const item of row.variants) childStatements.push(DB.prepare("INSERT INTO mobile_model_variants (id, model_id, sku, ram, storage, colour, official_variant_name, source_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET sku=excluded.sku, ram=excluded.ram, storage=excluded.storage, colour=excluded.colour, official_variant_name=excluded.official_variant_name, source_url=excluded.source_url").bind(item.id, modelId, item.sku, item.ram, item.storage, item.colour, item.officialVariantName, item.sourceUrl));
      for (const item of row.specifications) childStatements.push(DB.prepare("INSERT INTO mobile_model_specifications (model_id, group_name, spec_key, spec_value, source_url) VALUES (?, ?, ?, ?, ?) ON CONFLICT(model_id, group_name, spec_key) DO UPDATE SET spec_value=excluded.spec_value, source_url=excluded.source_url").bind(modelId, item.groupName, item.specKey, item.specValue, item.sourceUrl));
      for (const item of row.media) childStatements.push(DB.prepare("INSERT INTO mobile_model_media (id, model_id, variant_id, media_type, url, alt_text, position, source_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET variant_id=excluded.variant_id, media_type=excluded.media_type, url=excluded.url, alt_text=excluded.alt_text, position=excluded.position, source_url=excluded.source_url").bind(item.id, modelId, item.variantId, item.mediaType, item.url, item.altText, item.position, item.sourceUrl));
    }
    await runBatches(DB, childStatements);
    await saveErrors(DB, jobId, errors);
    const inserted = valid.filter((row) => !existing.has(row.externalId)).length;
    const updated = valid.length - inserted;
    await DB.prepare("UPDATE mobile_import_jobs SET status=?, inserted_rows=?, updated_rows=?, rejected_rows=?, completed_at=? WHERE id=?")
      .bind(errors.length ? "COMPLETED_WITH_ERRORS" : "COMPLETED", inserted, updated, errors.length, new Date().toISOString(), jobId).run();
    return Response.json({ jobId, total: records.length, inserted, updated, rejected: errors.length, errors: publicErrors(errors), publication: "Imported models remain DRAFT until an administrator completes publication checks." }, { status: errors.length ? 207 : 200 });
  } catch (error) { return errorResponse(error); }
}

async function readRecords(request: Request): Promise<{ records: Raw[]; fileName: string; format: string }> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = await request.json() as Raw[] | { records?: Raw[] };
    const records = Array.isArray(body) ? body : body.records;
    if (!Array.isArray(records)) throw new HttpError(400, "JSON body must be an array or contain a records array.");
    return { records, fileName: "api-import.json", format: "JSON_API" };
  }
  if (!type.includes("multipart/form-data")) throw new HttpError(415, "Upload CSV, XLSX, XLS, JSON, or send JSON through the API.");
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose an import file.");
  if (file.size > 20_000_000) throw new HttpError(413, "Import file exceeds 20 MB.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "json") return { records: JSON.parse(await file.text()), fileName: file.name, format: "JSON" };
  if (extension === "csv") return { records: parseCsv(await file.text()), fileName: file.name, format: "CSV" };
  if (extension === "xlsx" || extension === "xls") {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return { records: XLSX.utils.sheet_to_json<Raw>(sheet, { defval: "" }), fileName: file.name, format: extension.toUpperCase() };
  }
  throw new HttpError(415, "Supported formats: CSV, XLSX, XLS, and JSON.");
}

function validate(raw: Raw, rowNumber: number): MobileRow {
  const required = (name: string) => { const value = String(raw[name] ?? "").trim(); if (!value) throw new Validation(name, "REQUIRED", `${name} is required on row ${rowNumber}.`); return value; };
  const url = (name: string, optional = false) => { const value = String(raw[name] ?? "").trim(); if (!value && optional) return null; if (!/^https:\/\/[^\s]+$/i.test(value)) throw new Validation(name, "INVALID_SOURCE_URL", `${name} must be a public HTTPS URL.`); return value; };
  const externalId = required("externalId");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(externalId)) throw new Validation("externalId", "INVALID_EXTERNAL_ID", "externalId must be a stable source identifier.");
  const verifiedAt = required("verifiedAt");
  if (Number.isNaN(Date.parse(verifiedAt))) throw new Validation("verifiedAt", "INVALID_DATE", "verifiedAt must be an ISO date.");
  const launchDateRaw = String(raw.launchDate ?? "").trim();
  if (launchDateRaw && Number.isNaN(Date.parse(launchDateRaw))) throw new Validation("launchDate", "INVALID_DATE", "launchDate must be an ISO date when supplied.");
  return {
    externalId, officialName: required("officialName"), brand: required("brand"), brandOfficialUrl: url("brandOfficialUrl")!,
    series: nullable(raw.series), seriesOfficialUrl: url("seriesOfficialUrl", true), launchDate: launchDateRaw || null,
    indiaAvailability: required("indiaAvailability"), availabilitySourceUrl: url("availabilitySourceUrl")!, specificationSourceUrl: url("specificationSourceUrl")!, mediaSourceUrl: url("mediaSourceUrl", true), verifiedAt: new Date(verifiedAt).toISOString(),
    variants: jsonArray(raw.variants, "variants").map((item, i) => ({ id: textValue(item.id) || `${externalId}:variant:${i + 1}`, sku: nullable(item.sku), ram: nullable(item.ram), storage: nullable(item.storage), colour: nullable(item.colour), officialVariantName: requiredChild(item, "officialVariantName", "variants"), sourceUrl: httpsChild(item, "sourceUrl", "variants") })),
    specifications: jsonArray(raw.specifications, "specifications").map((item) => ({ groupName: requiredChild(item, "groupName", "specifications"), specKey: requiredChild(item, "specKey", "specifications"), specValue: requiredChild(item, "specValue", "specifications"), sourceUrl: httpsChild(item, "sourceUrl", "specifications") })),
    media: jsonArray(raw.media, "media").map((item, i) => ({ id: textValue(item.id) || `${externalId}:media:${i + 1}`, variantId: nullable(item.variantId), mediaType: textValue(item.mediaType) || "IMAGE", url: httpsChild(item, "url", "media"), altText: requiredChild(item, "altText", "media"), position: Number.isInteger(Number(item.position)) ? Number(item.position) : i, sourceUrl: httpsChild(item, "sourceUrl", "media") })),
  };
}

class Validation extends Error { constructor(public field: string | null, public code: string, message: string) { super(message); } }
function nullable(value: unknown) { const result = String(value ?? "").trim(); return result || null; }
function textValue(value: unknown) { return String(value ?? "").trim(); }
function requiredChild(row: Raw, key: string, group: string) { const value = textValue(row[key]); if (!value) throw new Validation(group, "INVALID_NESTED_RECORD", `${group}.${key} is required.`); return value; }
function httpsChild(row: Raw, key: string, group: string) { const value = requiredChild(row, key, group); if (!/^https:\/\/[^\s]+$/i.test(value)) throw new Validation(group, "INVALID_SOURCE_URL", `${group}.${key} must be HTTPS.`); return value; }
function jsonArray(value: unknown, field: string): Raw[] { if (value == null || value === "") return []; try { const parsed = typeof value === "string" ? JSON.parse(value) : value; if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item !== "object" || Array.isArray(item))) throw new Error(); return parsed as Raw[]; } catch { throw new Validation(field, "INVALID_JSON", `${field} must be a JSON array.`); } }
function slug(value: string) { return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function uniqueBy<T>(rows: T[], key: (row: T) => string) { return [...new Map(rows.map((row) => [key(row), row])).values()]; }
function publicErrors(errors: ImportError[]) { return errors.slice(0, 100).map(({ raw: _raw, ...error }) => error); }

function parseCsv(text: string): Raw[] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i <= text.length; i += 1) { const c = text[i] ?? "\n"; if (quoted && c === '"' && text[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') quoted = !quoted; else if (!quoted && c === ",") { row.push(cell); cell = ""; } else if (!quoted && (c === "\n" || c === "\r")) { if (c === "\r" && text[i + 1] === "\n") i += 1; row.push(cell); cell = ""; if (row.some((value) => value.trim())) rows.push(row); row = []; } else cell += c; }
  const headers = rows.shift()?.map((value) => value.trim()) ?? [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

type D1 = ReturnType<typeof commerceEnv>["DB"];
async function runBatches(DB: D1, statements: unknown[]) { for (let i = 0; i < statements.length; i += 50) await DB.batch(statements.slice(i, i + 50) as Parameters<D1["batch"]>[0]); }
async function saveErrors(DB: D1, jobId: string, errors: ImportError[]) { await runBatches(DB, errors.map((error) => DB.prepare("INSERT INTO mobile_import_errors (job_id, row_number, field_name, error_code, message, raw_record_json) VALUES (?, ?, ?, ?, ?, ?)").bind(jobId, error.rowNumber, error.fieldName, error.errorCode, error.message, JSON.stringify(error.raw)))); }
async function idsFor(DB: D1, ids: string[]) { const output: Array<{ id: number; external_id: string }> = []; for (let i = 0; i < ids.length; i += 80) { const chunk = ids.slice(i, i + 80); const result = await DB.prepare(`SELECT id, external_id FROM mobile_models WHERE external_id IN (${chunk.map(() => "?").join(",")})`).bind(...chunk).all<{ id: number; external_id: string }>(); output.push(...result.results.map((row) => ({ id: Number(row.id), external_id: row.external_id }))); } return output; }
async function existingIds(DB: D1, ids: string[]) { return new Set((await idsFor(DB, ids)).map((row) => row.external_id)); }
