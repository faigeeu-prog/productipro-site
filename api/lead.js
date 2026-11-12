// Reçoit le formulaire placé devant la vidéo et t'envoie l'inscription par mail.
//
// À CONFIGURER UNE SEULE FOIS, dans Vercel > Settings > Environment Variables :
//   RESEND_API_KEY   ta clé Resend (commence par re_)
//   LEAD_TO          l'adresse qui reçoit les inscriptions
//   LEAD_FROM        l'expéditeur, sur un domaine vérifié dans Resend
//                    ex. Vizion LAB <contact@productipro.fr>
//
// La clé reste chez Vercel : elle n'est jamais dans le dépôt.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { prenom = '', nom = '', email = '' } = req.body || {};
  const clean = (s) => String(s).trim().slice(0, 120);
  const p = clean(prenom), n = clean(nom), e = clean(email).toLowerCase();

  if (!p || !n || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
    return res.status(400).json({ error: 'invalid_fields' });
  }

  const KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_TO;
  const FROM = process.env.LEAD_FROM;

  // Tant que les variables ne sont pas posées, on laisse passer le visiteur
  // plutôt que de lui bloquer la vidéo, et on trace dans les logs Vercel.
  if (!KEY || !TO || !FROM) {
    console.warn('[lead] variables manquantes — inscription non envoyée :', { p, n, e });
    return res.status(200).json({ ok: true, stored: false });
  }

  const esc = (s) => s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  const when = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: e,
        subject: `Nouvelle inscription — ${esc(p)} ${esc(n)}`,
        html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6">
<p><strong>${esc(p)} ${esc(n)}</strong> vient de lancer la vidéo.</p>
<p>Email : <a href="mailto:${esc(e)}">${esc(e)}</a><br>Date : ${when}</p>
</div>`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('[lead] Resend a refusé :', r.status, detail);
      // On ne punit pas le visiteur pour une panne de notre côté.
      return res.status(200).json({ ok: true, stored: false });
    }

    return res.status(200).json({ ok: true, stored: true });
  } catch (err) {
    console.error('[lead] échec de l’envoi :', err);
    return res.status(200).json({ ok: true, stored: false });
  }
}
