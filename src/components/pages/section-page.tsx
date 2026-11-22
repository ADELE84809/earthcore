import Link from "next/link";
import { SectionLabel, Panel, SourceNote, MeasurementTypeBadge } from "@/components/ui/primitives";

export function PageShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children?: React.ReactNode }) {
  return <main className="mx-auto min-h-[80vh] max-w-[1440px] px-5 pb-24 pt-32 sm:px-8 lg:px-12">
    <SectionLabel>{eyebrow}</SectionLabel>
    <h1 className="display mt-4 max-w-4xl text-[clamp(2.4rem,6vw,5rem)] leading-[0.98] text-text">{title}</h1>
    <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{intro}</p>
    {children && <div className="mt-12">{children}</div>}
  </main>;
}

export function QuietPanel({ title, children }: { title: string; children: React.ReactNode }) {
 return <Panel className="p-6 sm:p-8"><h2 className="display text-2xl text-text">{title}</h2><div className="mt-4 text-sm leading-6 text-muted">{children}</div></Panel>
}

export function TypeNote({ type, source, href }: {type:string;source:string;href?:string}) {
 return <div className="mt-4 flex flex-wrap items-center gap-3"><MeasurementTypeBadge type={type as never}/><SourceNote attribution={source}/></div>
}

export function PageLinks() {
 return <div className="mt-8 flex flex-wrap gap-3"><Link href="/explore" className="btn btn-primary h-11 px-5">Open Mission Control</Link><Link href="/sources" className="btn h-11 px-5">Review sources</Link></div>
}
