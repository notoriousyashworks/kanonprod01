/**
 * apply_perfume_name_fixes.js
 * ─────────────────────────────────────────────────────────────
 * Applies HIGH-confidence perfume name corrections to the Kicksaura
 * production database. For each product:
 *   1. GET full product data (admin endpoint)
 *   2. Change ONLY the name field
 *   3. PUT the full payload back
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

// ── JWT ────────────────────────────────────────────────────────
function generateToken() {
    const crypto = require('crypto');
    const secretBase64 = process.env.JWT_SECRET;
    if (!secretBase64) throw new Error('JWT_SECRET is missing from .env');
    const secretBytes = Buffer.from(secretBase64, 'base64');
    const b64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64')
        .replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    const h = b64Url({ alg:'HS256', typ:'JWT' });
    const p = b64Url({ sub:'admin-importer-script', role:'ROLE_ADMIN',
        iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000)+3600*24 });
    const sig = require('crypto').createHmac('sha256', secretBytes).update(h+'.'+p)
        .digest('base64').replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
    return h+'.'+p+'.'+sig;
}

// ── CORRECTIONS MAP (HIGH confidence only) ─────────────────────
// Format: 'product-id (prefix)': 'Corrected Name'
const CORRECTIONS = {
  "5542eddc-dc24-48ac-8567-0fa195cb8e2e": "Giorgio armani Code A List EDT 110ML",
  "a76ce93b-97d0-482c-a997-7e59dfd18007": "Premium Sauvage Dior EDT 100ML",
  "eb9570e1-47ff-4a7c-9c60-da1c4be2e69f": "Premium Louis Vuitton Ombre Nomade EDP 100ML",
  "e749ae24-6b22-43b0-bc14-27b407a5559b": "Louis Vuitton LV California Dream 100ML",
  "87557940-ea2d-45c5-9ffe-68d825fc5194": "Versace Pour Homme Eau De 100ML",
  "0e3f0062-cee4-4dee-9839-bf5339e99240": "Lv Louis Vuitton Ombre Nomade EDP 100ML",
  "388ecc3f-aab5-4e6a-81a0-5ecb9c138ed8": "Bleu De Chanel EDP 100ML",
  "aa5579a2-cba7-4396-8df8-30668ba8d078": "Ck Calvin Klein Ck 1EAU DE TOILETTE WHITE 100ML",
  "358e7b72-953c-4a84-ad81-e2e671b11887": "Dolce & Gabbana THE ONE EAU DE PARFUME 75ML",
  "1c6327e7-a144-4942-8d0f-2b4c102fd758": "Bleu De Chanel Paris EDT 100ML",
  "25dea9aa-f4ee-49ee-a90c-489eed8b1c10": "Creed Silver Mountain Water (White) 120ML",
  "69509259-2225-4ecc-9c9a-b77951f423f0": "Giorgio armani Stronger With You Oud EDP 100ML",
  "f4be5d4a-ae6e-41d7-938d-e985539fd87b": "Tom Ford Ebene Fume EDP 100ML",
  "44cf8656-89d9-4adb-be4f-7ec70799b6ac": "Mont blanc Legend Black 100ML",
  "d4ca4be2-77d4-480e-b69e-586b572a8778": "Dolce & Gabbana the one royal night exclusive edition 100ml",
  "4ceae97d-89a7-465e-b4ac-5d237262ceec": "Louis Vuitton Lv Pur Oud 100ML",
  "1b26d7ce-deed-4ff2-997a-bfc79e12639d": "Valentino Uomo Born In Roma Intense EDP 100ML",
  "da952eb5-e908-4410-a360-29259aa8c351": "Jean Paul Gaultier JPG Classique Collector Edition 125ML",
  "aa547f70-6967-433b-aa61-c038b803e19f": "Giorgio armani ACQUA di gio edp 125ML",
  "320570c7-038a-4945-9b5a-f87055df7f38": "Hugo Boss Just Different EDT 150ML",
  "0fb33388-52e9-444c-8c12-3f4959618162": "Hugo Boss Oud Saffron Eau de Parfum 100ML",
  "748bb17e-78a2-480a-bc80-922125c44164": "Jean Paul Gaultier Scandal Absolu",
  "6dfbdf93-279c-45cb-a6ab-d723f37b9024": "Christian Dior bois dargent for unisex 100ml",
  "2b91f9b7-7573-414d-8f98-ae470cfebc18": "Tom Ford Tuscan Leather EDP 100ML",
  "409cbcaf-5e23-45e4-bed4-abeaf608256e": "Tom Ford Fabulous EDP 100ML",
  "a4f69545-d647-44b0-b3d2-539803d50a58": "Dolce & Gabbana Intenso Pour Homme EDP 125ML",
  "3ebf046e-2abf-49fc-8556-85e66d843928": "Giorgio armani Acqua di gio absolu 100ml",
  "cb95ddfd-fca5-49d1-9c85-22657fe17f27": "Prada Paradigme Eau de Parfum 100ML",
  "bb86f44f-1366-4813-a0c0-24f19d2f849c": "Hugo Boss Bottled Absolu 100ML",
  "c41bc7e8-a649-4df3-a9dc-deab97557a61": "Giorgio armani code black parfum 100ML",
  "8241ddca-ff5c-4703-a5d4-053b0438a83a": "Dolce & Gabbana Devotion Pour Homme EDP 100ML",
  "caf7f477-b551-4244-b304-3dd6b39e87dd": "Giorgio armani Acqua Di Gio Profondo EDP 125ML",
  "fad0283d-a713-41cf-83dd-9bd332516c31": "Tom Ford Oud Wood EDP 100ML",
  "0bcfcfce-615a-4aef-9ff2-116074729d30": "Tom Ford Noir Extreme EDP 100ML",
  "75794f7c-22a0-427a-a46c-42718208815c": "Dior Fahrenheit EDP 100ML",
  "7258cb35-6038-4e07-a094-4224e3ff278d": "Gucci Pour Homme EDT 90ML",
  "c3a6db75-0b5e-4b8d-9313-787c4f6f819e": "Dolce & Gabbana Lightblue EDT 100ML",
  "0f2c96ab-61f5-4082-ac0e-cdbd1166be18": "Valentino Uomo Born in Roma Rockstud Noir EDT 100ML",
  "960fc057-6204-4efb-9a9f-1b8a6cb4963a": "Valentino Uomo Born In Roma Ivory EDT 100ML",
  "5ead76cb-eb86-4d2d-87c6-bc7af3189abc": "Louis Vuitton Pacific Chill EDP 100ML",
  "665f3469-74ff-4cc8-9551-9e863140600e": "Versace Eros Flame Red EDP 100ML",
  "2108dc4c-6b50-4560-a14f-8e1b87b595e1": "Hugo Boss Bottled Bold Citrus 100ML",
  "c4c39be9-69ec-4ad6-87cc-e74e49f72cb5": "Louis Vuitton LV Lovers EDP 100ML",
  "3ffea584-e698-45bd-8316-8d7f85584f4a": "Giorgio armani CODE EDP BLACK 125ML",
  "130dd62c-6a31-4cb2-8e2d-3ffaffb1d3f6": "Hugo Boss The Scent EDT 100ML",
  "02c703a8-858e-47f0-824d-3e0c080659f9": "Louis Vuitton LV City Of Stars 100ML",
  "cfb9c67f-9acc-4d74-bb31-1ef78b3dadab": "Polo Ralp Lauren Red Parfum 100ML",
  "1db150bc-5aed-4450-b54c-b77af2e4d504": "Bleu de Chanel parfum 100ML",
  "13cba344-6989-4452-88c8-745191a2502f": "Giorgio armani Stronger with You 100ML",
  "33519133-bca0-46a8-a14d-ee9bd570f674": "Giorgio armani Stronger With You Absolutely Pour Homme 100ML",
  "13c12732-6566-4418-bad9-f242773e7f32": "Tom Ford Neroli Portofino EDP 100ML",
  "ca828cb9-a73f-46fa-beab-a57d399c2937": "Dolce & Gabbana Fruit Collection Orange 120ML",
  "222ef1fc-d775-4f26-9f57-5c3c6a552516": "Giorgio armani Stronger With You Parfum 100ML",
  "8993b9ca-ec7c-4218-8aad-bb01330c286a": "Gucci By Gucci Sport Pour Homme EDT 90ML",
  "ee78b72e-ed46-443d-9d7c-850fdb4c23f1": "Dolce & Gabbana Light Blue D&G Capri In Love Pour Homme EDP 100ML",
  "162e76b5-1e57-43e3-bde1-16dae210c275": "Giorgio armani CODE BROWN EDP 125ML",
  "cb625f90-881b-4a47-9b18-7408c517e49d": "Tom Ford Fucking Fabulous 100ml",
  "0922bbca-0fc0-40a6-8134-011af1b44362": "Hugo Boss Reversed EDT 125ML",
  "54cee304-4766-4826-880d-244a90e9045c": "Creed Green Irish Tweed (Black) 120ML",
  "e424b948-059f-4f2f-8b18-8b52343cbd91": "Dior Sauvage eau de parfum 100ML",
  "0c0181b9-8898-4562-8acb-8659712934b7": "Hugo Boss bottled night 100ml",
  "8d276dcd-d86f-4d46-a1cd-8e9b6858b074": "Giorgio armani Code A List EDT 110ML",
  "d7f43750-5ae8-4eae-b96c-45245f64ad77": "Hugo Boss Sport 100ML",
  "58cc0e83-9b38-405b-af3f-11e303c812ca": "Louis Vuitton LV Les sable Roses EDP 100ML",
  "65418b37-6a33-422f-8d85-5c151c52aea4": "Hugo Boss Bottled Tonic EDT 100ML",
  "8749a8d9-33df-4214-94c3-f16d6b2950c6": "Dolce & Gabbana Light Blue Summer Vibes EDT 125ML",
  "1c21ecfc-175d-4df6-ba63-fe2f4cd424f8": "Tom Ford Grey Vetiver Parfum 100ML",
  "3a5d72c9-c6c4-4431-83de-22415b811282": "Burberry hero EDT 100ML",
  "19c5b4fd-6547-49a7-9598-a2e3620f66ac": "Burberry Hero EDP 100ML",
  "97225892-e4e8-4b8c-b9ec-11cc0bf035e3": "Giorgio armani GIO ACQUA DI WHITE 100ML",
  "733f5b70-fde7-4873-9263-9783b7394900": "Calvin Klein In 2 U 100ML",
  "f69da8a8-852b-4933-83b3-bf625db6faf6": "Dior sauvage Elixir 60ML",
  "becce51b-1b1a-4936-bf0a-a9b8b199a220": "Giorgio armani Stronger With You Intensely 100ML",
  "dbbcdf0c-d9fc-45f7-9363-d9adf5cc7c4e": "Valentino Uomo Coral Fantasy EDT 100ML",
  "46f284c3-36c6-41d9-9782-991fe1645973": "Gucci GUILTY LOVE EDITION EAU DE TOILETTE 90ML",
  "457f0c62-3d3f-49fd-a212-34d3f820dc0f": "BLEU DE Chanel EDP PARFUM POUR HOMME 100ml no.24",
  "46f43f2a-9056-4261-8e78-30fbb929b840": "Dolce & Gabbana The One EDP Intense 100ML",
  "0271d393-59a6-4768-bc2a-bc335b86a004": "Dolce & Gabbana the one eau de 100ml",
  "28d0296a-9db1-4de0-bea8-3d21a9191c71": "Calvin Klein Be EDT 100ML",
  "70537250-9eea-4f08-8e0b-84e2d1ece575": "Armani CODE POUR HOMME EDP 100ml no.09",
  "39c3e0de-bec4-467a-8f90-defb8d4cb604": "ACQUA DI GIO Armani PARFUM EDP 100ml no.22",
  "a6320aa3-34a5-4b8f-a42b-83bc1f6ebb2f": "Tom Ford OMBRE LEATHER EDP 100ml No.25",
  "f4ca04d1-b7a3-4167-b6a1-83685bc188dc": "Prada MILANO PARADIGME EDP 100ml no.18",
  "b71b4191-3c8b-405e-b60b-74a15991829f": "Hugo Boss BOTTLED ABSOLU EDP 100ml No.14",
  "6f1796bf-ab81-4d76-8e5c-b6d498763399": "Tom Ford TOBACCO VANILLE 100ml no.02",
  "c529465a-4ea0-425d-8d63-4f920d4c8a2d": "CK ONE Calvin Klein EDP 100ml no. 07",
  "63b98a2a-17b4-4a11-b734-b7251a9e9499": "Calvin Klein CK BE BLACK EDP 100ml no. 07",
  "6e350ecc-e305-408d-ab6a-fd90cb2166e0": "ACQUA DI GIO Armani I EDP 100ml no.16",
  "ab5b2e80-5668-4689-a643-02eb46be11fa": "Gucci GUILTY POUR HOMME EDP 100ml no.12",
  "1137ea2e-64cb-458f-8cb7-3865f343da2d": "Hugo Boss Man of today edition 100ml",
  "ccf3d50a-1f8b-4ad7-ab61-95d0afc99b55": "Azzaro The Most Wanted EDT Intense 100ML",
  "6e822387-5e98-4e73-af08-81c8824c82ac": "Tom Ford OUD WOOD EDP 100ml no.04",
  "6a04af55-9cba-4320-9355-62ae83e9c5f4": "Dolce & Gabbana King Blue Eau De Parfum 100ML",
  "7c6685d4-6743-48bf-aa53-96b8fb331df0": "TERRE D Hermes EDT 100ml no.02",
  "1863d091-cf70-41fc-9dcc-6129e0e5ac96": "Hugo Boss REVERSED EDP 100ml no.25",
  "d0119e5e-b347-4655-b15f-ebc55fe6e888": "Hugo Boss BOTTLED TONIC EDP 100ml no.27",
  "6a625e39-d1c9-4724-8041-4a9e10e5956a": "Hugo Boss BOTTLED BOLD CITRUS EDP 100ml no.26",
  "b9e2c276-7e27-440b-894c-3ca7b51d0148": "Hugo Boss S BOTTLED OUD EDP 100ml no.13",
  "7bcae2ee-fc4a-4fbe-846d-dd6a132ffc7e": "ACQUA DI GIO Armani ABSOLU EDP 100ml no.11",
  "f7c9980a-2e65-4188-bbcd-e3f5e0ad486a": "Chanel COCO NOIR EDP 100ml no. 19",
  "c3019960-f5d2-4d47-aeb8-2618627afa54": "Elie Saab ROYAL PARFUM EDP 100ml no.21",
  "2264636a-3c34-47ae-aaba-dff29ccc4a57": "Hugo Boss S OUD AROMATIC EDP 100ml no.22",
  "43f05043-3922-434d-8fea-ba37c8ab1d84": "PREMIUM SAUVAGE Dior ELIXIR 100ML",
  "9a45b232-6232-42fb-908f-45641b91f134": "Gucci BY Gucci EDP 100ml no.13",
  "f9eb2717-4bfe-4308-b6c9-262f10367c64": "BLEU DE Chanel L EXCLUSIF EDP 100ml no.5",
  "a3cfa988-bfb9-4c14-9ae6-9e1f84c24d4d": "Tom Ford Noir Eau De Parfum 100ML",
  "9ef191e6-11e1-43e6-bfe1-1e00a30e27f6": "Chanel Allure Homme Sport Cologne 100ML",
  "447f02ed-10f8-4beb-9b4a-4004f8a7bbf2": "Hugo Boss BOTTLED NIGHT EDP 100ml no.29",
  "15a8f9d7-e014-41b2-ba33-ff7f69c591a8": "Tom Ford EBNE FUME EDP 100ml no.05"
};

// ── HELPERS ────────────────────────────────────────────────────
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getProduct(token, id) {
  const resp = await fetch(`${API_URL}/api/v1/admin/products/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    signal: AbortSignal.timeout(20000)
  });
  if (!resp.ok) throw new Error(`GET ${id} failed: HTTP ${resp.status}`);
  return resp.json();
}

async function updateProductName(token, id, newName, product) {
  // Generate updated search keywords using the new name
  const lowerName = newName.toLowerCase();
  let updatedSearchText = product.searchText || '';
  if (!updatedSearchText.toLowerCase().includes(lowerName)) {
    updatedSearchText = updatedSearchText ? `${updatedSearchText} ${lowerName}` : lowerName;
  }

  // Build request from response — change name and searchText
  const payload = {
    name:            newName,
    originalName:    product.originalName || product.name,
    searchName:      product.searchName   || '',
    brand:           product.brand        || '',
    searchBrand:     product.searchBrand  || '',
    searchText:      updatedSearchText,
    category:        product.category     || 'Perfumes',
    description:     product.description  || '',
    basePrice:       product.basePrice,
    discountedPrice: product.discountedPrice,
    imageUrls:       product.imageUrls    || [],
    videoUrls:       product.videoUrls    || [],
    isVisible:       product.isVisible,
    isSaleVisible:   product.isSaleVisible,
    isNewArrival:    product.isNewArrival,
    isTrending:      product.isTrending,
    isVideoVisible:  product.isVideoVisible,
    withOgBox:       product.withOgBox,
    isInStockFlag:   product.isInStockFlag,
    limitedStock:    product.limitedStock,
    variants:        product.variants     || [],
    sourceSite:      product.sourceSite   || '',
    sourceProductId: product.sourceProductId || '',
  };

  const resp = await fetch(`${API_URL}/api/v1/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`PUT ${id} failed: HTTP ${resp.status} — ${txt}`);
  }
  return resp.json();
}

// ── MAIN ───────────────────────────────────────────────────────
(async () => {
  const token = generateToken();
  const ids = Object.keys(CORRECTIONS);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PERFUME NAME AUDIT — Applying ${ids.length} corrections`);
  console.log(`${'='.repeat(60)}\n`);

  if (ids.length === 0) {
    console.log('No corrections to apply. Please populate the CORRECTIONS map.');
    return;
  }

  let success = 0, failed = 0, skipped = 0;
  const failedList = [];
  const log = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const newName = CORRECTIONS[id];
    process.stdout.write(`[${i+1}/${ids.length}] ${id.slice(0,8)}… → "${newName}" … `);

    try {
      const product = await getProduct(token, id);
      const oldName = product.name;

      if (oldName === newName) {
        process.stdout.write('SKIP (already correct)\n');
        skipped++;
        log.push({ id, oldName, newName, status: 'SKIPPED' });
        continue;
      }

      await updateProductName(token, id, newName, product);
      process.stdout.write('✅ OK\n');
      success++;
      log.push({ id, oldName, newName, status: 'UPDATED' });
    } catch (err) {
      process.stdout.write(`❌ FAILED: ${err.message}\n`);
      failed++;
      failedList.push({ id, newName, error: err.message });
      log.push({ id, newName, status: 'FAILED', error: err.message });
    }

    await sleep(200); // rate-limit gently
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DONE');
  console.log(`${'='.repeat(60)}`);
  console.log(`Updated:  ${success}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Failed:   ${failed}`);

  if (failedList.length > 0) {
    console.log('\nFailed products:');
    failedList.forEach(f => console.log(`  • ${f.id}: ${f.error}`));
  }

  // Write full log
  require('fs').writeFileSync('/tmp/perfume_update_log.json', JSON.stringify(log, null, 2));
  console.log('\nFull log saved to /tmp/perfume_update_log.json');
})();
