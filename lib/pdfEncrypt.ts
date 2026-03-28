/**
 * Pure client-side PDF encryption using RC4 128-bit encryption
 * Implements PDF Standard encryption (Algorithm 2, 3, and RC4) per PDF specification
 */

// PDF standard padding string (32 bytes)
const PDF_PADDING = new Uint8Array([
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
    0x64, 0x00, 0x4B, 0x49, 0x43, 0x00, 0x41, 0x47,
    0x04, 0xDB, 0xEC, 0xA8, 0x4B, 0xEB, 0x90, 0x91,
    0xCB, 0xB4, 0x56, 0x24, 0xBF, 0x51, 0x32, 0x56
]);

/**
 * RC4 encryption/decryption implementation
 */
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
    const S = new Uint8Array(256);
    for (let i = 0; i < 256; i++) S[i] = i;

    let j = 0;
    for (let i = 0; i < 256; i++) {
        j = (j + S[i] + key[i % key.length]) & 0xFF;
        [S[i], S[j]] = [S[j], S[i]];
    }

    const result = new Uint8Array(data.length);
    let x = 0, y = 0;
    for (let i = 0; i < data.length; i++) {
        x = (x + 1) & 0xFF;
        y = (y + S[x]) & 0xFF;
        [S[x], S[y]] = [S[y], S[x]];
        result[i] = data[i] ^ S[(S[x] + S[y]) & 0xFF];
    }
    return result;
}

/**
 * Simple MD5 implementation for PDF encryption
 */
