import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function clean(value: FormDataEntryValue | null, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const data = await request.formData();

    if (clean(data.get("companyWebsite"), 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = clean(data.get("name"), 80);
    const email = clean(data.get("email"), 160).toLowerCase();
    const type = clean(data.get("type"), 80);
    const message = clean(data.get("message"), 3000);

    if (
      name.length < 2 ||
      message.length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Controleer je naam, e-mail en bericht." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_requests").insert({
      name,
      email,
      request_type: type,
      message,
      status: "new",
    });

    if (error) {
      console.error("Contact insert failed:", error.message);
      return NextResponse.json(
        { error: "Versturen lukt nu niet. Mail naar info@voidworks.eu." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Contact route failed:", error);
    return NextResponse.json(
      { error: "Versturen lukt nu niet. Mail naar info@voidworks.eu." },
      { status: 500 }
    );
  }
}
