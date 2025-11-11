# Debugging API Integration

## Issue: Frontend Still Showing Mock Data

### Possible Causes

1. **Browser Cache** - Old JavaScript bundle cached
2. **API Calls Failing** - CORS or network errors
3. **Environment Variable Not Set** - `NEXT_PUBLIC_API_URL` not available at build time
4. **Build Not Updated** - Old build still being used

### How to Debug

1. **Open Browser Console** (F12 or Cmd+Option+I)
   - Check for API errors
   - Look for CORS errors
   - Check Network tab for failed requests

2. **Check API Client**
   - Open browser console
   - Type: `fetch('http://localhost:3003/api/services')`
   - Should return service data

3. **Verify Environment Variable**
   - Check if `NEXT_PUBLIC_API_URL` is set in build
   - Should be `http://localhost:3003`

4. **Clear Browser Cache**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or clear cache in browser settings

### Quick Fix

If API calls are failing, check:
- Backend is running on port 3003
- CORS is configured correctly
- No network/firewall issues

