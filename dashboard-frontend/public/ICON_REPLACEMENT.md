# Icon Replacement Guide

## Current Icons

The following icon files need to be replaced with your custom branding:

### Required Icons

1. **`apple-icon.png`** (180x180px)
   - Used for Apple touch icons (iOS Safari)
   - Currently shows "v0" branding
   - **Location**: `dashboard-frontend/public/apple-icon.png`

2. **`icon-light-32x32.png`** (32x32px)
   - Light mode favicon
   - **Location**: `dashboard-frontend/public/icon-light-32x32.png`

3. **`icon-dark-32x32.png`** (32x32px)
   - Dark mode favicon
   - **Location**: `dashboard-frontend/public/icon-dark-32x32.png`

4. **`icon.svg`**
   - SVG favicon (scalable)
   - **Location**: `dashboard-frontend/public/icon.svg`

## How to Replace

### Option 1: Replace Individual Files

1. **Create your icon** in the required sizes:
   - Apple icon: 180x180px PNG
   - Favicons: 32x32px PNG (light and dark versions)
   - SVG: Scalable vector format

2. **Replace the files**:
   ```bash
   # Replace apple-icon.png
   cp your-apple-icon.png dashboard-frontend/public/apple-icon.png
   
   # Replace favicons
   cp your-icon-light.png dashboard-frontend/public/icon-light-32x32.png
   cp your-icon-dark.png dashboard-frontend/public/icon-dark-32x32.png
   
   # Replace SVG
   cp your-icon.svg dashboard-frontend/public/icon.svg
   ```

3. **Rebuild the frontend**:
   ```bash
   make down
   make dev
   ```

### Option 2: Use Online Icon Generator

1. **Generate icons** from a single image:
   - Visit: https://realfavicongenerator.net/
   - Upload your logo/image
   - Download the generated icons
   - Replace the files in `dashboard-frontend/public/`

2. **For Apple icon specifically**:
   - Size: 180x180px
   - Format: PNG
   - Name: `apple-icon.png`

### Option 3: Create Simple Icon

If you don't have a logo yet, you can create a simple icon:

1. **Create a simple design**:
   - Use a design tool (Figma, Canva, etc.)
   - Or use an online icon generator
   - Design should represent "Zero-to-Running" or "DevEnv"

2. **Export in required formats**:
   - PNG: 180x180px (apple-icon.png)
   - PNG: 32x32px (icon-light-32x32.png, icon-dark-32x32.png)
   - SVG: Scalable version (icon.svg)

## Icon Specifications

### Apple Icon (apple-icon.png)
- **Size**: 180x180 pixels
- **Format**: PNG
- **Background**: Transparent or solid color
- **Usage**: iOS Safari, Apple devices

### Favicons (icon-light-32x32.png, icon-dark-32x32.png)
- **Size**: 32x32 pixels
- **Format**: PNG
- **Light version**: For light mode browsers
- **Dark version**: For dark mode browsers

### SVG Icon (icon.svg)
- **Format**: SVG
- **Scalable**: Works at any size
- **Usage**: Modern browsers

## Testing

After replacing icons:

1. **Clear browser cache** (important!):
   - Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   - Or use Incognito/Private mode

2. **Check the favicon**:
   - Open http://localhost:3001
   - Look at the browser tab - should show your new icon

3. **Check Apple icon**:
   - On iOS Safari, add to home screen
   - Should show your custom icon

## Quick Test

```bash
# After replacing icons, rebuild:
make down
make dev

# Then check in browser:
open http://localhost:3001
```

## Notes

- Icons are cached by browsers - you may need to hard refresh (Cmd+Shift+R)
- The `icon.svg` is used as a fallback for modern browsers
- Apple icon is specifically for iOS devices
- All icons should maintain the same visual identity

