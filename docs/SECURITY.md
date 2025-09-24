# Security Policy

## Reporting Security Vulnerabilities

We take security seriously. If you discover a security vulnerability, please report it responsibly:

- **Email**: Create an issue on GitHub with the label "security"
- **Response Time**: We aim to respond within 48 hours
- **Disclosure**: Please allow us time to fix vulnerabilities before public disclosure

## Security Best Practices

### 1. Authentication Token

**CRITICAL**: Always use a secure, randomly generated authentication token:

```bash
# Generate a secure token (32 bytes = 256 bits)
openssl rand -hex 32

# Alternative method using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Never use:**
- Default or example tokens
- Predictable patterns
- Short tokens (< 16 characters)
- Personal information in tokens

### 2. Environment Variables

- Never commit `.env` files to version control
- Use `.env.example` as a template only
- Set `NODE_ENV=production` in production
- Regularly rotate authentication tokens

### 3. Network Security

- Use HTTPS in production (see DOMAIN_SETUP.md)
- Consider IP whitelisting for API access
- Use a reverse proxy (nginx/Apache) for production
- Enable rate limiting and DDoS protection

### 4. Docker Security

- Don't run containers as root user
- Limit container resources (memory, CPU)
- Use specific image tags, not `latest`
- Regularly update base images

### 5. API Security

- Always validate the `token` parameter
- Use HTTPS for all API communications
- Monitor for unusual access patterns
- Log authentication failures

## Known Security Features

HeadlessX includes several security features:

1. **Token-based Authentication**: All API endpoints require authentication
2. **Input Validation**: URLs and parameters are validated
3. **Resource Limits**: Browser instances have timeout controls
4. **Error Handling**: Sensitive information is not exposed in error messages
5. **CORS Protection**: Cross-origin requests are controlled

## Security Checklist for Deployment

- [ ] Generated a secure random token
- [ ] Set `AUTH_TOKEN` environment variable
- [ ] Removed all default/example tokens
- [ ] Configured HTTPS (for production)
- [ ] Set up proper firewall rules
- [ ] Enabled logging and monitoring
- [ ] Tested authentication
- [ ] Updated all dependencies

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Dependencies Security

We recommend regularly updating dependencies:

```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Update all dependencies
npm update
```

## Contact

For security concerns, please create a GitHub issue with the "security" label.