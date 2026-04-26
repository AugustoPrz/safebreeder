// HPG sampling reminder email — pure renderer (no IO).
// Mirrors the brand styling used in supabase/email_templates/confirm_signup.html.

interface ReminderParams {
  lotName: string;
  estName: string;
  /** ISO date `YYYY-MM-DD` of the previous sampling. */
  sampleDate: string;
  /** Absolute URL to the HPG tab for this lot. */
  lotUrl: string;
}

interface RenderedEmail {
  subject: string;
  html: string;
  /** Plain-text fallback for clients that strip HTML. */
  text: string;
}

const monthsEs = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return `${d} ${monthsEs[m - 1]} ${y}`;
}

export function renderHpgReminder(p: ReminderParams): RenderedEmail {
  const sampleDateFmt = formatDateEs(p.sampleDate);
  const subject = `Es hora de muestrear HPG — ${p.lotName}`;

  const text =
    `Recordatorio Safebreeder\n\n` +
    `El lote ${p.lotName} en ${p.estName} fue muestreado hace 27 días (${sampleDateFmt}).\n` +
    `Te quedan 3 días antes de cumplir el ciclo de 30.\n\n` +
    `Programá la próxima toma y cargá los resultados:\n${p.lotUrl}\n\n` +
    `— Safebreeder`;

  const html = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(subject)}</title>
    <style>
      body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
      body { margin:0 !important; padding:0 !important; background:#fafaf7; }
      a { color:#4d7c2a; text-decoration:none; }
      @media only screen and (max-width:600px) {
        .container { width:100% !important; padding-left:16px !important; padding-right:16px !important; }
        .card { padding:32px 24px !important; }
        .h1 { font-size:24px !important; line-height:1.2 !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#fafaf7; font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif; color:#1f2518;">
    <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
      Faltan 3 días para volver a muestrear ${escapeHtml(p.lotName)}.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafaf7;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px; max-width:560px;">

            <tr>
              <td align="center" style="padding:8px 0 28px 0;">
                <div style="font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-weight:900; font-size:18px; letter-spacing:3px; color:#4d7c2a; text-transform:uppercase;">
                  Safebreeder
                </div>
              </td>
            </tr>

            <tr>
              <td class="card" style="background:#ffffff; border:1px solid #e3e6dc; border-radius:16px; padding:40px 36px; box-shadow:0 1px 2px rgba(31,37,24,0.05);">
                <h1 class="h1" style="margin:0 0 12px 0; font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:26px; line-height:1.18; font-weight:700; letter-spacing:-0.015em; color:#1f2518;">
                  Es hora de muestrear HPG
                </h1>
                <p style="margin:0 0 18px 0; font-size:15px; line-height:1.55; color:#1f2518;">
                  El lote <strong>${escapeHtml(p.lotName)}</strong> en <strong>${escapeHtml(p.estName)}</strong> fue muestreado hace 27 días (${escapeHtml(sampleDateFmt)}).
                  Te quedan <strong>3 días</strong> antes de cumplir el ciclo de 30.
                </p>
                <p style="margin:0 0 28px 0; font-size:15px; line-height:1.55; color:#6b6f5d;">
                  Programá la próxima toma y cargá los resultados.
                </p>

                <!-- Bulletproof CTA button -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" bgcolor="#4d7c2a" style="border-radius:999px;">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeAttr(p.lotUrl)}" style="height:48px; v-text-anchor:middle; width:230px;" arcsize="50%" strokecolor="#4d7c2a" fillcolor="#4d7c2a">
                        <w:anchorlock/>
                        <center style="color:#ffffff; font-family:Arial,sans-serif; font-size:15px; font-weight:600;">Cargar nueva muestra</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="${escapeAttr(p.lotUrl)}" target="_blank"
                         style="display:inline-block; background:#4d7c2a; color:#ffffff !important; font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:600; line-height:1; padding:16px 32px; border-radius:999px; text-decoration:none; letter-spacing:0.01em;">
                        Cargar nueva muestra
                      </a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

                <hr style="border:0; border-top:1px solid #e3e6dc; margin:32px 0 20px 0;" />

                <p style="margin:0; font-size:12px; line-height:1.5; color:#6b6f5d;">
                  Si no querés más estos recordatorios, contestá este mail y lo desactivamos.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:24px 8px 8px 8px;">
                <p style="margin:0; font-size:12px; line-height:1.5; color:#6b6f5d;">
                  Safebreeder · Gestión sanitaria y productiva del ganado
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;").replace(/&/g, "&amp;");
}
