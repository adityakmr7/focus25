# Flowzy Documentation Site

This directory contains the GitHub Pages documentation website for Flowzy, including Terms of Service, Privacy Policy, and Help & Support pages.

## 🚀 Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "Deploy from a branch"
4. Choose "main" branch and "/docs" folder
5. Click "Save"

Your site will be available at: `https://[username].github.io/[repository-name]`

### 2. Update Configuration
Edit `_config.yml` and update:
- `url`: Your GitHub Pages URL
- `baseurl`: Your repository name
- `github_username`: Your GitHub username
- Contact information and social media links

### 3. Customize Content
Update the following files with your specific information:
- **index.html**: Main landing page with app features and download links
- **privacy.html**: Privacy Policy (update contact information and legal details)
- **terms.html**: Terms of Service (update company information and jurisdiction)
- **help.html**: Help & Support documentation

## 📁 File Structure

```
docs/
├── index.html          # Main landing page
├── privacy.html        # Privacy Policy
├── terms.html          # Terms of Service
├── help.html           # Help & Support Center
├── styles.css          # Main stylesheet
├── script.js           # JavaScript functionality
├── _config.yml         # GitHub Pages configuration
└── README.md           # This file
```

## 🎨 Customization

### Styling
- Main styles are in `styles.css`
- Responsive design included for mobile devices
- Color scheme uses modern blues and clean typography
- Easy to customize CSS variables at the top of the file

### Content Updates
1. **App Store Links**: Update download buttons in `index.html` when your app is published
2. **Contact Information**: Update email addresses throughout all files
3. **Company Information**: Update legal entity information in Terms and Privacy Policy
4. **Feature Descriptions**: Customize the features section to match your app's capabilities

### Images
- Update logo and app screenshot URLs in HTML files
- Current links point to GitHub repository assets
- Consider hosting images in the `docs/` directory for faster loading

## 🔧 Technical Features

- **Responsive Design**: Works on all device sizes
- **Accessibility**: Keyboard navigation support and semantic HTML
- **SEO Optimized**: Meta tags, structured data, and semantic markup
- **Performance**: Optimized CSS and JavaScript with minimal dependencies
- **Analytics Ready**: Easy integration with Google Analytics

## 📱 App Store Requirements

This documentation site includes all the legal pages typically required for app store submissions:

- ✅ **Privacy Policy**: Comprehensive privacy policy covering data collection and use
- ✅ **Terms of Service**: Complete terms and conditions for app usage
- ✅ **Support Contact**: Multiple ways for users to get help and report issues

## 🚀 Deployment

The site will automatically deploy when you:
1. Enable GitHub Pages in repository settings
2. Push changes to the main branch
3. Wait 1-2 minutes for GitHub to build and deploy

## 📊 Monitoring

After deployment, you can:
- Monitor site performance in GitHub repository Insights
- Add Google Analytics for visitor tracking
- Use GitHub Issues for user feedback and support requests

## 🔗 Integration with App

Link to these pages from your mobile app:
- Privacy Policy: `https://[username].github.io/[repo-name]/privacy.html`
- Terms of Service: `https://[username].github.io/[repo-name]/terms.html`
- Help & Support: `https://[username].github.io/[repo-name]/help.html`

## 📝 Legal Compliance

**Important**: This documentation provides template legal content. You should:
1. Review all legal documents with a qualified attorney
2. Update jurisdiction and company information
3. Ensure compliance with applicable laws (GDPR, CCPA, etc.)
4. Regularly review and update policies as your app evolves

## 🤝 Support

For questions about this documentation setup:
- Check GitHub Pages documentation
- Review Jekyll documentation for advanced customization
- Create issues in your repository for specific problems

---

**Ready to launch?** Your Flowzy documentation site is ready for GitHub Pages deployment! 🎉