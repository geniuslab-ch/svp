# Security & privacy implementation notes

## Controls in place

| Area | Implementation |
| --- | --- |
| Passwords | bcrypt cost 12; min 10 chars with a letter and a number; constant-time path for unknown emails |
| Sessions | 32-byte random token in an httpOnly, SameSite=Lax, `Secure`, `__Host-` cookie; only its SHA-256 is stored; 14-day expiry; all sessions revoked on password reset and suspension |
| Email & reset tokens | Single-use, hashed, 24 h / 1 h expiry. Email confirmation needs an explicit POST so link scanners can't consume it. Reset requests don't reveal whether an account exists |
| Authorization | Pure policy in `src/lib/authz.ts`, called by every service. Public list queries use `TEASER_SELECT`, so confidential columns are never loaded. Unauthorized access returns 404, so existence isn't leaked |
| Roles | FOUNDER / BUYER chosen at sign-up; ADMIN only via `npm run make-admin` (CLI). Admins can't suspend themselves or other admins |
| Documents | Private storage, random object keys. Every download goes through `/api/documents/[id]`, which checks permission, writes an audit entry, then streams the file or redirects to a 60-second signed URL. Responses are `no-store`, with a sandbox CSP |
| Uploads | MIME allow-list, magic-byte sniffing, 10 MB cap, sanitized names, max 5 files per verification and 40 per venture |
| Rate limits | Postgres-backed fixed windows: login (per IP and per email), sign-up, reset, access requests, messages, offers, reports, verification, swipes, downloads, export |
| CSRF | Server actions check Origin (Next.js built-in); cookies are SameSite=Lax; GET routes have no side effects except view tracking |
| Headers | CSP (`frame-ancestors 'none'`, no third-party origins), HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP |
| Audit | Registration, verification submit/decision/document view, access request/decision, document download/denial, offers, moderation, suspensions, export, deletion |
| Privacy | Buyers are shown as alias plus opted-in fields. Emails are never in public payloads. Pipeline notes are buyer-only. Data export (JSON) and account deletion are self-service. Only one strictly necessary cookie, no analytics |

## Remaining risks / to-do before public launch

1. **CSP allows `'unsafe-inline'` scripts**, which Next.js bootstrap needs. Move to nonce-based CSP via middleware.
2. **No malware scanning** of uploads. Add a scanning step (e.g. ClamAV worker) before files become downloadable.
3. **Manual verification only.** Reviewer error is possible. Consider an eID/KYC provider and four-eyes review for L4.
4. **Rate limits use a fixed window** in Postgres. Adequate for the MVP; add edge protection (Cloudflare/Render) against volumetric abuse.
5. **No 2FA.** Add TOTP/WebAuthn, at least for admins and founders with data rooms.
6. **Signed URLs** are valid for 60 s once issued, so a buyer could share one within that window. Watermarking documents per viewer would deter leaks.
7. **Audit log retention** and access policy still need to be defined. Logs are not yet exported to immutable storage.
8. **Deleted accounts** keep their sent messages, attributed to "Deleted account". Confirm this with counsel against retention duties.
9. **Supabase service-role key** grants full storage access. Keep it only in Render env vars and rotate on staff changes.

## Legal questions requiring professional review

- **Marketplace vs. brokerage.** Does matching, featuring, or any success-fee model constitute licensable brokerage or financial intermediation (Swiss FinSA/FinIA; EU member-state rules)?
- **Financial promotion.** Could listings of companies or share deals be considered offers of securities or require a prospectus or exemption?
- **AML.** Would any future transaction, escrow or payment role trigger duties under the Swiss AMLA or EU AMLD (KYC of buyers, SROs)?
- **Data protection.**
  - FADP/GDPR: records of processing, DPIA for identity documents, processor agreements (Render, Supabase, Resend), cross-border transfer mechanisms, retention schedule.
  - FDPIC/EU representative requirements.
- **Confidentiality undertaking.** Enforceability of a click-through NDA; governing law and jurisdiction.
- **Electronic signatures.** Required before any binding offer or agreement workflow (ZertES / eIDAS).
- **Marketplace liability.** Notice-and-action process, disclaimers about listing accuracy, consumer-law applicability.
