import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No user found" });
  }

  const { data, error } = await supabase
    .from("app_members")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    user_id: user.id,
    email: user.email,
    memberData: data,
    error: error?.message || null,
    errorCode: error?.code || null,
    errorDetails: error?.details || null,
  });
}
