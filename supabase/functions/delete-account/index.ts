// POST -> { deleted: true }
//
// Permanently deletes the signed-in user's account. Their searches, gift
// ideas, saved gifts and preferences are removed with it (ON DELETE CASCADE).
// The App Store requires apps with sign-up to offer this inside the app.
import { withSupabase } from "npm:@supabase/server@1.9.2";
import { errorJson, handleUnexpected, json } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return errorJson("Method not allowed", 405);

    const userId = ctx.userClaims?.id;
    if (!userId) return errorJson("Please sign in again.", 401);

    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return handleUnexpected(error);

    return json({ deleted: true });
  }),
};
