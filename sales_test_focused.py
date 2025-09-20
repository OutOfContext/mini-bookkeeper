#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime

def test_sales_default_payment():
    """Test sales creation with default payment type"""
    base_url = "http://localhost:8001"
    
    # Login first
    login_response = requests.post(f"{base_url}/api/auth/login", 
                                 json={"username": "admin", "password": "password123"})
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()['accessToken']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get menu items
    items_response = requests.get(f"{base_url}/api/menu/items", headers=headers)
    if items_response.status_code != 200:
        print(f"❌ Failed to get menu items: {items_response.status_code}")
        return False
    
    items = items_response.json()
    if not items:
        print("❌ No menu items available")
        return False
    
    item_id = items[0]['id']
    print(f"✅ Using menu item: {items[0]['name']} (${items[0]['price']})")
    
    # Test 1: Create sale WITHOUT payment type (should default to CASH)
    sale_data = {
        "menuItemId": item_id,
        "amount": 1
    }
    
    sale_response = requests.post(f"{base_url}/api/sales", json=sale_data, headers=headers)
    
    if sale_response.status_code in [200, 201]:  # Accept both since proxy issue
        sale_result = sale_response.json()
        if sale_result.get('paymentType') == 'CASH':
            print("✅ CRITICAL TEST PASSED: Sale without payment type defaults to CASH")
            print(f"   Sale ID: {sale_result['id']}")
            print(f"   Payment Type: {sale_result['paymentType']}")
            return True
        else:
            print(f"❌ CRITICAL TEST FAILED: Expected CASH, got {sale_result.get('paymentType')}")
            return False
    else:
        print(f"❌ Sale creation failed: {sale_response.status_code}")
        print(f"   Response: {sale_response.text}")
        return False

if __name__ == "__main__":
    success = test_sales_default_payment()
    print("=" * 50)
    if success:
        print("🎉 CRITICAL FIX VERIFIED: Sales default to CASH when no payment type specified")
    else:
        print("❌ CRITICAL FIX FAILED: Sales still require payment type")
    sys.exit(0 if success else 1)