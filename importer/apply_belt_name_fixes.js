/**
 * apply_belt_name_fixes.js
 * ─────────────────────────────────────────────────────────────
 * Applies HIGH-confidence belt name corrections to the Kicksaura
 * production database. For each product:
 *   1. GET full product data (admin endpoint)
 *   2. Change ONLY the name field and append to searchText
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
  "14116fc5-6fcf-45b4-98ec-8a68a26810ea": "US POLO BELT US 7",
  "2075ec3b-35a5-405c-9816-c7c61746c7f7": "Louis Vuitton Glossy Silver Reversible Belt Fa 785",
  "8477cb3d-bb84-44e0-aad1-af92a55d1efa": "ARMAANI Belt with Box Carry Bag A225",
  "b394e49b-ce1e-44fb-a304-008e54b81621": "Calvin Klein Ck",
  "1db6267e-3f5e-4e4b-b026-02f8a0d76141": "Calvin Klein Ck",
  "064d5aa3-e43b-4a83-b153-fefcc5a660c9": "Calvin Klein Ck",
  "63e319a8-2698-4938-9edb-491ee539e46e": "Louis Vuitton Black Brown Belt",
  "0923181b-cb70-4a3e-9c03-32f5ed8331d6": "CK Calvin Klein Grey Premium Quality Belt",
  "c7ffc450-4d1e-43a4-bdad-019e6dee66ba": "CK Calvin Klein Golden Glossy Belt",
  "227a4899-aed3-4c49-b7d1-e4a676bf8c4c": "AX Armani Exchange Glossy Premium Quality Belt Fa 1107",
  "0037de50-08ce-4818-906e-0ff2c17c09fa": "AX Armani Exchange Glossy Reversible Belt Fa 1105",
  "0b5b4f37-cc34-4573-b5fa-8ea8f3c5d8e8": "AX Armani Exchange Grey Premium Quality Belt Fa 1103",
  "f3723410-af55-43be-8d9a-6accf8266047": "Salvatore Ferragamo Golden Black Belt Fa 1002",
  "05dc4cba-c326-4eac-8be5-b38e25c1610d": "Louis Vuitton Black Glossy Black Belt Fa 1313",
  "29ee0eb3-15bf-42d8-af27-02c7f4c49e3d": "Coach 726 golden logo buccal with black brown reversible autolock belt with og box",
  "2f3cd6f0-c28b-4783-823b-3e9d30bb1c77": "Burberry BELT B199",
  "1ed0ddd3-b1d4-4e59-83ba-dc2c311f268e": "Burberry BELT B198",
  "2fa3e7f2-4eaa-4545-91ef-0a3e28dc2a1a": "Burberry BELT B197",
  "afd77d25-2521-439d-825f-d11ea1acb27c": "Louis Vuitton Grey Black Reversible Belt Fa 383",
  "a924b9a6-7257-4a2f-b83a-c8effb05d281": "Louis Vuitton Glossy Black Reversible Belt Fa 202",
  "fc58cfdf-e6a5-4e54-81ed-820c8a3b2020": "Hermes Paris Glossy Black New Belt Fa 412",
  "02bdd18c-a399-45cf-acec-5f70fd98386f": "LOUIIS VUITTON BELT LV 469",
  "daff4ab0-24e9-4e68-b824-374efd632b27": "Dior PREMIUM MENS BELT WID OG ACCESSORIES 530",
  "93c596a9-4280-4343-adba-fae225a7841f": "Dior PREMIUM MENS BELT WID OG ACCESSORIES 532",
  "6690df71-3c3c-494a-9a04-c320788f750f": "Dior PREMIUM MENS BELT WID OG ACCESSORIES 528",
  "33897bdf-a4a6-43c3-a3bd-903e0e55dd68": "Louis Vuitton LADIES PREMIUM BELT WID OG BOX 544",
  "938aa138-9d9d-4217-a29e-4c244546f430": "Louis Vuitton LADIES PREMIUM BELT WID OG BOX 526",
  "7ef5e106-fd15-4409-afb0-336457930cb5": "Levis Belt L1",
  "1cd54ef7-4bce-43fc-a123-0d785d97fe03": "ARMAANI Belt with Box Carry Bag A226",
  "fb93b62b-5200-4840-8a2d-11f6fac2916d": "Louis Vuitton Black Glossy Reversible Belt Fa 1109",
  "50f08f56-0217-4422-9d08-cd6a2fd20ef8": "Louis Vuitton Golden Black Premium Quality Belt Fa 1110",
  "4a2bb00a-6b83-48dc-b298-e3b451b71128": "Louis Vuitton Black Blue Belt & Wallet Combo Fa 1094",
  "403dd3f1-ba6c-421c-852a-962591c9dea5": "Louis Vuitton Black Grey Wallet Belt Combo Fa 1102",
  "a557cb9a-0614-4308-8208-b48f0033daad": "Louis Vuitton Brown Belt & Wallet Combo Fa 1092",
  "8ad4604a-ac16-4490-9834-d4545b160770": "Louis Vuitton Black Grey Wallet Belt Combo Fa 1093",
  "6f03d386-3b5c-4bfe-a75f-0baf5d517cf7": "Louis Vuitton Black Belt & Combo Fa 1090",
  "77622f16-6916-4e01-b46b-7e4b02af5a88": "Louis Vuitton Brown Black Wallet Belt Combo Fa 1091",
  "c286a5d3-b4c0-4a32-b67f-71d6d980354b": "Louis Vuitton Brown Black Wallet &Belt Combo Fa 1088",
  "c77211e8-fa5a-434c-b167-d1e79ee35cbc": "Louis Vuitton Black Grey Wallet Belt Combo Fa 1089",
  "dd998601-e5b4-4d90-8b2a-736155f0202b": "Louis Vuitton White &Black Belt & Wallet Combo Fa 1119",
  "12c65d35-ef63-405c-b39a-24f333c4931e": "Gucc Black& Brown Belt & Wallet Combo Fa 1097",
  "1f81d4b3-af7f-4aa8-948b-f2fef71eaf69": "Gucc Belt & Wallet Combo Brown Premium Quality Fa 1095",
  "7cd0e798-f81d-4dcf-99ff-28a5c54b9940": "Dior BELT D79",
  "9ff8b105-5b63-45a6-8643-316b80bbeddb": "ARMAI Belt with Box Carry Bag A224",
  "1667a342-8167-48aa-9612-1ac79a97fce2": "LOUIIS VUITTON CHECKS GOLD BELT 142",
  "def89303-fd90-46c6-a7da-1475a07fda04": "GUCCC I GG GOLD BLACK MEN BELT WID OG ACCESSORIES 193",
  "230dcd97-f5a5-43ad-81c8-14dae11b975e": "Salvatore Ferragamo sf-402 silver buccal black brown monogram design reversible belt with invoice and og box",
  "fca22804-3978-46c3-b2cd-432ebc8245d6": "Coach Belt & Wallet Black Combo Fa 1101",
  "41358039-6909-4499-923d-1a26817b751e": "Coach Belt & Wallet Brown Combo Fa 1100",
  "f6283b45-d4df-4439-9c34-1146f6e0e222": "AX Armani Exchange Black Premium Quality Belt Fa 505",
  "23deab97-531f-4e86-bd9b-99f9d816e9e0": "Louis Vuitton Vuitton Gold Black Glossy Belt Fa 1310",
  "548467d4-3e7a-4084-bd8b-6b7cab9abb7a": "Gucc Gold Black Premium Quality Belt Fa 1305",
  "01f1b077-a962-4e21-a07a-3e5f9ff9f44c": "Coach Auto Lock Black Belt Fa 461",
  "791a4215-2aae-4aad-80b8-9b8dbe05b8da": "Louis Vuitton Vuitton Silver Gold Glossy Reversible Belt Fa 1159",
  "6f26041a-561b-4fd1-99f4-0f694fdad8bc": "Gucc Black Silver Premium Quality Belt Fa 1304",
  "fae6491c-f0ec-4eb7-8d98-2780250e4c0a": "Louis Vuitton Vuitton Black Glossy Gold Premium Quality Belt Fa 1157",
  "27a35ea5-d812-4b6f-8dd5-f5c138039077": "Gucc Black Silver Belt Fa 1299",
  "7e92bb7c-b1ac-4d62-b66f-79d810525466": "Louis Vuitton Vuitton Gold Glossy Reversible Belt Fa 1158",
  "42115524-7ccb-4af9-b563-47051d1a8825": "Louis Vuitton Vuitton Black Grey Belt Fa 1311",
  "736fd556-e17c-4bd6-af38-2cc2d5d75e1b": "Louis Vuitton Vuitton Black Matt Reversible Belt Fa 1390",
  "fb7c0035-d6f1-4f8d-92c1-607c2dc6363b": "Louis Vuitton Vuitton White Black Belt Fa 1309",
  "9e3f6b30-be0a-41d7-8395-8e90d37fb3ab": "Louis Vuitton Vuitton Grey Reversible Belt",
  "b6906f7f-d897-46bb-b4c4-9112dd432a95": "Louis Vuitton Vuitton Black Gold Premium Quality Belt 1312",
  "1306e607-cf11-485e-8a8c-933af4071848": "Louis Vuitton Glossy Reversible Belt Fa 1392",
  "13dec58e-f304-4ae5-b53c-dd2b81854af9": "Louis Vuitton Mat Grey Reversible Belt Fa 1391",
  "19007507-7961-441f-ad8f-db8c36c7534d": "Tommy Hilfiger Black Premium Quality Belt Fa 907",
  "b4b088c6-b164-4111-9395-37ad16c75dc5": "AX Armani Exchange Exchange Black Silver Reversible Belt Fa 87",
  "8fec3981-6ae3-4832-8b40-ebfcc4753137": "AX Armani Exchange Silver Belt With Box And Carry Bag Fa 06",
  "c53f07a1-cd8c-49fb-8bcf-aab2c9b60224": "AX Armani Exchange Exchange Reversible Belt Fa 352",
  "33ba0664-1408-4258-a6f5-611adb0e1028": "Louis Vuitton Black Golden Reversible Belt Fa 783",
  "e2c968ab-41f7-48f3-b2f7-4a3fbbe91b78": "Jaguar Glossy Silver Premium Quality Belt Fa 931",
  "b94e1dba-4c17-4495-b3f1-e3fb095aa6aa": "Balenciaga Black Premium Quality Belt Fa 841",
  "38d79b40-660c-4246-9332-e48ce3be4e25": "Balenciaga Grey Black Premium Quality Belt Fa 842",
  "b277ce20-e57d-4cf4-a7f2-b79377621b7a": "Valentino Black Premium Quality Belt Fa 932",
  "cf25e93a-5906-4a25-baa8-ec22f7be66a3": "Tommy Hilfiger BELT T100",
  "c1bf0cd0-24aa-47a0-9263-8aafd6ffe376": "Jaguar J-901 black brown reversible belt with og box",
  "a90a763e-7ea3-42f6-a8ae-2c217908ec1e": "Jaguar Black Grey Reversible Belt Fa 929",
  "fafb07c1-8545-4553-ba20-092b3936dd3f": "Burberry BB-247 golden buccal black brown reversible belt with og box card and carry bag",
  "0d113638-cb15-4d88-afde-34e66adf6960": "Calvin Klein CK 108",
  "ea5b4d1e-7d25-4b22-b217-a51d34ea46fa": "CK Calvin Klein Black Glossy Premium Quality Belt Fa 923",
  "2302db9f-fa5e-4eff-9c4e-20788889947e": "Tommy Hilfiger Black Glossy Belt Fa 933",
  "38ec9463-240f-4376-96e7-85627a40bd4f": "Tommy Hilfiger Brown Belt Fa 906",
  "bb3b2115-7ffc-4867-bda2-0ed674a0a6fa": "AX Armani Exchange Single Bukkle Silver Belt Fa 09",
  "da9b3d45-6873-4064-be42-fbb118620486": "AX Armani Exchange Grey Glossy Belt Fa 994",
  "22d18662-bb1c-4fb1-94ae-d2b11b352069": "AX Armani Exchange Golden Glossy Belt Fa 991",
  "3fb8db1b-b3d2-483f-9329-12f5e795641e": "Tommy Hilfiger BELT T99",
  "733395c8-ae66-4dc7-ba33-837921b1155f": "Burberry Glossy Grey Reversible Belt Fa 1001",
  "b9c85da1-8c69-46ea-ba11-410aa4b82295": "Ax-012 black buccal crocodile reversible belt with og box",
  "85015a5e-c45a-4b7b-b7c7-7934a19c8416": "CK Calvin Klein Brown Gold Belt Fa 924",
  "0c87ff9d-c6ab-41e7-ae9d-a926284ccf10": "Burberry Glossy Black Reversible Belt Fa 1000",
  "7ad0b1f7-724f-4553-8d61-3987ac8e9e8f": "Sale Dior D-801 monogram design belt with box (box damaged)",
  "e97a25f4-43a1-4e81-af90-7bd3be910bf7": "Salvatore Black Premium Quality Belt Fa 926",
  "bff942bc-9f77-4786-a0e3-67ec7bf52171": "AX Armani Exchange Exchange Reversible Golden Black Fa 90",
  "cfd7349b-064c-4194-a642-e0b31b702a61": "ARMAI Belt with Box Carry Bag A223",
  "37768e7a-c8b9-4f68-a55d-f6330b6dc07b": "Louis Vuitton Grey Premium Quality Reversible Belt Fa 1108",
  "2066d6df-2a72-49c3-89c6-f4621be50fc7": "Gucc Combo Black Belt & Combo Premium Quality Fa 1096",
  "28823079-8fa3-4f79-bb64-d00591dd9358": "Louis Vuitton Vuitton Grey Reversible Belt Fa 429",
  "14ca8808-8c7d-4c10-bf86-bde3b0fa651d": "Salvatore Ferragamo sf-406 golden buccal crocodile reversible belt with og box",
  "6aac8390-925e-4c16-9165-a72cfe9a6387": "Salvatore Ferragamo SF-403 black brown monogram design reversible belt with invoice and og box"
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
    category:        product.category     || 'Belts',
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
  console.log(`BELT NAME AUDIT — Applying ${ids.length} corrections`);
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

  require('fs').writeFileSync('/tmp/belt_update_log.json', JSON.stringify(log, null, 2));
  console.log('\nFull log saved to /tmp/belt_update_log.json');
})();
