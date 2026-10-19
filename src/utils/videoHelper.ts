/**
 * Utility functions for extracting clean video ID strings and constructing
 * reliable TargetBoard video player iframe and direct streaming URLs.
 *
 * Implements TargetBoard's official XOR + timestamp + base64url encoding
 * and decoding so that video playback works seamlessly on Vercel, Google AI Studio,
 * and after official TargetBoard OTP login without the "No video ID provided" error.
 */

// TargetBoard official XOR Encryption Key (from targetboard.co.in/src/lib/utils.js)
const _K = [0x4B, 0x72, 0x1a, 0x5e, 0x33, 0x6d, 0x0f, 0x41, 0x28, 0x59];

/**
 * Encodes a raw video asset ID (e.g. "32dPpeFk5kQ") into TargetBoard's official
 * XOR + timestamp + base64url encoded token expected by TargetBoard's video player.
 */
export function encodeAssetId(id: string): string {
  if (!id || typeof id !== 'string') return '';
  const trimmed = id.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return '';

  const ts = Date.now().toString(36);
  const payload = `${ts}.${trimmed}`;
  const bytes: number[] = [];
  for (let i = 0; i < payload.length; i++) {
    bytes.push(payload.charCodeAt(i) ^ _K[i % _K.length]);
  }

  let b64 = '';
  if (typeof btoa === 'function') {
    b64 = btoa(String.fromCharCode(...bytes));
  } else if (typeof Buffer !== 'undefined') {
    b64 = Buffer.from(String.fromCharCode(...bytes)).toString('base64');
  }

  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes TargetBoard's encoded token back to the original raw video asset ID.
 * Returns empty string "" if the input is not a valid encoded token.
 */
export function decodeAssetId(encoded: string): string {
  if (!encoded || typeof encoded !== 'string') return '';
  const clean = encoded.trim();
  if (!clean || clean === 'undefined' || clean === 'null') return '';

  try {
    const b64 = clean.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (clean.length % 4)) % 4);
    let raw = '';
    if (typeof atob === 'function') {
      raw = atob(b64);
    } else if (typeof Buffer !== 'undefined') {
      raw = Buffer.from(b64, 'base64').toString('latin1');
    }
    const bytes: number[] = [];
    for (let i = 0; i < raw.length; i++) {
      bytes.push(raw.charCodeAt(i) ^ _K[i % _K.length]);
    }
    const payload = String.fromCharCode(...bytes);
    const dotIdx = payload.indexOf('.');
    if (dotIdx === -1) return '';
    const decodedId = payload.slice(dotIdx + 1).trim();
    return decodedId && decodedId !== 'undefined' && decodedId !== 'null' ? decodedId : '';
  } catch {
    return '';
  }
}

/**
 * Safely extracts JUST the clean video ID string from:
 * - A raw ID: "32dPpeFk5kQ"
 * - An encoded token: "JgQjPUBcPzkGankWSi5WK2R0Qwg"
 * - A full URL: "https://targetboard.co.in/dashboard/video?v=..."
 * - An embed URL or path: "https://.../video/32dPpeFk5kQ"
 * - A parameter string: "?v=32dPpeFk5kQ" or "v=32dPpeFk5kQ"
 * - An object containing asset, assetId, v, id, videoUrl, or embedUrl
 * - Fallback: new URLSearchParams(window.location.search).get('v') or 'tpAssetId'
 *
 * Strictly returns an empty string "" if the input is missing, null, undefined, or invalid.
 */
