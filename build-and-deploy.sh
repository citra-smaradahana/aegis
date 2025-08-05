#!/bin/bash

echo "🚀 Building AEGIS KMB PWA..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Create icons if they don't exist
    echo "🎨 Generating PWA icons..."
    if [ ! -f "dist/icon-192x192.png" ]; then
        echo "⚠️  Please generate PWA icons using the icon-generator.html file"
        echo "   Open public/icon-generator.html in your browser and download the icons"
        echo "   Then place them in the dist/ directory"
    fi
    
    # Copy service worker to dist
    echo "📋 Copying service worker..."
    cp public/sw.js dist/
    cp public/manifest.json dist/
    
    echo "🎉 PWA build complete!"
    echo "📁 Build files are in the 'dist' directory"
    echo ""
    echo "📱 To test the PWA:"
    echo "   1. Serve the dist directory: npx serve dist"
    echo "   2. Open in browser and check 'Install' option"
    echo ""
    echo "🌐 To deploy:"
    echo "   1. Upload dist/ contents to your hosting provider"
    echo "   2. Ensure HTTPS is enabled"
    echo "   3. Test PWA installation"
    
else
    echo "❌ Build failed!"
    exit 1
fi 