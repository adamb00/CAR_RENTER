export type EmailRow = { label: string; value: string };

type EmailTemplateOptions = {
  title: string;
  intro: string;
  rows?: EmailRow[];
  cta?: { label: string; href: string };
  footerNote?: string;
  securityNote?: string;
};

export function renderBrandEmail({
  title,
  intro,
  rows = [],
  cta,
  footerNote,
  securityNote,
}: EmailTemplateOptions): string {
  const brandNavy = '#023047';
  const brandAmber = '#fb8500';
  const brandAmberLight = '#ffc933';
  const brandSky = '#8ecae6';

  const rowsHtml =
    rows.length > 0
      ? rows
          .map(
            (row) => `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e6e7e9; background: #f7f8fa; font-weight: 600; color: ${brandNavy}; width: 38%;">${row.label}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e6e7e9; background: #ffffff; color: #1f2937;">${row.value}</td>
            </tr>
          `
          )
          .join('')
      : '';

  return `
  <div style="margin:0;padding:0;background:#f2f4f7;color:#0f172a;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:28px 18px;">
      <div style="border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);background:#ffffff;border:1px solid #e5e7eb;">
        <div style="padding:20px 22px;background:linear-gradient(135deg, ${brandSky} 0%, ${brandAmberLight} 100%);color:#fff;">
          <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">Zodiacs Rent a Car</div>
          <h1 style="margin:6px 0 4px;font-size:22px;font-weight:700;">${title}</h1>
          <p style="margin:0;font-size:14px;opacity:0.95;">${intro}</p>
        </div>

        <div style="padding:22px 22px 10px;">
          ${
            rowsHtml
              ? `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:4px 0 12px;">${rowsHtml}</table>`
              : ''
          }
          ${
            cta
              ? `<div style="margin:18px 0 12px;">
                  <a href="${cta.href}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:linear-gradient(135deg, ${brandAmberLight} 0%, ${brandSky} 100%);color:#fff;font-weight:700;text-decoration:none;">${cta.label}</a>
                </div>`
              : ''
          }
          ${
            footerNote
              ? `<p style="margin:12px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${footerNote}</p>`
              : ''
          }
        </div>
      </div>
      ${
        securityNote
          ? `<p style="margin:14px 4px 0;font-size:12px;color:#6b7280;text-align:center;">${securityNote}</p>`
          : ''
      }
    </div>
  </div>
  `;
}
