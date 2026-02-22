# LibreOffice Setup for PowerPoint to PDF Conversion

This document explains how to install and configure LibreOffice for server-side PowerPoint to PDF conversion.

## What is LibreOffice?

LibreOffice is a free, open-source office suite that can convert PowerPoint files to PDF while preserving all formatting, shapes, charts, tables, backgrounds, and themes.

## Installation

### Ubuntu/Debian Linux

```bash
sudo apt-get update
sudo apt-get install -y libreoffice libreoffice-impress
```

### CentOS/RHEL/Fedora

```bash
sudo yum install -y libreoffice libreoffice-impress
```

### macOS (using Homebrew)

```bash
brew install --cask libreoffice
```

### Windows

Download and install from: https://www.libreoffice.org/download/download/

## Verify Installation

After installation, verify LibreOffice is available:

```bash
soffice --version
```

You should see output like: `LibreOffice 7.x.x.x`

## How It Works

The PowerPoint to PDF conversion uses LibreOffice in headless mode:

```bash
soffice --headless --convert-to pdf --outdir /output /input/file.pptx
```

This command:
- Runs LibreOffice without a GUI (`--headless`)
- Converts the file to PDF format (`--convert-to pdf`)
- Saves the output to a specified directory (`--outdir`)
- Renders each slide as a complete visual image with all elements

## Deployment Considerations

### Vercel/Netlify
- These platforms don't support custom system packages
- You'll need to use a different hosting solution or a conversion API

### Docker
Add to your Dockerfile:
```dockerfile
RUN apt-get update && apt-get install -y libreoffice libreoffice-impress
```

### VPS/Dedicated Server
Install LibreOffice using the commands above for your OS

### Alternative: Use a Conversion API
If you can't install LibreOffice on your hosting platform, consider:
- CloudConvert API
- Aspose.Slides Cloud API
- Microsoft Graph API (requires Microsoft 365)

## Testing

Test the conversion manually:

```bash
# Create a test PPTX file or use an existing one
soffice --headless --convert-to pdf --outdir /tmp /path/to/test.pptx

# Check if PDF was created
ls -lh /tmp/test.pdf
```

## Troubleshooting

### "soffice: command not found"
- LibreOffice is not installed or not in PATH
- Install using the commands above

### Permission errors
- Ensure the Node.js process has write permissions to the temp directory
- Check file ownership and permissions

### Conversion fails silently
- Check LibreOffice logs: `~/.libreoffice/`
- Ensure the PPTX file is valid and not corrupted

### Timeout errors
- Large PPTX files may take longer to convert
- Increase the timeout in the API route (currently 60 seconds)

## Performance

- Conversion time depends on slide count and complexity
- Typical conversion: 1-5 seconds for 10-20 slides
- Consider implementing a queue system for high-traffic applications
