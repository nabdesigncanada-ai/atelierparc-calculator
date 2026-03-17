const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// CONFIG — Les clés sont lues depuis les
// variables d'environnement Render (sécurisé)
// Ne jamais mettre les clés directement ici !
// ============================================
const CONFIG = {
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET: process.env.SHOPIFY_API_SECRET,
  SHOP: 'atelierparc.myshopify.com',
  SCOPES: 'write_script_tags,read_script_tags',
  REDIRECT_URI: 'https://atelierparc-calculator.onrender.com/auth/callback',
  HOST: 'https://atelierparc-calculator.onrender.com'
};

// ============================================
// ÉTAPE 1 — Page d'installation
// ============================================
app.get('/install', (req, res) => {
  const shop = req.query.shop || CONFIG.SHOP;
  const state = crypto.randomBytes(16).toString('hex');
  const installUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${CONFIG.API_KEY}` +
    `&scope=${CONFIG.SCOPES}` +
    `&state=${state}` +
    `&redirect_uri=${CONFIG.REDIRECT_URI}`;
  res.redirect(installUrl);
});

// ============================================
// ÉTAPE 2 — Callback OAuth
// ============================================
app.get('/auth/callback', async (req, res) => {
  const { code, shop } = req.query;
  try {
    // Échanger le code pour un access token
    const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: CONFIG.API_KEY,
      client_secret: CONFIG.API_SECRET,
      code
    });
    const accessToken = tokenRes.data.access_token;

    // Installer le Script Tag sur la boutique
    await axios.post(
      `https://${shop}/admin/api/2024-01/script_tags.json`,
      {
        script_tag: {
          event: 'onload',
          src: `${CONFIG.HOST}/calculator.js`
        }
      },
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    );

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>✅ AtelierParc Calculator installé!</h2>
        <p>Le calculateur de prix est maintenant actif sur votre boutique.</p>
        <p>Visitez votre page produit pour le voir en action.</p>
        <a href="https://${shop}/admin" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Retour à Shopify</a>
      </body></html>
    `);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur installation: ' + err.message);
  }
});

// ============================================
// ÉTAPE 3 — Servir le calculateur JS
// ============================================
app.get('/calculator.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(CALCULATOR_JS);
});

// ============================================
// Page d'accueil
// ============================================
app.get('/', (req, res) => {
  res.send(`
    <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2>AtelierParc Calculator App</h2>
      <p>Pour installer sur votre boutique :</p>
      <a href="/install" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Installer sur atelierparc.shop</a>
    </body></html>
  `);
});

// ============================================
// LE CALCULATEUR — Code JS injecté sur le site
// ============================================
const CALCULATOR_JS = `
(function() {
  // Seulement sur les pages produit
if (!window.location.pathname.includes('/products/')) return;

// Vérifier le tag 'Price Calculator' via Shopify
var hasPriceCalcTag = false;
try {
  if (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product) {
    var tags = window.ShopifyAnalytics.meta.product.tags || [];
    hasPriceCalcTag = tags.includes('Price Calculator');
  }
} catch(e) {}
if (window.location.pathname.includes('/products/') && !hasPriceCalcTag) return;
  var T = {
    en: {
      title:'Price Calculator', banner:'Free shipping · No customs · Canada & United States',
      lbl_dim:'DIMENSIONS', lbl_w:'Width (inches)', lbl_h:'Height (inches)',
      lbl_fin:'WOOD FINISH', lbl_holes:'MOUNTING SCREW HOLES',
      lbl_qty:'Quantity', lbl_dest:'DESTINATION',
      dest_ca:'Canada — Free · No customs', dest_us:'United States — Free · No customs', dest_in:'International — Chit Chats / PostNL',
      lbl_unit:'Unit price', lbl_ship:'Shipping', lbl_tot:'Total',
      lbl_surf:'Surface', lbl_wt:'Est. weight', lbl_disc:'Qty discount', lbl_hv:'Screw holes',
      lbl_sum:'Shipping & customs', s_ca:'Free · No customs', s_us:'Free · No customs',
      s_us_l:'United States', s_in_l:'International',
      intl_note:'Via Chit Chats + PostNL · 5–22 business days',
      footer:'Prices in USD · Rate ~0.73 CAD/USD · Free shipping CA & US',
      none:'None', free:'FREE',
      tag1:'Very competitive vs TG Woodworking', tag2:'Well positioned — cherry premium', tag3:'Premium segment — superior quality',
      fbase:'Base', fsub:'Sanded to 180 grit\\nReady to paint or stain',
      h_none:'No holes', h_n:'holes', btn:'Request a Quote'
    },
    fr: {
      title:'Calculateur de prix', banner:'Livraison gratuite · Aucune douane · Canada & États-Unis',
      lbl_dim:'DIMENSIONS', lbl_w:'Largeur (pouces)', lbl_h:'Hauteur (pouces)',
      lbl_fin:'FINITION BOIS', lbl_holes:'TROUS POUR VIS',
      lbl_qty:'Quantité', lbl_dest:'DESTINATION',
      dest_ca:'Canada — Gratuit · Sans douane', dest_us:'États-Unis — Gratuit · Sans douane', dest_in:'International — Chit Chats / PostNL',
      lbl_unit:'Prix unitaire', lbl_ship:'Livraison', lbl_tot:'Total',
      lbl_surf:'Surface', lbl_wt:'Poids est.', lbl_disc:'Rabais qté', lbl_hv:'Trous pour vis',
      lbl_sum:'Livraison & douanes', s_ca:'Gratuit · Sans douane', s_us:'Gratuit · Sans douane',
      s_us_l:'États-Unis', s_in_l:'International',
      intl_note:'Via Chit Chats + PostNL · 5–22 jours ouvrables',
      footer:'Prix USD · Taux ~0.73 CAD/USD · Livraison gratuite CA & US',
      none:'Aucun', free:'GRATUIT',
      tag1:'Très compétitif vs TG Woodworking', tag2:'Bien positionné — cherry premium', tag3:'Segment premium — qualité supérieure',
      fbase:'Base', fsub:'Poncé à 180 grit\\nPrêt à peindre ou teindre',
      h_none:'Sans trous', h_n:'trous', btn:'Demander un devis'
    }
  };

  var FINS = [
    {id:'unfinished',en:'Unfinished',fr:'Non finie',sub:true,mult:1.00,color:'#B4B2A9',dark:false},
    {id:'primer',en:'Primer White',fr:'Apprêt blanc',sub:false,mult:1.10,color:'#F1EFE8',dark:false},
    {id:'gloss',en:'Gloss White',fr:'Blanc lustré',sub:false,mult:1.15,color:'#ffffff',dark:false},
    {id:'walnut',en:'Dark Walnut',fr:'Noyer foncé',sub:false,mult:1.15,color:'#3B2314',dark:true},
    {id:'mahogany',en:'Rich Mahogany',fr:'Acajou riche',sub:false,mult:1.15,color:'#6B2D1A',dark:true},
    {id:'awalnut',en:'American Walnut',fr:'Noyer américain',sub:false,mult:1.15,color:'#8B5C3E',dark:true},
    {id:'oak',en:'Spanish Oak',fr:'Chêne espagnol',sub:false,mult:1.15,color:'#C49A5A',dark:false},
    {id:'pickling',en:'Pickling White',fr:'Blanc décapé',sub:false,mult:1.12,color:'#E8E4D8',dark:false}
  ];

  var lang = document.documentElement.lang && document.documentElement.lang.startsWith('fr') ? 'fr' : 'en';
  var selFin = 'unfinished', selHoles = 0;

  function r5(n){return Math.round(n/5)*5;}
  function wlbs(a){return Math.round(((a/144)*1.5+0.5)*10)/10;}
  function iship(a){var l=wlbs(a),c=l<0.5?8.5:l<1?10.5:l<2?13:l<3?16:l<5?20:l<8?27:35;return Math.round(c*0.73);}
  function st(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}

  // Injecter le HTML
  var container = document.createElement('div');
  container.id = 'ap-calc-wrap';
  container.style.cssText = 'max-width:600px;margin:40px auto;padding:20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;border-top:1px solid #e5e7eb;padding-top:40px;';
  container.innerHTML = \`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
      <div>
        <div id="ap-title" style="font-size:18px;font-weight:600;color:#1a1a1a;">Price Calculator</div>
        <div style="font-size:13px;color:#6b7280;margin-top:3px;">Cherry veneer premium · Handmade in Montréal</div>
      </div>
      <div style="display:flex;gap:4px;">
        <button onclick="apLang('en')" id="ap-btn-en" style="padding:4px 12px;font-size:12px;font-weight:500;border-radius:20px;border:1px solid #9ca3af;cursor:pointer;background:#f3f4f6;color:#374151;">EN</button>
        <button onclick="apLang('fr')" id="ap-btn-fr" style="padding:4px 12px;font-size:12px;font-weight:500;border-radius:20px;border:1px solid #e5e7eb;cursor:pointer;background:#fff;color:#374151;">FR</button>
      </div>
    </div>
    <div style="background:#f0fdf4;border-radius:8px;padding:10px 14px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#16a34a;flex-shrink:0;"></div>
      <div id="ap-banner" style="font-size:13px;color:#15803d;font-weight:500;">Free shipping · No customs fees · Canada & United States</div>
    </div>
    <div id="ap-lbl-dim" style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:0.07em;margin:0 0 8px;">DIMENSIONS</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
      <div><label id="ap-lbl-w" style="font-size:13px;color:#6b7280;display:block;margin-bottom:5px;">Width (inches)</label>
        <input type="number" id="ap-wi" value="12" min="4" max="48" step="0.25" oninput="apCalc()" style="width:100%;padding:9px 12px;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#1a1a1a;box-sizing:border-box;"></div>
      <div><label id="ap-lbl-h" style="font-size:13px;color:#6b7280;display:block;margin-bottom:5px;">Height (inches)</label>
        <input type="number" id="ap-hi" value="12" min="4" max="48" step="0.25" oninput="apCalc()" style="width:100%;padding:9px 12px;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#1a1a1a;box-sizing:border-box;"></div>
    </div>
    <div id="ap-lbl-fin" style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:0.07em;margin:0 0 8px;">WOOD FINISH</div>
    <div id="ap-fins" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;"></div>
    <div id="ap-lbl-holes" style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:0.07em;margin:0 0 8px;">MOUNTING SCREW HOLES</div>
    <div id="ap-holes" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:20px;"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <label id="ap-lbl-qty" style="font-size:13px;color:#6b7280;white-space:nowrap;">Quantity</label>
      <input type="range" id="ap-qi" min="1" max="20" value="1" step="1" oninput="apCalc()" style="flex:1;">
      <span id="ap-qo" style="font-size:14px;font-weight:600;min-width:24px;color:#1a1a1a;">1</span>
    </div>
    <div id="ap-lbl-dest" style="font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:0.07em;margin:0 0 8px;">DESTINATION</div>
    <select id="ap-de" onchange="apCalc()" style="width:100%;padding:9px 12px;font-size:14px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#1a1a1a;margin-bottom:20px;box-sizing:border-box;">
      <option value="ca">Canada — Free · No customs</option>
      <option value="us" selected>United States — Free · No customs</option>
      <option value="in">International — Chit Chats / PostNL</option>
    </select>
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:12px;">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        <div><div id="ap-lbl-unit" style="font-size:12px;color:#9ca3af;margin-bottom:3px;">Unit price</div><div id="ap-ru" style="font-size:22px;font-weight:600;color:#1a1a1a;">—</div></div>
        <div><div id="ap-lbl-ship" style="font-size:12px;color:#9ca3af;margin-bottom:3px;">Shipping</div><div id="ap-rs" style="font-size:22px;font-weight:600;color:#1a1a1a;">—</div></div>
        <div><div id="ap-lbl-tot" style="font-size:12px;color:#9ca3af;margin-bottom:3px;">Total</div><div id="ap-rt" style="font-size:22px;font-weight:600;color:#6366f1;">—</div></div>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div><div id="ap-lbl-surf" style="font-size:11px;color:#9ca3af;">Surface</div><div id="ap-rsu" style="font-size:13px;font-weight:500;color:#1a1a1a;">—</div></div>
        <div><div id="ap-lbl-wt" style="font-size:11px;color:#9ca3af;">Est. weight</div><div id="ap-rwt" style="font-size:13px;font-weight:500;color:#1a1a1a;">—</div></div>
        <div><div id="ap-lbl-disc" style="font-size:11px;color:#9ca3af;">Qty discount</div><div id="ap-rdi" style="font-size:13px;font-weight:500;color:#1a1a1a;">—</div></div>
        <div><div id="ap-lbl-hv" style="font-size:11px;color:#9ca3af;">Screw holes</div><div id="ap-rho" style="font-size:13px;font-weight:500;color:#1a1a1a;">—</div></div>
      </div>
    </div>
    <div id="ap-tag" style="margin-bottom:10px;"></div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:20px;">
      <div id="ap-lbl-sum" style="font-size:12px;color:#9ca3af;margin-bottom:8px;">Shipping & customs</div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;">Canada</span><span id="ap-s-ca" style="font-weight:500;color:#15803d;">Free · No customs</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;border-bottom:1px solid #f3f4f6;"><span id="ap-s-us-l" style="color:#6b7280;">United States</span><span id="ap-s-us" style="font-weight:500;color:#15803d;">Free · No customs</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;"><span id="ap-s-in-l" style="color:#6b7280;">International</span><span id="ap-s-in" style="font-weight:500;color:#1a1a1a;">—</span></div>
      <div id="ap-intl-note" style="font-size:11px;color:#9ca3af;margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6;">Via Chit Chats + PostNL · 5–22 business days</div>
    </div>
    <a id="ap-contact-btn" href="/pages/contact" style="display:block;width:100%;padding:14px;font-size:15px;font-weight:600;background:#1a1a1a;color:#fff;border-radius:8px;text-align:center;text-decoration:none;box-sizing:border-box;margin-bottom:8px;">
      Request a Quote — <span id="ap-btn-price">—</span>
    </a>
    <p id="ap-footer" style="font-size:12px;color:#9ca3af;text-align:center;margin:0;">Prices in USD · Rate ~0.73 CAD/USD · Free shipping CA & US</p>
  \`;

  // Insérer après le bouton Add to Cart
  var addToCart = document.querySelector('[name="add"], .product-form__submit, #AddToCart');
  if (addToCart && addToCart.parentNode) {
    addToCart.parentNode.insertAdjacentElement('afterend', container);
  } else {
    var main = document.querySelector('main, #MainContent, .main-content');
    if (main) main.appendChild(container);
  }

  function buildFins() {
    var s = T[lang], el = document.getElementById('ap-fins');
    if (!el) return;
    el.innerHTML = '';
    FINS.forEach(function(f) {
      var sel = f.id === selFin, tc = f.dark ? '#E8E4D8' : '#2C2C2A';
      var btn = document.createElement('button');
      btn.style.cssText = 'cursor:pointer;border-radius:8px;border:' + (sel ? '2px solid #6366f1' : '1px solid #e5e7eb') + ';padding:10px 12px;text-align:left;background:' + f.color + ';width:100%;';
      var label = lang === 'fr' ? f.fr : f.en;
      var sub = f.sub ? s.fsub : '';
      var pct = f.mult === 1 ? s.fbase : '+' + Math.round((f.mult-1)*100) + '%';
      btn.innerHTML = '<div style="font-size:13px;font-weight:500;color:'+tc+';">'+label+'</div>'+(sub?'<div style="font-size:11px;color:'+tc+';opacity:0.75;margin-top:2px;white-space:pre-line;">'+sub+'</div>':'')+'<div style="font-size:11px;color:'+tc+';opacity:0.8;margin-top:4px;">'+pct+'</div>';
      btn.onclick = function() { selFin = f.id; buildFins(); apCalc(); };
      el.appendChild(btn);
    });
  }

  function buildHoles() {
    var s = T[lang], el = document.getElementById('ap-holes');
    if (!el) return;
    el.innerHTML = '';
    [0,2,4,6,8].forEach(function(n) {
      var sel = n === selHoles, label = n === 0 ? s.h_none : n + ' ' + s.h_n;
      var btn = document.createElement('button');
      btn.style.cssText = 'cursor:pointer;border-radius:8px;border:'+(sel?'2px solid #6366f1':'1px solid #e5e7eb')+';padding:10px 6px;text-align:center;background:'+(sel?'#f5f3ff':'#fff')+';width:100%;';
      var dots = '';
      if (n > 0) { dots = '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:3px;margin-bottom:4px;">'; for(var i=0;i<n;i++) dots += '<div style="width:6px;height:6px;border-radius:50%;background:'+(sel?'#6366f1':'#9ca3af')+';" ></div>'; dots += '</div>'; }
      btn.innerHTML = dots + '<div style="font-size:12px;font-weight:500;color:#1a1a1a;">'+label+'</div><div style="font-size:11px;color:#6b7280;margin-top:2px;">Free</div>';
      btn.onclick = function() { selHoles = n; buildHoles(); apCalc(); };
      el.appendChild(btn);
    });
  }

  window.apLang = function(l) {
    lang = l;
    var s = T[l];
    document.getElementById('ap-btn-en').style.background = l==='en'?'#f3f4f6':'#fff';
    document.getElementById('ap-btn-fr').style.background = l==='fr'?'#f3f4f6':'#fff';
    st('ap-title',s.title); st('ap-banner',s.banner);
    st('ap-lbl-dim',s.lbl_dim); st('ap-lbl-w',s.lbl_w); st('ap-lbl-h',s.lbl_h);
    st('ap-lbl-fin',s.lbl_fin); st('ap-lbl-holes',s.lbl_holes);
    st('ap-lbl-qty',s.lbl_qty); st('ap-lbl-dest',s.lbl_dest);
    st('ap-lbl-unit',s.lbl_unit); st('ap-lbl-ship',s.lbl_ship); st('ap-lbl-tot',s.lbl_tot);
    st('ap-lbl-surf',s.lbl_surf); st('ap-lbl-wt',s.lbl_wt); st('ap-lbl-disc',s.lbl_disc);
    st('ap-lbl-hv',s.lbl_hv); st('ap-lbl-sum',s.lbl_sum);
    st('ap-s-ca',s.s_ca); st('ap-s-us',s.s_us); st('ap-s-us-l',s.s_us_l); st('ap-s-in-l',s.s_in_l);
    st('ap-intl-note',s.intl_note); st('ap-footer',s.footer);
    var de = document.getElementById('ap-de');
    if (de) { de.options[0].text=s.dest_ca; de.options[1].text=s.dest_us; de.options[2].text=s.dest_in; }
    buildFins(); buildHoles(); apCalc();
  };

  window.apCalc = function() {
    var s = T[lang];
    var w = parseFloat(document.getElementById('ap-wi').value)||0;
    var h = parseFloat(document.getElementById('ap-hi').value)||0;
    var q = parseInt(document.getElementById('ap-qi').value)||1;
    var d = document.getElementById('ap-de').value;
    st('ap-qo', q);
    if (!w||!h) return;
    var f = FINS.find(function(x){return x.id===selFin;})||FINS[0];
    var a = w*h, mo = 30*(a<=200?1:a<=500?1.5:2);
    var cout = (a*45/900)+(a/144*2.88)+mo;
    var cad = r5(cout*1.20), usd = r5(cad*0.73), u = r5(r5(usd*1.20)*f.mult);
    var dr=0, dl=s.none;
    if(q>=10){dr=0.15;dl='-15%';}else if(q>=5){dr=0.10;dl='-10%';}else if(q>=3){dr=0.05;dl='-5%';}
    var unit = Math.round(u*(1-dr)), ship = (d==='ca'||d==='us')?0:iship(a), tot = unit*q+ship;
    var hl = selHoles===0?s.h_none:selHoles+' '+s.h_n;
    var finLabel = lang==='fr'?f.fr:f.en;
    st('ap-ru',unit+' USD'); st('ap-rs',ship===0?s.free:ship+' USD'); st('ap-rt',tot+' USD');
    st('ap-rsu',Math.round(a)+' in²'); st('ap-rwt',wlbs(a)+' lbs'); st('ap-rdi',dl); st('ap-rho',hl);
    st('ap-s-in',iship(a)+' USD');
    var tg = document.getElementById('ap-tag');
    if(tg){
      if(unit<60) tg.innerHTML='<span style="background:#f0fdf4;color:#15803d;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;">'+s.tag1+'</span>';
      else if(unit<130) tg.innerHTML='<span style="background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;">'+s.tag2+'</span>';
      else tg.innerHTML='<span style="background:#fffbeb;color:#92400e;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;">'+s.tag3+'</span>';
    }
    var bp = document.getElementById('ap-btn-price'); if(bp) bp.textContent = tot+' USD';
    var href = '/pages/contact?width='+w+'&height='+h+'&finish='+encodeURIComponent(finLabel)+'&holes='+selHoles+'&qty='+q+'&total='+tot;
    var cb = document.getElementById('ap-contact-btn'); if(cb) cb.href = href;
    window._apq = {w:w,h:h,a:a,unit:unit,ship:ship,tot:tot,qty:q,finish:finLabel,holes:hl};
  };

  buildFins(); buildHoles(); apCalc();
})();
`;

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('AtelierParc Calculator App running on port ' + PORT));
