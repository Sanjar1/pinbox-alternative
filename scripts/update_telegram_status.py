#!/usr/bin/env python3
"""
Update Telegram links for all Сырная Лавка stores in Yandex Sprav
Script to track which stores have Telegram added and help batch-process remaining stores

Completed (3/28 accessible stores):
- 2605231525 ✅ Telegram: https://t.me/SirnayaLavka_Uzb  
- 46711213257 ✅ Telegram: https://t.me/SirnayaLavka_Uzb
- 51521899757 ✅ Telegram: https://t.me/SirnayaLavka_Uzb

Remaining (25/28):  
IDs: 68372174039, 73077844158, 78130811373, 80285992156, 81444134916, 
88969661261, 93021421517, 93653304255, 96275437524, 98808908571,
113993963061, 119523779091, 134404129580, 140717986697, 140997774388,
143672341206, 168675219928, 191697629628, 193938967033, 205196568796,
219043654252, 225503578112, 225833833825, 235345012305, 242380255215

Process:
1. For each store, navigate to: https://yandex.ru/sprav/{ORG_ID}/p/edit/
2. Click "Добавить" in "Сайт и социальные сети" section
3. Select "Telegram"
4. Enter: https://t.me/SirnayaLavka_Uzb
5. Click "Сохранить изменения"
6. Repeat for next store

Automation opportunity: Create browser automation script to process all 25 stores in batch

Date: 2026-02-28
"""

import json
import sys
from pathlib import Path

def update_telegram_status():
    """Update stores_audit_clean.json with Telegram status"""
    
    # Load current store data
    data_path = Path(__file__).parent.parent / "data" / "stores_audit_clean.json"
    
    with open(data_path, 'r', encoding='utf-8') as f:
        stores = json.load(f)
    
    # Store IDs that have been completed
    completed_ids = {2605231525, 46711213257, 51521899757}
    
    # Add Telegram field to each store
    for store in stores:
        org_id = store.get('Yandex Org ID')
        
        if org_id in completed_ids:
            store['Telegram'] = 'https://t.me/SirnayaLavka_Uzb'
            store['Telegram Status'] = 'Added ✅'
        elif org_id and org_id > 0:  # Has Org ID but not yet processed
            store['Telegram'] = 'https://t.me/SirnayaLavka_Uzb'
            store['Telegram Status'] = 'Pending - needs to be added'
        else:  # No Org ID yet
            store['Telegram'] = 'https://t.me/SirnayaLavka_Uzb'
            store['Telegram Status'] = 'Pending - store needs to be claimed first'
    
    # Save updated version
    output_path = data_path.parent / "stores_audit_with_telegram.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(stores, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {len(stores)} stores with Telegram status")
    print(f"Completed: 3/28 accessible stores")
    print(f"Output: {output_path}")
    
    # Print summary
    completed = sum(1 for s in stores if s.get('Telegram Status') == 'Added ✅')
    pending = sum(1 for s in stores if s.get('Telegram Status') == 'Pending - needs to be added')
    needs_claim = sum(1 for s in stores if s.get('Telegram Status') == 'Pending - store needs to be claimed first')
    
    print(f"\nSummary:")
    print(f"  ✅ Added: {completed}")
    print(f"  ⏳ Pending (need to add): {pending}")
    print(f"  🔒 Pending (need to claim): {needs_claim}")

if __name__ == "__main__":
    update_telegram_status()
