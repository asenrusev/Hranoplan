import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("id, name, is_snack, is_lunch, is_breakfast, is_dinner");

    if (error) {
      console.error("Supabase error fetching recipes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unhandled error in GET /api/recipes:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
