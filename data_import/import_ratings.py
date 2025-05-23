import json
import requests

# Path to the Dart ratings file
DART_FILE = 'ratings_fixed.json'
API_BASE = 'http://localhost:8000'

# Helper to load the Dart file as a Python list
def load_ratings():
    with open(DART_FILE, 'r') as f:
        return json.load(f)

def get_or_create_location(name, address, lat=None, lon=None):
    # Check if location exists by name only
    resp = requests.get(f"{API_BASE}/locations/")
    resp.raise_for_status()
    locations = resp.json()
    for loc in locations:
        if loc['name'].strip().lower() == name.strip().lower():
            return loc['id']
    # Create location
    payload = {"name": name, "address": address}
    if lat is not None:
        payload["lat"] = lat
    if lon is not None:
        payload["lon"] = lon
    resp = requests.post(f"{API_BASE}/locations/", json=payload)
    if resp.status_code != 200:
        print(f"Failed to create location: name={name!r}, address={address!r}, lat={lat}, lon={lon}, status={resp.status_code}, response={resp.text}")
        resp.raise_for_status()
    return resp.json()['id']

def main():
    ratings = load_ratings()
    for entry in ratings:
        fields = entry['fields']
        name = fields['venu_name']
        address = fields['address']
        lat = fields.get('lat')
        lon = fields.get('lon')
        location_id = get_or_create_location(name, address, lat, lon)
        # Compose a comment with all fields
        comment = '\n'.join(f"{k}: {v}" for k, v in fields.items() if k not in ['venu_name', 'address', 'overall_rating'])
        data = {
            "location_id": location_id,
            "rating": fields['overall_rating'],
            "comment": comment
        }
        resp = requests.post(f"{API_BASE}/reviews/", json=data)
        if resp.status_code == 200:
            print(f"Imported review for {name}")
        else:
            print(f"Failed to import review for {name}: {resp.text}")

if __name__ == '__main__':
    main() 