function md5(input: Uint8Array): Uint8Array {
    // MD5 helper functions
    function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

    function rotateLeft(x: number, n: number) { return (x << n) | (x >>> (32 - n)); }

    function addUnsigned(x: number, y: number) {
        return ((x & 0x7FFFFFFF) + (y & 0x7FFFFFFF)) ^ (x & 0x80000000) ^ (y & 0x80000000);
    }

    function transform(a: number, b: number, c: number, d: number, x: number, s: number, ac: number, func: (x: number, y: number, z: number) => number) {
        a = addUnsigned(a, addUnsigned(addUnsigned(func(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    // Pad message
    const msgLen = input.length;
    const bitLen = msgLen * 8;
    const padLen = ((56 - (msgLen + 1) % 64) + 64) % 64;
    const padded = new Uint8Array(msgLen + 1 + padLen + 8);
    padded.set(input);
    padded[msgLen] = 0x80;

    // Append length (little-endian, 64-bit)
    padded[padded.length - 8] = bitLen & 0xFF;
    padded[padded.length - 7] = (bitLen >>> 8) & 0xFF;
    padded[padded.length - 6] = (bitLen >>> 16) & 0xFF;
    padded[padded.length - 5] = (bitLen >>> 24) & 0xFF;
    // For messages < 2^32 bits, upper 4 bytes are 0

    let a0 = 0x67452301;
    let b0 = 0xEFCDAB89;
    let c0 = 0x98BADCFE;
    let d0 = 0x10325476;

    const view = new DataView(padded.buffer);

    for (let offset = 0; offset < padded.length; offset += 64) {
        const M = new Array(16);
        for (let j = 0; j < 16; j++) {
            M[j] = view.getUint32(offset + j * 4, true);
        }

        let a = a0, b = b0, c = c0, d = d0;

        // Round 1
        a = transform(a, b, c, d, M[0], 7, 0xD76AA478, F);
        d = transform(d, a, b, c, M[1], 12, 0xE8C7B756, F);
        c = transform(c, d, a, b, M[2], 17, 0x242070DB, F);
        b = transform(b, c, d, a, M[3], 22, 0xC1BDCEEE, F);
        a = transform(a, b, c, d, M[4], 7, 0xF57C0FAF, F);
        d = transform(d, a, b, c, M[5], 12, 0x4787C62A, F);
        c = transform(c, d, a, b, M[6], 17, 0xA8304613, F);
        b = transform(b, c, d, a, M[7], 22, 0xFD469501, F);
        a = transform(a, b, c, d, M[8], 7, 0x698098D8, F);
        d = transform(d, a, b, c, M[9], 12, 0x8B44F7AF, F);
        c = transform(c, d, a, b, M[10], 17, 0xFFFF5BB1, F);
        b = transform(b, c, d, a, M[11], 22, 0x895CD7BE, F);
        a = transform(a, b, c, d, M[12], 7, 0x6B901122, F);
        d = transform(d, a, b, c, M[13], 12, 0xFD987193, F);
        c = transform(c, d, a, b, M[14], 17, 0xA679438E, F);
        b = transform(b, c, d, a, M[15], 22, 0x49B40821, F);

        // Round 2
        a = transform(a, b, c, d, M[1], 5, 0xF61E2562, G);
        d = transform(d, a, b, c, M[6], 9, 0xC040B340, G);
        c = transform(c, d, a, b, M[11], 14, 0x265E5A51, G);
        b = transform(b, c, d, a, M[0], 20, 0xE9B6C7AA, G);
        a = transform(a, b, c, d, M[5], 5, 0xD62F105D, G);
        d = transform(d, a, b, c, M[10], 9, 0x02441453, G);
        c = transform(c, d, a, b, M[15], 14, 0xD8A1E681, G);
        b = transform(b, c, d, a, M[4], 20, 0xE7D3FBC8, G);
        a = transform(a, b, c, d, M[9], 5, 0x21E1CDE6, G);
        d = transform(d, a, b, c, M[14], 9, 0xC33707D6, G);
        c = transform(c, d, a, b, M[3], 14, 0xF4D50D87, G);
        b = transform(b, c, d, a, M[8], 20, 0x455A14ED, G);
        a = transform(a, b, c, d, M[13], 5, 0xA9E3E905, G);
        d = transform(d, a, b, c, M[2], 9, 0xFCEFA3F8, G);
        c = transform(c, d, a, b, M[7], 14, 0x676F02D9, G);
        b = transform(b, c, d, a, M[12], 20, 0x8D2A4C8A, G);

        // Round 3
        a = transform(a, b, c, d, M[5], 4, 0xFFFA3942, H);
        d = transform(d, a, b, c, M[8], 11, 0x8771F681, H);
        c = transform(c, d, a, b, M[11], 16, 0x6D9D6122, H);
        b = transform(b, c, d, a, M[14], 23, 0xFDE5380C, H);
        a = transform(a, b, c, d, M[1], 4, 0xA4BEEA44, H);
        d = transform(d, a, b, c, M[4], 11, 0x4BDECFA9, H);
        c = transform(c, d, a, b, M[7], 16, 0xF6BB4B60, H);
        b = transform(b, c, d, a, M[10], 23, 0xBEBFBC70, H);
        a = transform(a, b, c, d, M[13], 4, 0x289B7EC6, H);
        d = transform(d, a, b, c, M[0], 11, 0xEAA127FA, H);
        c = transform(c, d, a, b, M[3], 16, 0xD4EF3085, H);
        b = transform(b, c, d, a, M[6], 23, 0x04881D05, H);
        a = transform(a, b, c, d, M[9], 4, 0xD9D4D039, H);
        d = transform(d, a, b, c, M[12], 11, 0xE6DB99E5, H);
        c = transform(c, d, a, b, M[15], 16, 0x1FA27CF8, H);
        b = transform(b, c, d, a, M[2], 23, 0xC4AC5665, H);

        // Round 4
        a = transform(a, b, c, d, M[0], 6, 0xF4292244, I);
        d = transform(d, a, b, c, M[7], 10, 0x432AFF97, I);
        c = transform(c, d, a, b, M[14], 15, 0xAB9423A7, I);
        b = transform(b, c, d, a, M[5], 21, 0xFC93A039, I);
        a = transform(a, b, c, d, M[12], 6, 0x655B59C3, I);
        d = transform(d, a, b, c, M[3], 10, 0x8F0CCC92, I);
        c = transform(c, d, a, b, M[10], 15, 0xFFEFF47D, I);
        b = transform(b, c, d, a, M[1], 21, 0x85845DD1, I);
        a = transform(a, b, c, d, M[8], 6, 0x6FA87E4F, I);
        d = transform(d, a, b, c, M[15], 10, 0xFE2CE6E0, I);
        c = transform(c, d, a, b, M[6], 15, 0xA3014314, I);
        b = transform(b, c, d, a, M[13], 21, 0x4E0811A1, I);
        a = transform(a, b, c, d, M[4], 6, 0xF7537E82, I);
        d = transform(d, a, b, c, M[11], 10, 0xBD3AF235, I);
        c = transform(c, d, a, b, M[2], 15, 0x2AD7D2BB, I);
        b = transform(b, c, d, a, M[9], 21, 0xEB86D391, I);

        a0 = addUnsigned(a0, a);
        b0 = addUnsigned(b0, b);
        c0 = addUnsigned(c0, c);
        d0 = addUnsigned(d0, d);
    }

    const result = new Uint8Array(16);
    const dv = new DataView(result.buffer);
    dv.setUint32(0, a0, true);
    dv.setUint32(4, b0, true);
    dv.setUint32(8, c0, true);
    dv.setUint32(12, d0, true);
    return result;
}

/**
 * Pad password to 32 bytes using PDF standard padding
 */
function padPassword(password: string): Uint8Array {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const padded = new Uint8Array(32);

    const copyLen = Math.min(passwordBytes.length, 32);
    padded.set(passwordBytes.subarray(0, copyLen));

    if (copyLen < 32) {
        padded.set(PDF_PADDING.subarray(0, 32 - copyLen), copyLen);
    }

    return padded;
}

/**
 * Compute encryption key (Algorithm 2 from PDF spec)
 * For 128-bit RC4 encryption (revision 3)
 */
function computeEncryptionKey(
    paddedUserPassword: Uint8Array,
    ownerPasswordHash: Uint8Array,
    permissions: number,
    fileId: Uint8Array,
    keyLength: number = 16 // 128 bits = 16 bytes
): Uint8Array {
    // Step a: Already padded
    // Step b: Init MD5 hash with padded password
    const hashInput = new Uint8Array(
        paddedUserPassword.length + ownerPasswordHash.length + 4 + fileId.length
    );

    let offset = 0;
    hashInput.set(paddedUserPassword, offset); offset += paddedUserPassword.length;
    hashInput.set(ownerPasswordHash, offset); offset += ownerPasswordHash.length;

    // Step d: Append permissions (little-endian 4 bytes)
    hashInput[offset++] = permissions & 0xFF;
    hashInput[offset++] = (permissions >> 8) & 0xFF;
    hashInput[offset++] = (permissions >> 16) & 0xFF;
    hashInput[offset++] = (permissions >> 24) & 0xFF;

    // Step e: Append file ID
    hashInput.set(fileId, offset);

    let hash = md5(hashInput);

    // Step h: For revision 3+, do 50 additional iterations
    for (let i = 0; i < 50; i++) {
        hash = md5(hash.subarray(0, keyLength));
    }

    return hash.subarray(0, keyLength);
}

/**
 * Compute O (owner) value (Algorithm 3 from PDF spec, revision 3)
 */
function computeOwnerValue(
    ownerPassword: string,
    userPassword: string,
    keyLength: number = 16
): Uint8Array {
    const paddedOwner = padPassword(ownerPassword);

    let hash = md5(paddedOwner);

    // For revision 3, do 50 additional iterations
    for (let i = 0; i < 50; i++) {
        hash = md5(hash.subarray(0, keyLength));
    }

    const key = hash.subarray(0, keyLength);
    const paddedUser = padPassword(userPassword);

    // Encrypt padded user password with RC4
    let result = rc4(key, paddedUser);

    // For revision 3, do 19 additional iterations
    for (let i = 1; i <= 19; i++) {
        const newKey = new Uint8Array(key.length);
        for (let j = 0; j < key.length; j++) {
            newKey[j] = key[j] ^ i;
        }
        result = rc4(newKey, result);
    }

    return result;
}

/**
 * Compute U (user) value (Algorithm 5 from PDF spec, revision 3)
 */
function computeUserValue(
    encryptionKey: Uint8Array,
    fileId: Uint8Array
): Uint8Array {
    // Step a: Create MD5 hash of padding + file ID
    const hashInput = new Uint8Array(PDF_PADDING.length + fileId.length);
    hashInput.set(PDF_PADDING);
    hashInput.set(fileId, PDF_PADDING.length);

    let hash = md5(hashInput);

    // Step b: Encrypt hash with RC4 using encryption key
    let result = rc4(encryptionKey, hash);

    // Step c: Do 19 additional iterations
    for (let i = 1; i <= 19; i++) {
        const newKey = new Uint8Array(encryptionKey.length);
        for (let j = 0; j < encryptionKey.length; j++) {
            newKey[j] = encryptionKey[j] ^ i;
        }
        result = rc4(newKey, result);
    }

    // Pad to 32 bytes
    const padded = new Uint8Array(32);
    padded.set(result);
    // Fill rest with arbitrary padding
    for (let i = result.length; i < 32; i++) {
        padded[i] = 0;
    }

    return padded;
}

/**
 * Generate a random file ID (16 bytes)
 */
function generateFileId(): Uint8Array {
    const id = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(id);
    } else {
        for (let i = 0; i < 16; i++) {
            id[i] = Math.floor(Math.random() * 256);
        }
    }
    return id;
}

/**
 * Convert Uint8Array to hex string
 */
function toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt a PDF's stream/string object data with object-specific key
 */
function computeObjectKey(
    encryptionKey: Uint8Array,
    objectNumber: number,
    generationNumber: number
): Uint8Array {
    const keyInput = new Uint8Array(encryptionKey.length + 5);
    keyInput.set(encryptionKey);

    const offset = encryptionKey.length;
    keyInput[offset] = objectNumber & 0xFF;
    keyInput[offset + 1] = (objectNumber >> 8) & 0xFF;
    keyInput[offset + 2] = (objectNumber >> 16) & 0xFF;
    keyInput[offset + 3] = generationNumber & 0xFF;
    keyInput[offset + 4] = (generationNumber >> 8) & 0xFF;

    const hash = md5(keyInput);
    const keyLen = Math.min(encryptionKey.length + 5, 16);
    return hash.subarray(0, keyLen);
}

// ─── PDF Binary Manipulation ─────────────────────────────────────────

/**
 * Parse a PDF to find cross-reference table, objects, and trailer
 */
interface PDFObject {
    objectNumber: number
    generationNumber: number
    startOffset: number
    endOffset: number
    streamStart: number | null
    streamEnd: number | null
}

function findString(data: Uint8Array, searchStr: string, startFrom: number = 0): number {
    const searchBytes = new TextEncoder().encode(searchStr);
    for (let i = startFrom; i <= data.length - searchBytes.length; i++) {
        let found = true;
        for (let j = 0; j < searchBytes.length; j++) {
            if (data[i + j] !== searchBytes[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}

function findStringReverse(data: Uint8Array, searchStr: string): number {
    const searchBytes = new TextEncoder().encode(searchStr);
    for (let i = data.length - searchBytes.length; i >= 0; i--) {
        let found = true;
        for (let j = 0; j < searchBytes.length; j++) {
            if (data[i + j] !== searchBytes[j]) {
                found = false;
                break;
            }
        }
        if (found) return i;
    }
    return -1;
}

/**
 * Encrypt PDF bytes with password protection
 * This is the main function to call from outside
 */
export async function encryptPDF(pdfBytes: Uint8Array, userPassword: string, ownerPassword?: string): Promise<Uint8Array> {
    const ownerPwd = ownerPassword || userPassword;

    // Permissions: Allow printing and everything except modifying
    // -4 means: all permissions (0xFFFFFFFF) minus modification restrictions
    // For simplicity: allow all but require password to open
    const permissions = -3904; // 0xFFFFF0C0 - standard restrictive permissions

    const fileId = generateFileId();

    // Compute O value
    const oValue = computeOwnerValue(ownerPwd, userPassword, 16);

    // Compute encryption key
    const paddedUserPwd = padPassword(userPassword);
    const encryptionKey = computeEncryptionKey(paddedUserPwd, oValue, permissions, fileId, 16);

    // Compute U value
    const uValue = computeUserValue(encryptionKey, fileId);

    // Now we need to parse and re-write the PDF with encryption
    return rewritePDFWithEncryption(pdfBytes, encryptionKey, oValue, uValue, fileId, permissions);
}

/**
 * Rewrite PDF binary data to add encryption
 */
function rewritePDFWithEncryption(
    pdfBytes: Uint8Array,
    encryptionKey: Uint8Array,
    oValue: Uint8Array,
    uValue: Uint8Array,
    fileId: Uint8Array,
    permissions: number
): Uint8Array {
    const decoder = new TextDecoder('latin1');
    const pdfString = decoder.decode(pdfBytes);

    // Parse all objects
    const objects = parseObjects(pdfString);

    // Build the encrypted PDF
    const parts: Uint8Array[] = [];
    const encoder = new TextEncoder();

    // PDF header
    const headerEnd = pdfString.indexOf('\n', pdfString.indexOf('%PDF-')) + 1;
    parts.push(pdfBytes.subarray(0, headerEnd));
    // Add binary marker
    parts.push(encoder.encode('%\xE2\xE3\xCF\xD3\n'));

    // Track new offsets for xref
    const objectOffsets: Map<number, number> = new Map();
    let currentOffset = headerEnd + 5; // account for binary marker

    // Re-write each object, encrypting streams and strings
    for (const obj of objects) {
        objectOffsets.set(obj.objectNumber, currentOffset);

        const objHeader = `${obj.objectNumber} ${obj.generationNumber} obj\n`;
        const objFooter = `\nendobj\n`;

        // Get original object content (between "obj" and "endobj")
        const objStartStr = `${obj.objectNumber} ${obj.generationNumber} obj`;
        let startIdx = pdfString.indexOf(objStartStr, obj.startOffset);
        if (startIdx === -1) startIdx = obj.startOffset;

        const contentStart = pdfString.indexOf('obj', startIdx) + 3;
        const endObjIdx = findEndObj(pdfString, contentStart);

        if (endObjIdx === -1) continue;

        let objectContent = pdfString.substring(contentStart, endObjIdx).trim();

        // Check if it has a stream
        const streamIdx = objectContent.indexOf('stream');

        if (streamIdx !== -1) {
            // Object has a stream - encrypt it
            const dictPart = objectContent.substring(0, streamIdx).trim();

            // Find stream data boundaries
            let streamDataStart = streamIdx + 6; // 'stream'.length
            if (objectContent[streamDataStart] === '\r') streamDataStart++;
            if (objectContent[streamDataStart] === '\n') streamDataStart++;

            const endstreamIdx = objectContent.lastIndexOf('endstream');
            if (endstreamIdx === -1) {
                // No endstream found, write object as-is
                const objData = encoder.encode(objHeader + objectContent + objFooter);
                parts.push(objData);
                currentOffset += objData.length;
                continue;
            }

            let streamDataEnd = endstreamIdx;
            if (objectContent[streamDataEnd - 1] === '\n') streamDataEnd--;
            if (objectContent[streamDataEnd - 1] === '\r') streamDataEnd--;

            // Get raw stream bytes from original PDF
            const absStreamStart = contentStart + streamDataStart;
            const absStreamEnd = contentStart + streamDataEnd;
            const streamData = pdfBytes.subarray(absStreamStart, absStreamEnd);

            // Compute object key and encrypt stream
            const objKey = computeObjectKey(encryptionKey, obj.objectNumber, obj.generationNumber);
            const encryptedStream = rc4(objKey, streamData);

            // Update Length in dictionary
            const updatedDict = updateStreamLength(dictPart, encryptedStream.length);

            // Write encrypted object
            const headerBytes = encoder.encode(objHeader + updatedDict + '\nstream\n');
            const footerBytes = encoder.encode('\nendstream' + objFooter);

            parts.push(headerBytes);
            parts.push(encryptedStream);
            parts.push(footerBytes);

            currentOffset += headerBytes.length + encryptedStream.length + footerBytes.length;
        } else {
            // Object without stream - encrypt string literals
            const encryptedContent = encryptStringsInObject(
                objectContent, encryptionKey, obj.objectNumber, obj.generationNumber
            );

            const objData = encoder.encode(objHeader + encryptedContent + objFooter);
            parts.push(objData);
            currentOffset += objData.length;
        }
    }

    // Find the maximum object number for the encrypt dict
    let maxObjNum = 0;
    for (const obj of objects) {
        if (obj.objectNumber > maxObjNum) maxObjNum = obj.objectNumber;
    }

    // Add encryption dictionary as new object
    const encryptObjNum = maxObjNum + 1;
    objectOffsets.set(encryptObjNum, currentOffset);

    const encryptDict = buildEncryptDictionary(encryptObjNum, oValue, uValue, permissions);
    const encryptDictBytes = encoder.encode(encryptDict);
    parts.push(encryptDictBytes);
    currentOffset += encryptDictBytes.length;

    // Write xref table
    const xrefOffset = currentOffset;
    const xrefEntries = buildXrefTable(objectOffsets, maxObjNum + 1);
    const xrefBytes = encoder.encode(xrefEntries);
    parts.push(xrefBytes);
    currentOffset += xrefBytes.length;

    // Write trailer
    const totalObjects = maxObjNum + 2; // +1 for encrypt obj, +1 for object 0
    const trailer = buildTrailer(totalObjects, encryptObjNum, fileId, objects, pdfString);
    const trailerBytes = encoder.encode(trailer);
    parts.push(trailerBytes);
    currentOffset += trailerBytes.length;

    // Write startxref
    const startxref = `startxref\n${xrefOffset}\n%%EOF\n`;
    parts.push(encoder.encode(startxref));

    // Concatenate all parts
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (const part of parts) {
        result.set(part, pos);
        pos += part.length;
    }

    return result;
}

function parseObjects(pdfString: string): PDFObject[] {
    const objects: PDFObject[] = [];
    const regex = /(\d+)\s+(\d+)\s+obj/g;
    let match;

    while ((match = regex.exec(pdfString)) !== null) {
        const objectNumber = parseInt(match[1]);
        const generationNumber = parseInt(match[2]);
        const startOffset = match.index;

        const endObjIdx = findEndObj(pdfString, match.index + match[0].length);
        if (endObjIdx === -1) continue;

        const endOffset = endObjIdx + 6; // 'endobj'.length

        // Check for stream
        const contentBetween = pdfString.substring(match.index + match[0].length, endOffset);
        const streamIdx = contentBetween.indexOf('stream');

        let streamStart: number | null = null;
        let streamEnd: number | null = null;

        if (streamIdx !== -1) {
            const absStreamIdx = match.index + match[0].length + streamIdx;
            streamStart = absStreamIdx;
            const endstreamIdx = contentBetween.indexOf('endstream');
            if (endstreamIdx !== -1) {
                streamEnd = match.index + match[0].length + endstreamIdx;
            }
        }

        objects.push({
            objectNumber,
            generationNumber,
            startOffset,
            endOffset,
            streamStart,
            streamEnd
        });
    }

    return objects;
}

function findEndObj(pdfString: string, startFrom: number): number {
    // Find the matching endobj, accounting for nested objects
    let depth = 0;
    let i = startFrom;

    while (i < pdfString.length - 6) {
        if (pdfString.substring(i, i + 6) === 'endobj') {
            if (depth === 0) return i;
            depth--;
        }
        // Check for nested obj declarations (rare but possible)
        const nextNewline = pdfString.indexOf('\n', i);
        if (nextNewline === -1) break;
        i = nextNewline + 1;
    }

    // Fallback: simple search
    const idx = pdfString.indexOf('endobj', startFrom);
    return idx;
}

function updateStreamLength(dict: string, newLength: number): string {
    // Update /Length value in dictionary
    const lengthMatch = dict.match(/\/Length\s+(\d+)/);
    if (lengthMatch) {
        return dict.replace(/\/Length\s+\d+/, `/Length ${newLength}`);
    }
    // Also handle /Length as indirect reference
    const indirectMatch = dict.match(/\/Length\s+(\d+)\s+(\d+)\s+R/);
    if (indirectMatch) {
        // Replace indirect reference with direct value
        return dict.replace(/\/Length\s+\d+\s+\d+\s+R/, `/Length ${newLength}`);
    }

    // Add /Length if missing
    if (dict.includes('<<')) {
        return dict.replace('<<', `<< /Length ${newLength}`);
    }
    return dict;
}

function encryptStringsInObject(
    content: string,
    encryptionKey: Uint8Array,
    objectNumber: number,
    generationNumber: number
): string {
    const objKey = computeObjectKey(encryptionKey, objectNumber, generationNumber);

    // Encrypt parenthesized string literals
    let result = '';
    let i = 0;
    let depth = 0;

    while (i < content.length) {
        if (content[i] === '(' && (i === 0 || content[i - 1] !== '\\')) {
            // Find matching closing paren
            let parenDepth = 1;
            let j = i + 1;
            while (j < content.length && parenDepth > 0) {
                if (content[j] === '(' && content[j - 1] !== '\\') parenDepth++;
                else if (content[j] === ')' && content[j - 1] !== '\\') parenDepth--;
                j++;
            }

            // Extract string content
            const strContent = content.substring(i + 1, j - 1);
            const strBytes = new TextEncoder().encode(strContent);
            const encrypted = rc4(objKey, strBytes);

            // Convert to hex string
            result += '<' + toHex(encrypted) + '>';
            i = j;
        } else {
            result += content[i];
            i++;
        }
    }

    return result;
}

function buildEncryptDictionary(
    objNum: number,
    oValue: Uint8Array,
    uValue: Uint8Array,
    permissions: number
): string {
    const oHex = toHex(oValue);
    const uHex = toHex(uValue);

    return `${objNum} 0 obj\n` +
        `<<\n` +
        `  /Type /Encrypt\n` +
        `  /Filter /Standard\n` +
        `  /V 2\n` +
        `  /R 3\n` +
        `  /Length 128\n` +
        `  /P ${permissions}\n` +
        `  /O <${oHex}>\n` +
        `  /U <${uHex}>\n` +
        `>>\n` +
        `endobj\n`;
}

function buildXrefTable(offsets: Map<number, number>, maxObjNum: number): string {
    let xref = 'xref\n';
    xref += `0 ${maxObjNum + 1}\n`;

    // Object 0 (free)
    xref += '0000000000 65535 f \n';

    for (let i = 1; i <= maxObjNum; i++) {
        const offset = offsets.get(i);
        if (offset !== undefined) {
            xref += offset.toString().padStart(10, '0') + ' 00000 n \n';
        } else {
            xref += '0000000000 00000 f \n';
        }
    }

    return xref;
}

function buildTrailer(
    size: number,
    encryptObjNum: number,
    fileId: Uint8Array,
    objects: PDFObject[],
    pdfString: string
): string {
    // Find the original Root reference
    const rootMatch = pdfString.match(/\/Root\s+(\d+)\s+(\d+)\s+R/);
    const rootRef = rootMatch ? `${rootMatch[1]} ${rootMatch[2]} R` : '1 0 R';

    // Find the original Info reference (optional)
    const infoMatch = pdfString.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
    const infoRef = infoMatch ? `\n  /Info ${infoMatch[1]} ${infoMatch[2]} R` : '';

    const fileIdHex = toHex(fileId);

    return `trailer\n` +
        `<<\n` +
        `  /Size ${size}\n` +
        `  /Root ${rootRef}\n` +
        `  /Encrypt ${encryptObjNum} 0 R${infoRef}\n` +
        `  /ID [<${fileIdHex}> <${fileIdHex}>]\n` +
        `>>\n`;
}
