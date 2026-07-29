/**
 * Web Crypto API AES-256-GCM Encryption Engine for AetherDrive Vault
 */

async function getPassphraseKey(passphrase, salt) {
  const enc = new TextEncoder();
  const passphraseKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passphraseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a File or Blob with AES-256-GCM using user passphrase
 */
export async function encryptBlob(blob, passphrase) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await getPassphraseKey(passphrase, salt);
  const fileArrayBuffer = await blob.arrayBuffer();

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    fileArrayBuffer
  );

  // Combine Salt (16B) + IV (12B) + Encrypted Payload into a single ArrayBuffer
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

  return new Blob([combined], { type: 'application/octet-stream' });
}

/**
 * Decrypts an encrypted Blob back into original binary Blob
 */
export async function decryptBlob(encryptedBlob, originalMimeType, passphrase) {
  const combinedArrayBuffer = await encryptedBlob.arrayBuffer();
  const combined = new Uint8Array(combinedArrayBuffer);

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const key = await getPassphraseKey(passphrase, salt);

  const decryptedContent = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return new Blob([decryptedContent], { type: originalMimeType || 'application/octet-stream' });
}
