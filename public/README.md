# Static Assets

## Logo Setup Instructions

### Step 1: Save Your Mascot Image
1. Save the blue bird mascot image you provided as `firebird-mascot.png` in this `/public` directory
2. The image should be:
   - High resolution (at least 512x512px recommended)
   - PNG format with transparent background preferred
   - Properly cropped with the mascot centered

### Step 2: Image Requirements
- **File name**: Must be exactly `firebird-mascot.png`
- **Location**: `/public/firebird-mascot.png`
- **Format**: PNG (preferred) or JPG
- **Size**: Optimized for web (under 500KB if possible)

### Step 3: Verification
Once you add the image:
1. Run `npm run dev`
2. Check that the logo appears on:
   - Login page (large size)
   - Dashboard header (medium size)  
   - Profile page (medium size)

### Current Status
✅ FirebirdLogo component updated to use the new image
⏳ Waiting for `firebird-mascot.png` to be added to this directory

The component will automatically use your mascot image once it's placed in the correct location!
