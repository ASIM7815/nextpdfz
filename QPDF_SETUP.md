# QPDF Setup Instructions

The "Protect PDF" feature requires `qpdf` to be installed on your server.

## Installation

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install qpdf
```

### macOS
```bash
brew install qpdf
```

### CentOS/RHEL
```bash
sudo yum install qpdf
```

### Vercel/Netlify Deployment

For serverless deployments, you need to include qpdf as a binary:

1. **Vercel**: Add to `vercel.json`:
```json
{
  "functions": {
    "app/api/protect-pdf/route.ts": {
      "includeFiles": "bin/qpdf"
    }
  }
}
```

2. Download qpdf binary and place in `bin/` folder
3. Update the API route to use the local binary

### Docker
If using Docker, add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y qpdf
```

## Verify Installation

Run this command to verify qpdf is installed:
```bash
qpdf --version
```

## How It Works

1. User uploads PDF and enters password
2. File is sent to `/api/protect-pdf` endpoint
3. Server uses qpdf to encrypt the PDF with 256-bit AES encryption
4. Encrypted PDF is returned to user
5. PDF now requires password to open

## Security Notes

- Passwords are not stored anywhere
- Temporary files are deleted immediately after processing
- Uses industry-standard 256-bit AES encryption
- Both user and owner passwords are set to the same value
