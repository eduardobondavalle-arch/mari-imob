import { z } from "zod";
import { db } from "@/lib/mari/db";
import {
  assert,
  checkOrigin,
  errorResponse,
  readJson,
  rateLimit,
  requestIp,
} from "@/lib/mari/http";
import {
  adminLogin,
  changePassword,
  logout,
  requireAdmin,
  sendOtp,
  verifyOtp,
} from "@/lib/mari/auth";
import {
  clientState,
  registerSelection,
  changeSelection,
  contactRequest,
  sharedSelection,
  deleteAccount,
} from "@/lib/mari/client-service";
import {
  adminProperties,
  dashboard,
  leadDetail,
  leadList,
  saveContent,
  saveField,
  saveProperty,
  settingsData,
} from "@/lib/mari/admin-service";
import { getListing, searchCatalog } from "@/lib/mari/catalog";
import { deleteMedia, uploadMedia } from "@/lib/mari/storage";
import {
  board,
  saveStage,
  reorderStages,
  deleteStage,
  moveLead,
  manualLead,
  leadExtras,
  saveComment,
  saveAdminSelection,
} from "@/lib/mari/crm-service";
import {
  appointments,
  appointmentDetail,
  saveAppointment,
} from "@/lib/mari/agenda-service";
import { saveConsultation } from "@/lib/mari/consultation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
async function handle(request: Request, context: Context) {
  try {
    const segments = (await context.params).path;
    const path = segments.join("/");
    const method = request.method;
    if (process.env.PRESENTATION_MODE === "true") {
      if (method === "GET" && path === "client")
        return Response.json(null, {
          headers: { "Cache-Control": "no-store" },
        });
      assert(
        method === "GET" &&
          (path === "properties" ||
            (segments.length === 2 && segments[0] === "properties")),
        403,
        "Esta prévia permite somente a navegação pelo catálogo. Cadastros e acessos privados estão desativados.",
      );
    }
    const url = new URL(request.url);
    const id = segments[2];
    if (!["GET", "HEAD"].includes(method)) checkOrigin(request);
    let result: unknown;
    if (path === "consultation" && method === "POST")
      result = await saveConsultation(await readJson(request));
    if (path.startsWith("admin/") && path !== "admin/login")
      await requireAdmin(path === "admin/password" || path === "admin/logout");
    if (path === "admin/board" && method === "GET")
      result = await board(url.searchParams.get("q")?.slice(0, 100) || "");
    else if (path === "admin/stages/order" && method === "PUT")
      result = await reorderStages(await readJson(request));
    else if (segments[0] === "admin" && segments[1] === "stages") {
      if (method === "POST" || method === "PUT")
        result = await saveStage(await readJson(request), id);
      else if (method === "DELETE" && id)
        result = await deleteStage(id, await readJson(request));
      else assert(false, 405, "Operação inválida.");
    } else if (path === "admin/lead-move" && method === "POST")
      result = await moveLead(await readJson(request));
    else if (path === "admin/leads" && method === "POST")
      result = await manualLead(
        await readJson(request),
        (await requireAdmin()).id,
      );
    else if (
      segments[0] === "admin" &&
      segments[1] === "lead-extras" &&
      id &&
      method === "GET"
    )
      result = await leadExtras(id);
    else if (segments[0] === "admin" && segments[1] === "comments") {
      const admin = await requireAdmin();
      if (method === "POST" || method === "PUT")
        result = await saveComment(await readJson(request), admin.id, id);
      else if (method === "DELETE" && id) {
        const comment = await db.leadComment.findUnique({ where: { id } });
        assert(
          comment?.authorId === admin.id,
          403,
          "Somente o autor pode excluir o comentário.",
        );
        await db.leadComment.delete({ where: { id } });
        result = { ok: true };
      } else assert(false, 405, "Operação inválida.");
    } else if (segments[0] === "admin" && segments[1] === "selections") {
      if (method === "POST" || method === "PUT")
        result = await saveAdminSelection(await readJson(request), id);
      else if (method === "DELETE" && id) {
        await db.selection.deleteMany({ where: { id, origin: "admin" } });
        result = { ok: true };
      } else assert(false, 405, "Operação inválida.");
    } else if (path === "admin/appointment-types" && method === "GET")
      result = await db.appointmentType.findMany({ orderBy: { name: "asc" } });
    else if (segments[0] === "admin" && segments[1] === "appointments") {
      if (method === "GET")
        result = id
          ? await appointmentDetail(id)
          : await appointments(url.searchParams);
      else if (method === "POST" || method === "PUT")
        result = await saveAppointment(
          await readJson(request),
          (await requireAdmin()).id,
          id,
        );
      else if (method === "DELETE" && id) {
        await db.appointment.delete({ where: { id } });
        result = { ok: true };
      } else assert(false, 405, "Operação inválida.");
    } else if (path === "admin/login" && method === "POST")
      result = await adminLogin(await readJson(request), request);
    else if (path === "admin/password" && method === "POST")
      result = await changePassword(await readJson(request));
    else if (path === "admin/logout" && method === "POST") {
      await logout("admin");
      result = { ok: true };
    } else if (path === "admin/dashboard" && method === "GET")
      result = await dashboard();
    else if (path === "admin/settings" && method === "GET")
      result = await settingsData();
    else if (path === "admin/content" && method === "POST")
      result = await saveContent(await readJson(request));
    else if (segments[1] === "properties" && segments[0] === "admin") {
      if (method === "GET")
        result = await adminProperties(
          url.searchParams.get("q")?.slice(0, 150) || "",
          url.searchParams.get("status") || "",
        );
      else if (method === "POST" || method === "PUT")
        result = await saveProperty(await readJson(request), id);
      else if (method === "PATCH" && id)
        result = await db.property.update({
          where: { id },
          data: z
            .object({
              featured: z.boolean().optional(),
              status: z
                .enum(["draft", "published", "hidden", "sold", "rented"])
                .optional(),
            })
            .parse(await readJson(request)),
        });
      else if (method === "DELETE" && id) {
        await db.property.delete({ where: { id } });
        result = { ok: true };
      } else assert(false, 405, "Operação inválida.");
    } else if (segments[0] === "admin" && segments[1] === "fields") {
      if (method === "POST" || method === "PUT")
        result = await saveField(await readJson(request), id);
      else if (method === "DELETE" && id) {
        const count = await db.propertyValue.count({ where: { fieldId: id } });
        result = count
          ? await db.customField.update({
              where: { id },
              data: {
                archived: true,
                required: false,
                filterable: false,
                public: false,
              },
            })
          : await db.customField.delete({ where: { id } });
      } else assert(false, 405, "Operação inválida.");
    } else if (
      segments[0] === "admin" &&
      ["tags", "taxonomies"].includes(segments[1])
    ) {
      const isTag = segments[1] === "tags";
      if (method === "DELETE" && id) {
        result = isTag
          ? await db.tag.delete({ where: { id } })
          : await db.taxonomy.delete({ where: { id } });
      } else if (["POST", "PUT"].includes(method)) {
        const data = z
          .object({
            name: z.string().trim().min(2).max(80),
            kind: z.enum(["category", "situation"]).optional(),
          })
          .parse(await readJson(request));
        result = isTag
          ? id
            ? await db.tag.update({ where: { id }, data: { name: data.name } })
            : await db.tag.create({ data: { name: data.name } })
          : id
            ? await db.taxonomy.update({
                where: { id },
                data: { name: data.name },
              })
            : await db.taxonomy.create({
                data: { name: data.name, kind: data.kind || "category" },
              });
      } else assert(false, 405, "Operação inválida.");
    } else if (path === "admin/upload" && method === "POST") {
      await rateLimit(`upload:${requestIp(request)}`, 100);
      result = await uploadMedia(request);
    } else if (
      segments[0] === "admin" &&
      segments[1] === "media" &&
      method === "DELETE" &&
      id
    )
      result = await deleteMedia(id);
    else if (
      segments[0] === "admin" &&
      segments[1] === "leads" &&
      method === "GET"
    )
      result = id
        ? await leadDetail(id)
        : await leadList(url.searchParams.get("q")?.slice(0, 100) || "");
    else if (
      segments[0] === "admin" &&
      segments[1] === "leads" &&
      id &&
      method === "DELETE"
    ) {
      await db.lead.delete({ where: { id } });
      result = { ok: true };
    } else if (
      segments[0] === "admin" &&
      segments[1] === "requests" &&
      id &&
      method === "PATCH"
    )
      result = await db.contactRequest.update({
        where: { id },
        data: z
          .object({ status: z.enum(["new", "handled"]) })
          .parse(await readJson(request)),
      });
    else if (path === "client" && method === "GET")
      result = await clientState();
    else if (path === "client/register" && method === "POST")
      result = await registerSelection(await readJson(request), request);
    else if (path === "client/otp" && method === "POST")
      result = await sendOtp(await readJson(request), request);
    else if (path === "client/verify" && method === "POST")
      result = await verifyOtp(await readJson(request), request);
    else if (path === "client/logout" && method === "POST") {
      await logout("client");
      result = { ok: true };
    } else if (path === "client/account" && method === "DELETE") {
      result = await deleteAccount();
      await logout("client");
    } else if (
      segments[0] === "selection" &&
      segments[1] &&
      ["POST", "DELETE"].includes(method)
    )
      result = await changeSelection(segments[1], method === "DELETE");
    else if (segments[0] === "shared" && segments[1] && method === "GET") {
      result = await sharedSelection(segments[1]);
      assert(result, 404, "Seleção não encontrada.");
    } else if (path === "contact" && method === "POST")
      result = await contactRequest(await readJson(request), request);
    else if (path === "properties" && method === "GET")
      result = await searchCatalog(url.searchParams);
    else if (segments[0] === "properties" && segments[1] && method === "GET") {
      result = await getListing(segments[1]);
      assert(result, 404, "Imóvel indisponível.");
    } else assert(false, 404, "Rota não encontrada.");
    return Response.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
};