export function extractCleanVideoId(
  input: unknown,
  fallbackToUrl: boolean = true
): string {
  if (input === null || input === undefined) {
    if (fallbackToUrl && typeof window !== 'undefined') {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlV = searchParams.get('v') || searchParams.get('tpAssetId') || searchParams.get('asset');
        if (urlV && typeof urlV === 'string') {
          const trimmedV = urlV.trim();
          if (trimmedV.length > 0 && trimmedV !== 'undefined' && trimmedV !== 'null') {
            return trimmedV;
          }
        }
      } catch {}
    }
    return '';
  }

  let raw = '';

  if (typeof input === 'string') {
    raw = input.trim();
  } else if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.asset === 'string') raw = obj.asset.trim();
    else if (typeof obj.assetId === 'string') raw = obj.assetId.trim();
    else if (typeof obj.tpAssetId === 'string') raw = obj.tpAssetId.trim();
    else if (typeof obj.v === 'string') raw = obj.v.trim();
    else if (typeof obj.id === 'string') raw = obj.id.trim();
    else if (typeof obj.videoUrl === 'string') raw = obj.videoUrl.trim();
    else if (typeof obj.embedUrl === 'string') raw = obj.embedUrl.trim();
    else if (typeof obj.video === 'object' && obj.video) {
      return extractCleanVideoId(obj.video, fallbackToUrl);
    }
  }

  // Check if raw is non-empty and not literal 'undefined' or 'null'
  if (raw && raw !== 'undefined' && raw !== 'null') {
    // 1. Try extracting from query parameters: v= or tpAssetId= or asset=
    if (raw.includes('v=') || raw.includes('tpAssetId=') || raw.includes('asset=')) {
      try {
        const url = new URL(raw.startsWith('http') ? raw : `https://targetboard.co.in/${raw.replace(/^\?/, '')}`);
        const v = url.searchParams.get('v') || url.searchParams.get('tpAssetId') || url.searchParams.get('asset');
        if (v && v.trim() && v !== 'undefined' && v !== 'null') {
          return v.trim();
        }
      } catch {
        const match = raw.match(/[?&](?:v|tpAssetId|asset)=([^&#]+)/);
        if (match && match[1] && match[1] !== 'undefined' && match[1] !== 'null') {
          return decodeURIComponent(match[1]).trim();
        }
      }
    }

    // 2. Try extracting from /video/<id> path
    if (raw.includes('/video/')) {
      const parts = raw.split('/video/');
      if (parts[1]) {
        const cleanPart = parts[1].split(/[?&#]/)[0];
        if (cleanPart && cleanPart.trim() && cleanPart !== 'undefined' && cleanPart !== 'null') {
          return cleanPart.trim();
        }
      }
    }

    // 3. If raw doesn't contain url characters (no slashes, question marks, or ampersands)
    if (!raw.includes('/') && !raw.includes('?') && !raw.includes('&') && !raw.includes('=')) {
      const trimmed = raw.trim();
      if (trimmed.length > 0 && trimmed !== 'undefined' && trimmed !== 'null') {
        return trimmed;
      }
    }
  }

  // 4. Fallback: Parse 'v' or 'tpAssetId' query parameter directly from window.location.search
  if (fallbackToUrl && typeof window !== 'undefined') {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlV = searchParams.get('v') || searchParams.get('tpAssetId') || searchParams.get('asset');
      if (urlV && typeof urlV === 'string') {
        const trimmedV = urlV.trim();
        if (trimmedV.length > 0 && trimmedV !== 'undefined' && trimmedV !== 'null') {
          return trimmedV;
        }
      }
    } catch {}
  }

  return '';
}

/**
 * Checks ID validity and returns the official TargetBoard streaming URL:
 * https://targetboard.co.in/dashboard/video?v=${token}&tpAssetId=${rawId}
 *
 * Why both parameters are passed:
 * TargetBoard's VideoPlayerPage uses:
 *   const tpAssetId = location.state?.tpAssetId || decodeAssetId(searchParams.get("v") || "") || searchParams.get("tpAssetId") || "";
 * 1. v contains the official encoded token (XOR + timestamp + base64url) that TargetBoard decodes via decodeAssetId(v).
 * 2. tpAssetId contains the raw ID as a direct fallback.
 * 3. title (if provided) displays the lecture title in TargetBoard.
 *
 * This guarantees that when deployed on Vercel and opened, even after OTP login on TargetBoard,
 * TargetBoard ALWAYS finds the video ID and NEVER shows "No video ID provided"!
 *
 * Strictly returns an empty string "" instead of constructing an incomplete URL
 * with a blank parameter if cleanVideoId is missing, empty, undefined, or null.
 */
export function getTargetBoardIframeSrc(cleanVideoId: unknown, title?: string): string {
  const safeId = extractCleanVideoId(cleanVideoId, false);
  if (!safeId || typeof safeId !== 'string' || safeId.trim().length === 0 || safeId === 'undefined' || safeId === 'null') {
    return '';
  }

  const trimmedId = safeId.trim();

  let rawAssetId = '';
  let token = '';

  // Check if trimmedId is already an encoded token
  const decoded = decodeAssetId(trimmedId);
  if (decoded) {
    // Already encoded token
    token = trimmedId;
    rawAssetId = decoded;
  } else {
    // Raw video ID (e.g. "32dPpeFk5kQ")
    rawAssetId = trimmedId;
    token = encodeAssetId(rawAssetId);
  }

  const titleQuery = title && typeof title === 'string' && title.trim()
    ? `&title=${encodeURIComponent(title.trim())}`
    : '';

  return `https://targetboard.co.in/dashboard/video?v=${encodeURIComponent(token)}&tpAssetId=${encodeURIComponent(rawAssetId)}${titleQuery}`;
}
