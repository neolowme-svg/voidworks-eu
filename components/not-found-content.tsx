"use client";
import Link from "next/link";
import {usePreferences} from "@/components/preferences-provider";
export function NotFoundContent(){const{locale}=usePreferences();const c=locale==="en"?{tag:"404",title:"This page does not exist.",text:"Return to the homepage.",button:"Home"}:locale==="de"?{tag:"404",title:"Diese Seite existiert nicht.",text:"Zurück zur Startseite.",button:"Startseite"}:{tag:"404",title:"Deze pagina bestaat niet.",text:"Ga terug naar de homepage.",button:"Homepage"};return <main className="page error-page"><section className="section"><div className="container"><div className="error-card"><span className="eyebrow">{c.tag}</span><h1>{c.title}</h1><p>{c.text}</p><Link className="button button-primary" href="/">{c.button}</Link></div></div></section></main>}
