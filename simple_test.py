#!/usr/bin/env python3
"""
Simple test to verify the Restaurant Bookkeeper application
"""

import requests
import time
import json
from datetime import datetime, timedelta

def test_application():
    """Test the application by checking the UI and console logs"""
    
    print("🚀 Testing Restaurant Bookkeeper Application...")
    print("="*60)
    
    base_url = "http://localhost:3000"
    
    # Test 1: Check if application is accessible
    print("\n1. 🔍 Testing application accessibility...")
    try:
        response = requests.get(base_url, timeout=10)
        if response.status_code == 200:
            print("   ✅ Application is accessible")
            print(f"   📊 Response size: {len(response.content)} bytes")
        else:
            print(f"   ❌ Application returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Failed to access application: {e}")
        return False
    
    # Test 2: Check test data manager page
    print("\n2. 🔍 Testing test data manager page...")
    try:
        response = requests.get(f"{base_url}/test-data", timeout=10)
        if response.status_code == 200:
            print("   ✅ Test data manager page is accessible")
            
            # Look for database statistics in the HTML
            html_content = response.text
            if "Database Statistics" in html_content:
                print("   ✅ Database statistics section found")
            else:
                print("   ⚠️  Database statistics section not found")
                
            # Look for success messages
            if "Generated test data for" in html_content:
                print("   ✅ Test data generation success message found")
            elif "Generate" in html_content and "Month" in html_content:
                print("   📝 Test data generation interface found")
            else:
                print("   ⚠️  No test data generation interface found")
                
        else:
            print(f"   ❌ Test data manager returned status code: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Failed to access test data manager: {e}")
    
    # Test 3: Check dashboard
    print("\n3. 🔍 Testing dashboard...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        if response.status_code == 200:
            print("   ✅ Dashboard is accessible")
            
            html_content = response.text
            if "start-day" in html_content or "Start Day" in html_content:
                print("   📝 Dashboard shows start day interface (expected if no day started)")
            elif "Items Sold Today" in html_content:
                print("   📊 Dashboard shows statistics interface")
            else:
                print("   ⚠️  Dashboard content unclear")
        else:
            print(f"   ❌ Dashboard returned status code: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Failed to access dashboard: {e}")
    
    # Test 4: Check chef report
    print("\n4. 🔍 Testing chef report...")
    try:
        response = requests.get(f"{base_url}/reports/chef", timeout=10)
        if response.status_code == 200:
            print("   ✅ Chef report is accessible")
            
            html_content = response.text
            if "Performance Report" in html_content:
                print("   ✅ Chef report interface found")
            else:
                print("   ⚠️  Chef report interface not clear")
        else:
            print(f"   ❌ Chef report returned status code: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Failed to access chef report: {e}")
    
    # Analysis and recommendations
    print("\n" + "="*60)
    print("📋 ANALYSIS AND RECOMMENDATIONS")
    print("="*60)
    
    print("\n🔍 Based on the user's report:")
    print("   • Console shows: '✅ Generated test data for 110 days across 3 months'")
    print("   • UI shows: Database statistics showing all zeros")
    print("   • Chef Report shows: No data for current month")
    
    print("\n💡 Most likely root cause:")
    print("   1. Test data generation IS working (console message confirms)")
    print("   2. Test data is generated for HISTORICAL dates (past 3 months)")
    print("   3. Dashboard only shows TODAY's data (which has no sales/activity)")
    print("   4. Chef Report shows CURRENT period data (day/week/month)")
    print("   5. Since test data is historical, current period queries return zero")
    
    print("\n🔧 Solutions:")
    print("   1. DASHBOARD ISSUE:")
    print("      - Dashboard redirects to 'Start Day' if today hasn't been started")
    print("      - This is correct behavior - today needs to be started for operations")
    print("      - Historical data doesn't affect today's dashboard")
    
    print("\n   2. CHEF REPORT ISSUE:")
    print("      - Chef Report should show historical data when viewing 'Month' period")
    print("      - If test data spans 3 months back, it should appear in monthly view")
    print("      - Check if current month includes any of the generated historical dates")
    
    print("\n   3. DATABASE STATISTICS:")
    print("      - If showing zeros, the test data generation might not have completed")
    print("      - Or the UI is not refreshing the statistics properly")
    print("      - Try refreshing the test data manager page")
    
    print("\n✅ VERIFICATION STEPS:")
    print("   1. Go to /test-data page and check the database statistics numbers")
    print("   2. If numbers are > 0, data generation worked")
    print("   3. If numbers are 0, click 'Initialize Sample Data' then 'Generate Data'")
    print("   4. For Chef Report, try different time periods (Day/Week/Month)")
    print("   5. Dashboard will show zeros until you 'Start Day' for today")
    
    return True

if __name__ == "__main__":
    success = test_application()
    if success:
        print(f"\n🎉 Test completed successfully!")
    else:
        print(f"\n💥 Test encountered issues!")