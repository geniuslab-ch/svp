import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getConversation } from "@/lib/services/deals";
import { AppError } from "@/lib/errors";
import { formatMoney, timeAgo } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Composer, OfferForm, OfferResponse } from "./conversation-client";
import { ReportDialog } from "@/components/venture/detail-client";

export const metadata = { title: "Conversation" };

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  let c;
  try {
    c = await getConversation(user, id);
  } catch (e) {
    if (e instanceof AppError) notFound();
    throw e;
  }
  const counterpart = c.role === "BUYER" ? c.founderName : c.buyer.alias;
  return (
    <div className="container-x grid max-w-6xl gap-8 py-8 lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-[70vh] flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/70 pb-4">
          <div>
            <Link href="/messages" className="text-[13px] text-ivory-400 hover:text-ivory">← All messages</Link>
            <h1 className="mt-1 text-xl font-medium">{c.venture.alias} <span className="font-normal text-ivory-400">with {counterpart}</span></h1>
          </div>
          <Link href={`/ventures/${c.venture.slug}`} className="link text-sm">View listing</Link>
        </div>
        <ol className="flex-1 space-y-4 py-6" aria-label="Messages">
          {c.messages.map((m) =>
            m.kind === "SYSTEM" ? (
              <li key={m.id} className="text-center text-[12.5px] text-ivory-500">— {m.body} · {timeAgo(m.createdAt)} —</li>
            ) : (
              <li key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px]", m.kind === "OFFER" ? "border border-amber/40 bg-amber/5" : m.mine ? "bg-ink-750" : "border border-ink-700 bg-ink-900")}>
                  {m.kind === "OFFER" && <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-amber">Non-binding offer</div>}
                  <p className="whitespace-pre-line text-ivory-100">{m.body}</p>
                  <div className="mt-1 text-[11.5px] text-ivory-500">{m.from} · {timeAgo(m.createdAt)}</div>
                </div>
              </li>
            ),
          )}
        </ol>
        {c.closed ? <p className="text-sm text-ivory-400">This conversation is closed.</p> : <Composer conversationId={c.id} />}
        <div className="mt-3 flex justify-between text-[12px] text-ivory-500">
          <span>Messages are stored as a record of this discussion. Do not share passwords or payment details.</span>
          <ReportDialog targetType="USER" targetId={c.role === "BUYER" ? c.venture.founderId : c.buyerId} signedIn />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface p-5">
          <div className="eyebrow mb-3">{c.role === "FOUNDER" ? "Buyer" : "Founder"}</div>
          <div className="font-medium">{counterpart}</div>
          {c.role === "FOUNDER" ? (
            <>
              <div className="mt-2">{c.buyer.verification === "VERIFIED" ? <Badge tone="lime">Proof of funds reviewed</Badge> : <Badge tone="outline">Email-verified</Badge>}</div>
              <dl className="mt-3 space-y-2 text-[13px]">
                {c.buyer.disclosed.map((d) => (
                  <div key={d.label}><dt className="text-ivory-500">{d.label}</dt><dd className="text-ivory-200">{d.value}</dd></div>
                ))}
              </dl>
              <p className="mt-3 text-[12px] text-ivory-500">The buyer’s legal identity and email are not shared.</p>
            </>
          ) : (
            c.founderRole && <div className="text-[13px] text-ivory-400">{c.founderRole}</div>
          )}
        </div>

        <div className="surface p-5">
          <div className="eyebrow mb-3">Offers</div>
          {c.offers.length === 0 && <p className="text-sm text-ivory-400">No offers yet.</p>}
          <ul className="space-y-3">
            {c.offers.map((o) => (
              <li key={o.id} className="rounded-xl border border-ink-700 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{o.type === "INDICATIVE_OFFER" ? "Indicative offer" : "Expression of interest"}</span>
                  <Badge tone={o.status === "OPEN" ? "amber" : o.status === "ACKNOWLEDGED" ? "sage" : "outline"}>{o.status.toLowerCase()}</Badge>
                </div>
                {o.amount != null && <div className="num mt-1 text-lg">{formatMoney(o.amount, o.currency, false)}</div>}
                <p className="mt-1 text-[13px] text-ivory-300">{o.structure}</p>
                <div className="mt-1 text-[11.5px] text-ivory-500">Non-binding · {timeAgo(o.createdAt)}</div>
                {o.status === "OPEN" && <OfferResponse offerId={o.id} conversationId={c.id} role={c.role} />}
              </li>
            ))}
          </ul>
          {c.role === "BUYER" && !c.closed && <OfferForm conversationId={c.id} />}
          <p className="mt-4 text-[11.5px] leading-relaxed text-ivory-500">
            Offers made here are non-binding indications. Expression of interest → indicative offer → binding offer → signed agreement: only the last two create obligations, and they happen outside this platform with professional advice.
          </p>
        </div>
      </aside>
    </div>
  );
}
