import requests
import jwt
import base64
import time

secret_str = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437"
key = base64.b64decode(secret_str)

payload = {
    "uuid": "admin-123",
    "role": "ROLE_ADMIN",
    "sub": "admin",
    "exp": int(time.time()) + 3600
}

token = jwt.encode(payload, key, algorithm="HS256")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

base_url = "https://pure-grace-production-6c99.up.railway.app/api/v1"
# base_url = "http://localhost:8080/api/v1" # if we were testing locally

page = 0
size = 100
total_updated = 0
total_failed = 0

print("Fetching products to find sneakers...")
while True:
    resp = requests.get(f"{base_url}/admin/products?page={page}&size={size}", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch page {page}: {resp.status_code}")
        break
    
    data = resp.json()
    content = data.get("content", [])
    if not content:
        break
        
    for product in content:
        if product.get("category", "").lower() == "sneakers":
            if not product.get("newArrival"):
                # Needs update
                # Construct ProductRequestDTO from ProductResponseDTO
                update_payload = {
                    "name": product.get("name"),
                    "originalName": product.get("originalName"),
                    "searchName": product.get("searchName"),
                    "brand": product.get("brand"),
                    "searchBrand": product.get("searchBrand"),
                    "searchText": product.get("searchText"),
                    "category": product.get("category"),
                    "description": product.get("description"),
                    "basePrice": product.get("basePrice"),
                    "discountedPrice": product.get("discountedPrice"),
                    "imageUrls": product.get("imageUrls", []),
                    "videoUrls": product.get("videoUrls", []),
                    "isVisible": product.get("visible", True),
                    "isSaleVisible": product.get("saleVisible", False),
                    "isNewArrival": True,  # Set to True
                    "isTrending": product.get("trending", False),
                    "isVideoVisible": product.get("videoVisible", False),
                    "withOgBox": product.get("withOgBox", False),
                    "isInStockFlag": product.get("inStockFlag", False),
                    "limitedStock": product.get("limitedStock", False),
                    "variants": product.get("variants", []),
                    "sourceSite": product.get("sourceSite"),
                    "sourceProductId": product.get("sourceProductId")
                }
                
                # variants might need ID stripped or kept depending on how the backend handles PUT
                # typically PUT updates variants if they have IDs, creates if they don't
                
                pid = product.get("id")
                put_resp = requests.put(f"{base_url}/admin/products/{pid}", json=update_payload, headers=headers)
                if put_resp.status_code == 200:
                    print(f"Updated Sneaker to New Arrival: {pid} - {product.get('name')}")
                    total_updated += 1
                else:
                    print(f"Failed to update {pid}: {put_resp.status_code} - {put_resp.text}")
                    total_failed += 1

    if data.get("last", True):
        break
    page += 1

print(f"Done. Total updated: {total_updated}, Total failed: {total_failed}")
