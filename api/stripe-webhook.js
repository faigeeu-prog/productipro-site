// Envoie automatiquement le guide par mail juste après un paiement Stripe.
//
// À CONFIGURER UNE SEULE FOIS :
//
// 1. Dans Stripe > Développeurs > Webhooks, ajoute un endpoint :
//      URL      : https://www.productipro.fr/api/stripe-webhook
//      Événements : checkout.session.completed
//                   checkout.session.async_payment_succeeded (paiements différés)
//    Stripe te donne alors un « Signing secret » (commence par whsec_).
//
// 2. Dans Vercel > Settings > Environment Variables :
//      STRIPE_WEBHOOK_SECRET  le signing secret du webhook (whsec_...)
//      RESEND_API_KEY         ta clé Resend (déjà utilisée par /api/lead)
//      GUIDE_FROM             (facultatif) l'expéditeur, sur un domaine vérifié dans Resend
//                             par défaut : Productipro <contact@productipro.fr>
//
// Les clés restent chez Vercel : elles ne sont jamais dans le dépôt.
// Le guide en PDF est dans api/_assets/ : il est joint au mail et n'est pas
// accessible publiquement sur le site.

import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PDF_PATH = path.join(process.cwd(), 'api', '_assets', 'guide-video-fond-noir.pdf');
const PDF_NAME = 'Guide-Video-Fond-Noir-Claude-ElevenLabs.pdf';
const TOLERANCE_S = 300; // Stripe recommande 5 minutes
// Le compte Stripe vend aussi d'autres produits : on n'envoie le guide
// que pour les achats faits via CE lien de paiement.
const GUIDE_PAYMENT_LINK = process.env.GUIDE_PAYMENT_LINK || 'plink_1Ubq4pRzVntgFBrQgCJ27VDj';

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(typeof c === 'string' ? Buffer.from(c) : c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Vérifie que la requête vient bien de Stripe (signature HMAC SHA-256).
function verifyStripeSignature(raw, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k, v])
  );
  const t = Number(parts.t);
  const sigs = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${t}.${raw.toString('utf8')}`).digest('hex');
  const exp = Buffer.from(expected, 'hex');
  return sigs.some((s) => {
    const got = Buffer.from(s, 'hex');
    return got.length === exp.length && crypto.timingSafeEqual(got, exp);
  });
}

const esc = (s) => String(s || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const KEY = process.env.RESEND_API_KEY;
  const FROM = process.env.GUIDE_FROM || 'Productipro <contact@productipro.fr>';

  if (!SECRET || !KEY) {
    console.error('[stripe-webhook] variables manquantes : STRIPE_WEBHOOK_SECRET et/ou RESEND_API_KEY');
    // 500 : Stripe réessaiera automatiquement une fois les variables posées.
    return res.status(500).json({ error: 'not_configured' });
  }

  const raw = await readRawBody(req);
  if (!verifyStripeSignature(raw, req.headers['stripe-signature'], SECRET)) {
    return res.status(400).json({ error: 'bad_signature' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return res.status(400).json({ error: 'bad_json' }); }

  // On ne traite que les paiements terminés et réglés ; le reste est ignoré.
  const OK_TYPES = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];
  if (!OK_TYPES.includes(event.type)) return res.status(200).json({ ignored: event.type });
  const session = event.data && event.data.object;
  if (!session || session.payment_link !== GUIDE_PAYMENT_LINK) return res.status(200).json({ ignored: 'other_product' });
  if (session.payment_status !== 'paid') return res.status(200).json({ ignored: 'not_paid' });

  const email = session.customer_details && session.customer_details.email;
  const name = (session.customer_details && session.customer_details.name) || '';
  const prenom = esc(name.split(' ')[0]);
  if (!email) {
    console.error('[stripe-webhook] pas d’email dans la session', session.id);
    return res.status(200).json({ ignored: 'no_email' });
  }

  let pdf;
  try { pdf = (await readFile(PDF_PATH)).toString('base64'); }
  catch (err) {
    console.error('[stripe-webhook] PDF introuvable', err);
    return res.status(500).json({ error: 'pdf_missing' });
  }

  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#111318;max-width:560px">
<p>Salut${prenom ? ' ' + prenom : ''},</p>
<p>Merci pour ton achat ! Ton guide <strong>« Recrée une vidéo fond noir avec Claude + ElevenLabs »</strong> est en pièce jointe de ce mail (PDF).</p>
<p><strong>Pour démarrer :</strong></p>
<ol>
<li>Connecte ElevenLabs à Claude (page 1 du guide, 2 minutes).</li>
<li>Glisse ta vidéo de référence dans une nouvelle conversation Claude.</li>
<li>Colle le prompt du guide et remplis les champs entre crochets.</li>
</ol>
<p>Une question ? Réponds simplement à ce mail.</p>
<p>À très vite,<br>Productipro</p>
</div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        // Une seule commande = un seul mail, même si Stripe renvoie l'événement.
        'Idempotency-Key': `guide-${session.id}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: 'contact@productipro.fr',
        subject: 'Ton guide « Vidéo fond noir avec Claude » est là',
        html,
        attachments: [{ filename: PDF_NAME, content: pdf }],
      }),
    });

    if (!r.ok) {
      console.error('[stripe-webhook] Resend a refusé :', r.status, await r.text());
      return res.status(500).json({ error: 'email_failed' }); // Stripe réessaiera
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[stripe-webhook] échec de l’envoi :', err);
    return res.status(500).json({ error: 'email_failed' });
  }
}
