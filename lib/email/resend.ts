import type { Locale } from "@/lib/i18n";
import { portalCopy } from "@/lib/portal-i18n";
import { ADMIN_EMAIL } from "@/lib/security/config";
import { projectReplyAddress } from "@/lib/projects";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function escapeHtml(value:string){return value.replace(/[&<>'"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]||char));}

function shell(title:string, body:string, locale:Locale, footerNote?:string){
  const auto = locale === "nl" ? "Automatisch bericht van Voidworks" : locale === "de" ? "Automatische Nachricht von Voidworks" : "Automated message from Voidworks";
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#000;font-family:Arial,Helvetica,sans-serif;color:#f7f7fa"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#000;padding:36px 16px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#050506;border:1px solid #1d1d23;border-radius:18px;overflow:hidden"><tr><td style="padding:28px 30px 20px;border-bottom:1px solid #19191f"><img src="https://voidworks.eu/assets/voidworks-wordmark.png" width="176" alt="Voidworks" style="display:block;width:176px;max-width:100%;height:auto"></td></tr><tr><td style="padding:32px 30px"><div style="color:#8a63ff;font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">VOIDWORKS</div><h1 style="margin:0 0 14px;font-size:30px;line-height:1.12;color:#fff">${escapeHtml(title)}</h1>${body}</td></tr><tr><td style="padding:18px 30px;border-top:1px solid #19191f;color:#81818c;font-size:12px;line-height:1.65">${escapeHtml(auto)} · no-reply@voidworks.eu${footerNote?`<br>${escapeHtml(footerNote)}`:""}</td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail(to:string|string[], subject:string, html:string, options?:{replyTo?:string|null}){
  const apiKey=process.env.RESEND_API_KEY;
  if(!apiKey)throw new Error("RESEND_API_KEY missing");
  const recipients=Array.isArray(to)?to:[to];
  const payload:Record<string,unknown>={from:"Voidworks <no-reply@voidworks.eu>",to:recipients,subject,html};
  if(options?.replyTo) payload.reply_to=options.replyTo;
  const response=await fetch(RESEND_ENDPOINT,{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"});
  if(!response.ok){const info=await response.text().catch(()=>"");throw new Error(`Email delivery failed ${response.status} ${info.slice(0,180)}`);}
  return response.json().catch(()=>({}));
}

export async function sendVerificationCode(to:string,name:string,code:string,locale:Locale="nl"){
  const c=locale==="en"?{title:"Verify your email",hello:`Hi ${escapeHtml(name||"")}, use the six-digit code below to verify your Voidworks account.`,foot:"This code expires in 15 minutes and works once.",subject:"Your Voidworks verification code"}:locale==="de"?{title:"E-Mail bestätigen",hello:`Hallo ${escapeHtml(name||"")}, nutze den sechsstelligen Code, um dein Voidworks-Konto zu bestätigen.`,foot:"Der Code läuft nach 15 Minuten ab und funktioniert einmal.",subject:"Dein Voidworks Bestätigungscode"}:{title:"Bevestig je e-mail",hello:`Hoi ${escapeHtml(name||"")}, gebruik de zescijferige code hieronder om je Voidworks-account te bevestigen.`,foot:"Deze code verloopt na 15 minuten en werkt één keer.",subject:"Je Voidworks verificatiecode"};
  const html=shell(c.title,`<p style="margin:0 0 18px;color:#b0b0ba;font-size:16px;line-height:1.7">${c.hello}</p><div style="margin:22px 0;padding:22px;border:1px solid #3c2a70;border-radius:13px;background:#0a0713;text-align:center;color:#fff;font-size:38px;font-weight:900;letter-spacing:.26em">${escapeHtml(code)}</div><p style="margin:0;color:#85858f;font-size:14px;line-height:1.7">${c.foot}</p>`,locale);
  await sendEmail(to,c.subject,html);
}

export async function sendAccountSecurityCode(to:string, code:string, locale:Locale, actionLabel:string){
  const t=portalCopy[locale];
  const body=`<p style="margin:0 0 18px;color:#b0b0ba;font-size:16px;line-height:1.7">${escapeHtml(actionLabel)}</p><div style="margin:22px 0;padding:22px;border:1px solid #3c2a70;border-radius:13px;background:#0a0713;text-align:center;color:#fff;font-size:38px;font-weight:900;letter-spacing:.26em">${escapeHtml(code)}</div><p style="margin:0;color:#85858f;font-size:14px;line-height:1.7">${escapeHtml(locale==="nl"?"Deze code verloopt na 15 minuten en werkt één keer.":locale==="de"?"Dieser Code läuft nach 15 Minuten ab und funktioniert einmal.":"This code expires after 15 minutes and works once.")}</p>`;
  await sendEmail(to,t.mail.codeSubject,shell(t.mail.codeSubject,body,locale));
}

function detailRow(label:string,value:string){return `<tr><td style="padding:9px 0;color:#85858f;font-size:13px;vertical-align:top;width:170px">${escapeHtml(label)}</td><td style="padding:9px 0;color:#f3f3f6;font-size:14px;line-height:1.6">${escapeHtml(value)}</td></tr>`;}

export type ProjectEmailData={id:string;request_code:string;requester_name:string;requester_email:string;company_name:string;company_description:string;package_name:string;site_type:string;site_requirements:string;style_reference:string|null;addon_names:string[];one_time_total:number;monthly_total:number;locale:Locale};

export async function sendProjectRequestEmails(project:ProjectEmailData){
  const t=portalCopy[project.locale];
  const replyTo=projectReplyAddress(project.id);
  const rows=[
    detailRow(t.request.company,project.company_name),
    detailRow(t.request.companyDoes,project.company_description),
    detailRow(t.request.package,project.package_name),
    detailRow(t.request.siteType,project.site_type),
    detailRow(t.request.requirements,project.site_requirements),
    detailRow(t.request.style,project.style_reference||"—"),
    detailRow(t.request.addons,project.addon_names.length?project.addon_names.join(", "):t.request.none),
    detailRow(t.request.price,`€${project.one_time_total}${project.monthly_total?` + €${project.monthly_total}/mnd`:""}`),
  ].join("");
  const clientBody=`<p style="margin:0 0 18px;color:#b0b0ba;font-size:16px;line-height:1.7">${escapeHtml(project.requester_name)}, ${escapeHtml(t.request.successText)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #202027;border-bottom:1px solid #202027;margin:22px 0">${rows}</table><p style="margin:0"><a href="https://voidworks.eu/dashboard" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#7240ff;color:#fff;text-decoration:none;font-size:14px;font-weight:800">${escapeHtml(t.request.dashboard)}</a></p>`;
  const adminBody=`<p style="margin:0 0 18px;color:#b0b0ba;font-size:16px;line-height:1.7">Nieuwe aanvraag van ${escapeHtml(project.requester_name)} (${escapeHtml(project.requester_email)}).</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #202027;border-bottom:1px solid #202027;margin:22px 0">${rows}</table><p style="margin:0"><a href="https://voidworks.eu/admin/projects/${project.id}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#7240ff;color:#fff;text-decoration:none;font-size:14px;font-weight:800">Open in admin</a></p>`;
  const [clientResult,adminResult]=await Promise.allSettled([
    sendEmail(project.requester_email,t.mail.projectSubject,shell(t.mail.projectSubject,clientBody,project.locale),{replyTo}),
    sendEmail(ADMIN_EMAIL,`${t.mail.adminSubject} · ${project.company_name}`,shell(t.mail.adminSubject,adminBody,"nl"),{replyTo:replyTo||project.requester_email}),
  ]);
  return {clientSent:clientResult.status==="fulfilled",adminSent:adminResult.status==="fulfilled"};
}

export async function sendProjectMessageEmail(args:{to:string;projectId:string;companyName:string;body:string;locale:Locale;senderName:string;adminNotification?:boolean}){
  const t=portalCopy[args.locale];
  const replyTo=projectReplyAddress(args.projectId);
  const content=`<p style="margin:0 0 16px;color:#85858f;font-size:13px">${escapeHtml(args.senderName)}</p><div style="padding:18px;border:1px solid #24242c;border-radius:12px;background:#09090b;color:#f3f3f6;font-size:15px;line-height:1.75;white-space:pre-wrap">${escapeHtml(args.body)}</div><p style="margin:20px 0 0"><a href="https://voidworks.eu/${args.adminNotification?`admin/projects/${args.projectId}`:`dashboard/projects/${args.projectId}`}" style="display:inline-block;padding:12px 18px;border-radius:9px;background:#7240ff;color:#fff;text-decoration:none;font-size:14px;font-weight:800">${escapeHtml(args.adminNotification?"Open in admin":t.projects.open)}</a></p>`;
  await sendEmail(args.to,`${t.mail.replySubject} · ${args.companyName}`,shell(t.mail.replySubject,content,args.locale),{replyTo});
}
