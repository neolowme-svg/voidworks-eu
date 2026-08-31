import {NextResponse} from "next/server";
export async function DELETE(){return NextResponse.json({error:"VERIFICATION_REQUIRED"},{status:409,headers:{"Cache-Control":"no-store"}})}
