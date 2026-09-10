/**
 * apply_watch_name_fixes.js
 * ─────────────────────────────────────────────────────────────
 * Applies HIGH-confidence watch name corrections to the Kicksaura
 * production database. For each product:
 *   1. GET full product data (admin endpoint)
 *   2. Change ONLY the name field
 *   3. PUT the full payload back
 *
 * MEDIUM/LOW confidence items are skipped (flagged in report).
 * Placeholder products ("dont") are skipped.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_URL = 'https://pure-grace-production-6c99.up.railway.app';

// ── JWT ────────────────────────────────────────────────────────
function generateToken() {
    const crypto = require('crypto');
    const secretBytes = Buffer.from(process.env.JWT_SECRET, 'base64');
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
  // ── CASIO ──────────────────────────────────────────────────────
  'ba718cf3-c127-43e0-b150-be7f86c49754': 'Casio Edifice EFR-540D',
  'c5db5495-f77f-45c7-a6c0-0fa4db2ecae9': 'Casio Edifice EFR-540D',
  '07f5fa3f-0409-49e4-b4f3-1864684fd70f': 'Casio Edifice EFR-540D',
  'a4b046b8-e32f-4ffe-a0e9-2ef84523f49c': 'Casio Edifice EFR-540D',
  '878bfa3c-06e3-4cf1-9415-753467a3df0f': 'Casio G-Shock GM-2100 Silver Black',
  'ec42d558-69c6-4ccf-ac24-1acba91f28d0': 'Casio G-Shock GM-2100 Full Black',
  '6ba9a628-477d-4abc-ae2a-f33c8bdca999': 'Casio G-Shock GM-2100 Black Gold',
  'b601ea52-bf54-41f8-95d7-f67adc65d1b4': 'Casio G-Shock GM-2100 Black Sky Blue',
  '210c1e02-f851-4351-ae1b-ac4afd3b3ddb': 'Casio G-Shock GA-2100 HDS',
  'eca497b3-09d1-4ea3-9c18-bbea2a5df700': 'Casio G-Shock GBD-200SM',
  'e5b22ea8-3c3d-4189-aac1-6386e2939ca6': 'Casio Illuminator AE-1200WHD',
  'd47d2c00-940e-4ec2-bd41-f5b3ccc01de3': 'Casio Edifice ED-639',
  '967de732-a28a-429e-b831-6c4e8f80f055': 'Casio G-Shock G-Steel GM-110D',
  '8d82c286-080e-470f-ba59-dc6291fc17fc': 'Casio Edifice ECB-2000 Japan',
  '12252b29-c153-4243-a92d-f6ac54a6a81b': 'Casio G-Shock MRG',
  '1930b019-daeb-48a4-959f-c91a34ee03d6': 'Casio G-Shock MRG',
  '8bd04449-4216-4b7d-b2fc-642d62b0249c': 'Casio G-Shock GM-2100',
  '7e1e927f-3b79-4e9c-ade2-d3822e95391b': 'Casio G-Shock GA-B0001',
  'a36b0769-be5a-4e4e-b168-d9010e1cd668': 'Casio G-Shock GA-B0001',
  'ad0d7d37-65c8-4f20-bdbc-1b26c82406c2': 'Casio G-Shock G-Steel GST-B100',
  '27d26ade-cce0-4f95-8520-c94092447e7a': 'Casio G-Shock GA-110 Green',
  '4c0687e4-3770-407a-9360-f4078a8855e5': 'Casio G-Shock GA-110',
  // G-Shock without brand prefix
  '1c2258f7-8e01-4fa0-8aba-65d5bbccc573': 'Casio G-Shock GA-2100',
  '675cded5-0647-46fe-818e-25713cba7152': 'Casio G-Shock GA-2100 Metal',
  'e4fafb79-a3a6-4d68-bb00-ea0454dec585': 'Casio G-Shock GA-2100',
  'eb39fa1a-e7e2-4e47-82ec-eed60b2d120e': 'Casio G-Shock GA-2100',
  '3ac07ff5-b580-4c27-8152-064f5bd1e54c': 'Casio G-Shock GA-2100',
  'f4158c13-4cce-403a-b3be-306facdca964': 'Casio G-Shock GA-2100',
  '6445b19e-b396-4853-802a-3afbb17f9067': 'Casio G-Shock GA-2100 Metal',
  '946c28f6-fbcf-4541-8068-d2f87885ee13': 'Casio G-Shock GA-2100',
  '7b040c1d-8563-467e-b63a-092e432b1b95': 'Casio G-Shock GA-2100',
  'e5da7f18-df7d-49ae-be03-4c0b54068254': 'Casio G-Shock GA-2100 Metal',
  '14fe1ee9-f00d-492a-a5f9-039c96e98adb': 'Casio G-Shock GM-110',
  'd6412572-3250-49ed-84bf-4918aeae9415': 'Casio Edifice ECB-2000PB',
  'ff3649d3-0c32-4df0-b330-5cf79af8202c': 'Casio Edifice ECB-10P',
  '7309a5d9-ffcb-4eea-a352-f57b0a4ee6c7': 'Casio G-Shock GMC-B2100D',
  '74d6d1bc-dd6b-468f-b2e1-e339aa9fd778': 'Casio G-Shock GA-2100 Ice',
  '76cd8f54-6409-421f-bbdd-753664d202a9': 'Casio G-Shock GA-2300 Black',
  'f2f4b4e6-2151-4b5b-9c26-e97f3a263c97': 'Casio G-Shock GM-2100 Black Gold',
  'f41be832-110c-45ce-aab0-c4672183c44b': 'Casio G-Shock GM-2100 Black Sky Blue',
  'a9a952a9-11c4-4d21-9fec-c8327b46bd26': 'Casio G-Shock GA-2100 All Working',
  '60c9a3e1-b15c-4783-9647-e35a060796c3': 'Casio Edifice EFR-303D Silver White Dial',
  // ── SEIKO ──────────────────────────────────────────────────────
  'ead54fc9-531b-4cc8-888f-dfcb6b2d7c37': 'Seiko King Vana Automatic Brown White',
  '489b9484-d618-4930-b45b-fdb4285d22c9': 'Seiko King Vana Automatic Full Blue',
  'd4f24037-ceaa-4da1-a94e-b53206d1d683': 'Seiko King Vanac Automatic Black Brown',
  '1154f8df-ef93-425b-b97e-c6cc07a49caa': 'Seiko King Vanac Automatic Black Green',
  'dc8c9a26-46f6-4499-9b5c-f79521f44dbd': 'Seiko Oyster Perpetual GMT Master',
  '854cbbe4-598d-49f6-8730-69ef1730da1a': 'Seiko Oyster Perpetual GMT Master',
  'c70f9a97-1286-4e41-a86a-ca1851f8cc66': 'Seiko Oyster Perpetual GMT Master',
  'd9173090-5b5d-488c-bc74-3b93f511fa1c': 'Seiko Oyster Perpetual GMT Master',
  '82e4122c-6056-40ed-9260-dffa1d4798d5': 'Seiko Oyster Perpetual GMT Master',
  'f16f62e0-fdf6-404f-84ac-e8bb13c9d295': 'Seiko Oyster Perpetual GMT Master',
  'bfa75d15-d981-4410-969c-bf74c147bc5d': 'Seiko Oyster Perpetual GMT Master',
  'faddc309-c517-4b0b-86e6-8485e26828d8': 'Seiko Oyster Perpetual Day-Date',
  'ba2ced7d-ba21-4d8c-b3f3-b5a11721ee87': 'Seiko 5 Sports Automatic Grey',
  'a5ff5582-87ab-41ac-a1fe-2dab25517c03': 'Seiko 5 Sports Automatic Green',
  '5df681e0-1fbd-4a73-8e62-82d75f930420': 'Seiko 5 Sports Automatic Black',
  '0f714acb-4e47-48eb-a1a2-0a3d9b4c98bb': 'Seiko 5 Sports Automatic Blue',
  'ed0676df-143e-4426-b6eb-26227afc2229': 'Seiko 5 Sports Automatic Brown',
  'b16dabc8-32bf-4441-9af5-13aa9d103876': 'King Seiko Premium Automatic',
  '2a512acd-c6cf-4416-9ff7-9a8cdd412d72': 'Seiko Presage Cocktail Time Mojito Black Blue',
  '4d609460-9a71-405d-9fc8-59500d423ab9': 'Seiko Presage Cocktail Time Mojito Brown Green',
  // ── ROLEX ──────────────────────────────────────────────────────
  'f9679241-efaf-4c11-961e-862ec38c5f02': 'Rolex Oyster Perpetual Rainbow Gold',
  '42fa0d66-75a3-4d56-9a70-799c2123b6bc': 'Rolex Oyster Perpetual Rainbow Silver',
  '419b69d0-d495-40d9-a6b7-20e4397d4742': 'Rolex Automatic Gold White',
  'd77d694d-3969-4b44-a154-664101837e87': 'Rolex Oyster Perpetual Day-Date',
  'cb86ea14-3e40-4f12-82b3-5b7bd9edfdeb': 'Rolex Cosmograph Daytona Giraffe',
  '8c0b4995-f3ba-45da-9366-d80e5731f749': 'Rolex Oysterflex Daytona Gold',
  '859e43b8-2f6e-4a8b-a4b6-03616fe99b52': 'Rolex Oysterflex Daytona Silver',
  'a17d460f-a63c-4b05-88c1-9672cc0c8789': 'Rolex Oysterflex Daytona Copper',
  'c714448c-c052-409c-84d2-bdff98134627': 'Rolex Oyster Perpetual Day-Date Silver Navy',
  'b24f8b9e-28fa-4ca4-939b-3fb05ea8c476': 'Rolex Oyster Perpetual Datejust Two-Tone Copper Brown',
  '25a66e84-e6cb-4e33-a1df-07e023fea78f': 'Rolex Oyster Perpetual Datejust Two-Tone Copper Brown Diamond',
  '56e071fe-6a29-41f9-89c4-eb79865c43fb': 'Rolex Oyster Perpetual Day-Date 40 Diamond Gold Green',
  '9919259c-6933-45a5-95f9-1ee542a66646': 'Rolex Oyster Perpetual Day-Date 40 Gold Green',
  '9e1cae80-86d7-4ab3-9c7f-fce4a8c288e9': 'Rolex Oyster Perpetual Day-Date 40 Silver Sky Blue',
  '4789ddf5-a845-42f5-ae90-b60cd299cec5': 'Rolex Oyster Perpetual Day-Date 40 Silver Blue',
  '497b6fe8-b835-4fee-857f-5465f6168393': 'Rolex Oyster Perpetual Day-Date 40 Silver Black',
  // ── TAG HEUER ──────────────────────────────────────────────────
  '92bec6e5-1eb9-42c1-a658-525bb800be82': 'TAG Heuer Formula 1 Chronograph Black Blue',
  'a1ac1ec3-1cbf-4188-a219-25d0159277a9': 'TAG Heuer Formula 1 Chronograph Black Green',
  '050e542f-d07e-4a6b-a37a-c4890547a21a': 'TAG Heuer Carrera Paris Eiffel Tower Black',
  'cd962b12-fcc0-4e56-8ef4-49d7fcf94746': 'TAG Heuer Carrera Paris Eiffel Tower Blue',
  '63253070-b8cd-4e9d-a1fe-5329d59c0612': 'TAG Heuer Carrera Paris Eiffel Tower Black Silver',
  // ── TISSOT ─────────────────────────────────────────────────────
  '098026ff-ed42-4865-ba00-ecd5fc3a72c3': 'Tissot Day-Date Silver Blue',
  'b9c6b9fd-32cc-4804-a286-ce62f4e9d8e8': 'Tissot 1853 Couturier Black Copper Black',
  '027bf4f2-5792-4a13-81b3-a58c9690734f': 'Tissot 1853 Couturier Black Silver',
  'a9da7c23-6ae9-41f4-99cf-8202e696853d': 'Tissot 1853 Couturier Full Black',
  '3ec240a4-4bd9-4798-81f9-684a2f82cece': 'Tissot 1853 Couturier Brown Silver White',
  '2027f22d-0591-47ec-af25-e576184df9c6': 'Tissot 1853 Couturier Black Copper White',
  '532d3a2a-10df-4a09-81bf-783747bdf147': 'Tissot Day-Date Lime Dial',
  '27f0f19b-7db7-4e5f-a438-c73f5408104e': 'Tissot Leather',
  '61478885-80ba-459f-b2ac-8165416db467': 'Tissot 1853 Chain',
  '7a861182-99d0-4446-8e58-4d0fc6160e50': 'Tissot 1853 Chain',
  // ── FOSSIL ─────────────────────────────────────────────────────
  '4b96348a-93d0-407e-8715-2aada266a075': 'Fossil Bannon Chronograph',
  '802cd18a-3841-4f83-90d3-a224950f0026': 'Fossil Grant Automatic Brown Silver White',
  '88da02ad-4901-497c-9da8-b39742cbe0bb': 'Fossil Grant Automatic Black Silver White',
  '91324ec3-7a07-418f-b526-191379043e67': 'Fossil Grant Automatic Full Black',
  'fffc8924-898c-4cb4-9777-6de94792b124': 'Fossil Grant Automatic Open Heart Stainless Steel',
  '7ef04974-b8c8-4b76-8a5c-218496834433': 'Fossil Tank Luxury Old Money Fashion',
  // ── OMEGA ──────────────────────────────────────────────────────
  '4bf9ace5-dcf8-4882-a0fa-234dd5c4a88b': 'Omega Seamaster Diver 300M Co-Axial Master Chronometer Chronograph Silver Blue',
  '3c447249-9be7-46e2-a99e-c045143f9b81': 'Omega Seamaster Diver 300M Co-Axial Master Chronometer Chronograph',
  '27bbf8b1-b2ba-42b0-b2e1-cc97ec771b44': 'Omega Seamaster Diver 300M Co-Axial Master Chronometer Chronograph Silver Black',
  '6fa0dd77-02f9-4e8b-aaeb-da95fc32b85c': 'Omega Seamaster Diver 300M Co-Axial Master Chronometer Chronograph Two-Tone Copper Black',
  'aa4d04ae-6499-4dfb-8427-ce3c25576e62': 'Omega Seamaster Diver 300M Co-Axial Master Chronometer Chronograph Two-Tone Copper Blue',
  // ── RADO ───────────────────────────────────────────────────────
  'e5e030fc-4709-4e3b-b185-9683dbb2657f': 'Rado Centrix Automatic Open Heart Two-Tone Copper Brown',
  '05c052bd-0865-46e5-a0a2-238aa256d2fa': 'Rado Centrix Automatic Open Heart Two-Tone Gold Green',
  '24199b64-7af2-4361-94d3-21394d77a4d7': 'Rado DiaStar Original Automatic Triple Diamond',
  'c61ae0d6-46ba-4fcc-b0c1-503d4fdfa490': 'Rado DiaStar Original Automatic Single Diamond',
  '08c29156-28a4-4269-9dc8-cf8726bc11e6': 'Rado DiaStar Original Automatic',
  'f3bad6eb-b52c-4910-a48d-96c37550f635': 'Rado DiaStar Original Automatic',
  'fddd4e7a-8946-427a-815f-8fb2542f8964': 'Rado DiaStar Original Automatic',
  '8a5bca32-6f76-4ffa-b760-b03f68d8aac9': 'Rado Captain Cook Automatic',
  'f4313c8e-9be9-436e-aa74-eb4952f4a063': 'Rado Captain Cook Automatic',
  '91a4639d-5fed-4bde-9f30-ecfedf908d96': 'Rado Captain Cook Automatic Full Black',
  // ── ARMANI ─────────────────────────────────────────────────────
  '42b7607b-d8e9-4e45-a952-c3160cae88d2': 'Armani Exchange Gunmetal Leather',
  '04227fda-85db-4d5c-8227-9cdd0b487468': 'Armani Exchange Classic Silver Black',
  '583a1bb6-633d-40db-bb10-86ea4df50d28': 'Armani Exchange Classic Full Black',
  'd25f318c-39d9-4818-b18d-242f92144500': 'Armani Exchange Classic Full Black',
  'c56d5e03-051e-4442-8555-f7968a6db845': 'Emporio Armani Antonio Silver Green',
  '930f3a1b-1211-448a-a420-43b9419e7721': 'Emporio Armani Antonio Green Automatic',
  // ── BREGUET ────────────────────────────────────────────────────
  '534264c5-aee4-4bc1-825e-a905eb5f3732': 'Breguet Classique Tourbillon Black White',
  'ce9c1bb9-8e0b-47dc-8ce2-ad6d0d7a2cb7': 'Breguet Classique Tourbillon Brown White',
  'ddfa8b6d-99ea-4f2a-9e75-dc1200bf0546': 'Breguet Classique Tourbillon Full Black',
  // ── RICHARD MILLE ──────────────────────────────────────────────
  'b60383da-6a6f-4f50-ac4a-4e01debb941e': 'Richard Mille Skeleton Open Heart',
  // ── DIESEL ─────────────────────────────────────────────────────
  '8163a5e1-d7cb-4b48-95d6-9d7e3b185b22': 'Diesel Gold',
  // ── HUGO BOSS ──────────────────────────────────────────────────
  '646d0887-0793-4c99-a017-a48f4afefe27': 'Hugo Boss Principle Skeleton Automatic Black Gold',
  '26fd7b9c-889c-40fd-b3f2-912fbc9e746a': 'Hugo Boss Principle Skeleton Automatic Black Silver',
  '2e0894a3-9984-41d7-b611-eed247b6fb00': 'Hugo Boss Fiber',
  '6cab07e1-e3fa-4887-9bcf-83952f318630': 'Hugo Boss Fiber',
  // ── MICHAEL KORS ───────────────────────────────────────────────
  '248b2964-0794-46ac-95a1-bf16742a72b2': 'Michael Kors Skeleton',
  // ── TUDOR ──────────────────────────────────────────────────────
  '2ec87c60-316f-4df0-8938-90d4f7d0d55d': 'Tudor Royal Automatic Two-Tone Gold Gray',
  'ee387d23-816f-4791-87c7-1d6f58e0ec4b': 'Tudor Royal Automatic Two-Tone Gold Black Diamond',
  'd8d068d9-764e-4a7a-bbd2-327a8ca00f5b': 'Tudor Royal Automatic Two-Tone Copper Brown',
  '849a5cac-6f9e-4d48-8ee0-f095abcb0da3': 'Tudor Royal Automatic Two-Tone Gold Black',
  // ── CITIZEN ────────────────────────────────────────────────────
  '3ee47003-e157-4f94-ac65-f3d2b403d762': 'Citizen Classic Couple',
  'b0f73c4c-90cc-4158-93ac-01a47b6c52f9': 'Citizen Classic Couple',
  // ── SWAROVSKI ──────────────────────────────────────────────────
  'ef579471-91d9-4ace-9c64-fce8b35189c8': 'Swarovski Passage Chronograph',
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
  // Build request from response — change ONLY name
  const payload = {
    name:            newName,
    originalName:    product.originalName || product.name,
    searchName:      product.searchName   || '',
    brand:           product.brand        || '',
    searchBrand:     product.searchBrand  || '',
    searchText:      product.searchText   || '',
    category:        product.category     || 'Watches',
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
  console.log(`WATCH NAME AUDIT — Applying ${ids.length} corrections`);
  console.log(`${'='.repeat(60)}\n`);

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
  require('fs').writeFileSync('/tmp/watch_update_log.json', JSON.stringify(log, null, 2));
  console.log('\nFull log saved to /tmp/watch_update_log.json');
})();
