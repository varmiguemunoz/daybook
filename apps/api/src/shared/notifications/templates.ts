export function emailTemplate(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1D1C1A">
    <h2 style="margin:0 0 12px">${title}</h2>
    <div style="line-height:1.5">${body}</div>
    <hr style="border:none;border-top:1px solid #E5E2DB;margin:24px 0">
    <p style="font-size:12px;color:#8A867E">Gr8r Studio</p>
  </body></html>`;
}
