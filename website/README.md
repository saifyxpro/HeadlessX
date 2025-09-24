# Official landing page for HeadlessX v1.3.0 - Advanced Anti-Detection Web Scraping APIeadlessX Website

Official landing page for HeadlessX v1.2.0 - Advanced Browserless Web Scraping API

## 🚀 Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Responsive Design** for all devices
- **SEO Optimized** for search engines

## 🏗️ Project Structure

```
website/
├── app/
│   ├── globals.css          # Global styles and Tailwind
│   ├── layout.tsx           # Root layout with metadata
│   └── page.tsx             # Main landing page
├── package.json             # Dependencies and scripts
├── next.config.js           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

```bash
# Navigate to website directory
cd website

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

The website supports build-time environment variables for domain configuration:

**Required for custom domains:**
- `NEXT_PUBLIC_DOMAIN` - Your domain (e.g., "yourdomain.com")
- `NEXT_PUBLIC_SUBDOMAIN` - Your subdomain (e.g., "headlessx")

**Optional:**
- `NEXT_PUBLIC_API_URL` - Full API URL (auto-generated if not provided)
- `NEXT_PUBLIC_SITE_URL` - Full site URL (auto-generated if not provided)

**Setup:**
1. Copy environment template: `cp .env.example .env.local`
2. Update `.env.local` with your domain configuration
3. Build the website: `npm run build`

## 🌐 Deployment

### Static Export (Recommended)

```bash
# Build and export static files
npm run build

# Files will be generated in 'out' directory
# Upload 'out' directory to your web server
```

### Domain Configuration

1. Point your domain `your-subdomain.yourdomain.com` to your web server
2. Configure environment variables in `.env.local` (see Environment Variables section)
3. Build the website with domain configuration: `npm run build`
4. Upload the built files to your server's web directory
5. Configure nginx or your web server to serve the static files

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-subdomain.yourdomain.com;
    
    root /var/www/headlessx-website;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🎨 Customization

### Colors
Modify the color scheme in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    // Your brand colors
  }
}
```

### Content
Edit the main content in `app/page.tsx`:

- Hero section text
- Feature descriptions
- API endpoint information
- Company information

### Styling
Global styles are in `app/globals.css`. Use Tailwind classes for component styling.

## 📱 Features Included

### Hero Section
- Animated gradient background
- Quick start code snippet with copy functionality
- Call-to-action buttons

### Stats Section
- Real-time performance metrics
- Success rates and uptime statistics

### Features Showcase
- Interactive feature cards
- Animated hover effects
- Comprehensive feature descriptions

### API Documentation Preview
- Endpoint listing with methods
- Clean, developer-friendly interface

### Technology Stack Display
- Technology logos and descriptions
- Enterprise-grade positioning

### Call-to-Action
- Multiple conversion points
- Clear next steps for users

## 🔧 Technical Details

### Performance Optimizations
- Static generation for fast loading
- Image optimization
- CSS and JS minification
- Lazy loading where appropriate

### SEO Features
- Meta tags optimization
- Open Graph tags
- Twitter Card tags
- Structured data ready

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- WCAG 2.1 compliant

## 📊 Analytics Integration

Ready for analytics integration. Add your tracking code to `app/layout.tsx`:

```typescript
// Add Google Analytics, etc.
```

## 🚀 Production Checklist

- [ ] Update domain in metadata
- [ ] Configure analytics
- [ ] Set up SSL certificate
- [ ] Configure web server
- [ ] Test all links and functionality
- [ ] Verify mobile responsiveness
- [ ] Check SEO tags
- [ ] Test loading performance

## 🤝 Support

For technical support or customization requests, contact SaifyXPRO.

---

*Built with ❤️ for HeadlessX v1.3.0*