import requests
import json

AIRTABLE_API_KEY = "patzZjUMDdMWBybDh.c93374a7eef4ea6d3a9aa06b2ef1c573aac2d6fe04ee0d48b141fece2a8f13ff"
BASE_ID = "appDBk60DIC9QQLVS"
PIPELINE_TABLE_ID = "tbllzgePE8swXymyh"

def export_pipeline_data():
    all_records = []
    offset = None
    
    while True:
        url = f"https://api.airtable.com/v0/{BASE_ID}/{PIPELINE_TABLE_ID}"
        headers = {
            "Authorization": f"Bearer {AIRTABLE_API_KEY}"
        }
        
        params = {}
        if offset:
            params['offset'] = offset
            
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        records = data.get("records", [])
        all_records.extend(records)
        
        # Check if there are more records to fetch
        offset = data.get("offset")
        if not offset:
            break
    
    return all_records

if __name__ == "__main__":
    try:
        records = export_pipeline_data()
        print(f"Successfully retrieved {len(records)} records")
        print(json.dumps(records, indent=2))
    except Exception as e:
        print(f"Error: {e}")