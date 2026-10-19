/**
 * Real Notes & PDF Helper for GB STUDY
 * Resolves authentic DigitalOcean CDN and TargetBoard PDF notes
 */

export interface CachedPdfItem {
  title: string;
  url: string;
  fileName?: string;
}

// In-memory runtime cache for fast instant opens
const memoryCategoryCache: Record<string, CachedPdfItem[]> = {};

// Normalizes strings for robust whitespace-insensitive matching
export function normalizeTitle(str: string): string {
  if (!str) return '';
  return str.replace(/[\s\-_/\\()]+/g, ' ').trim().toLowerCase();
}

/**
 * Load static pre-cached PDF notes map (contains all 11,303 authentic PDFs)
 */
let staticCacheLoadingPromise: Promise<void> | null = null;
let staticCacheLoaded = false;

export async function loadStaticPdfCache(): Promise<void> {
  if (staticCacheLoaded) return;
  if (staticCacheLoadingPromise) return staticCacheLoadingPromise;

  staticCacheLoadingPromise = (async () => {
    try {
      const res = await fetch('/data/pdf_cache.json');
      if (res.ok) {
        const data = await res.json();
        Object.assign(memoryCategoryCache, data);
        staticCacheLoaded = true;
      }
    } catch (err) {
      console.warn('Could not load static pdf_cache.json:', err);
    }
  })();

  return staticCacheLoadingPromise;
}

// Automatically trigger cache loading immediately when module is imported in client
if (typeof window !== 'undefined') {
  loadStaticPdfCache();
}

/**
 * Fetch real PDFs for a given category ID from in-memory cache, static file, or API proxy
 */
export async function fetchCategoryPdfs(categoryId: string): Promise<CachedPdfItem[]> {
  if (!categoryId) return [];

  // 1. Check in-memory cache first (instant)
  if (memoryCategoryCache[categoryId] && memoryCategoryCache[categoryId].length > 0) {
    return memoryCategoryCache[categoryId];
  }

  // 2. Ensure static cache of 11,303 PDFs is loaded
  await loadStaticPdfCache();
  if (memoryCategoryCache[categoryId] && memoryCategoryCache[categoryId].length > 0) {
    return memoryCategoryCache[categoryId];
  }

  // 3. Check localStorage cache
  try {
    const local = localStorage.getItem(`gb_pdf_cat_${categoryId}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCategoryCache[categoryId] = parsed;
        return parsed;
      }
    }
  } catch {}

  // 4. Fetch from live API proxy endpoint or direct fallback
  const endpoints = [
    `/api/category/${categoryId}`,
    `https://seashell-app-3z5jp.ondigitalocean.app/api/v1/category/${categoryId}`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000)
      });

      if (res.ok) {
        const json = await res.json();
        const contents = Array.isArray(json.contents) ? json.contents : [];
        const pdfItems: CachedPdfItem[] = contents
          .filter((item: any) => item && item.pdf && typeof item.pdf.url === 'string' && item.pdf.url.trim().length > 0)
          .map((item: any) => ({
            title: item.title || item.pdf.fileName || 'Lecture PDF Note',
            url: item.pdf.url.trim(),
            fileName: item.pdf.fileName || ''
          }));

        if (pdfItems.length > 0) {
          memoryCategoryCache[categoryId] = pdfItems;
          try {
            localStorage.setItem(`gb_pdf_cat_${categoryId}`, JSON.stringify(pdfItems));
          } catch {}
          return pdfItems;
        }
      }
    } catch {
      // Continue to next endpoint
    }
  }

  return [];
}

/**
 * Resolves the authentic PDF URL for a specific note inside a category,
 * or performs a global title lookup if category is not provided.
 */
export async function resolveRealPdf(
  categoryId?: string,
  targetTitle?: string,
  index?: number
): Promise<CachedPdfItem | null> {
  await loadStaticPdfCache();

  // If categoryId is given, resolve within that category first
  if (categoryId) {
    const categoryPdfs = await fetchCategoryPdfs(categoryId);
    if (categoryPdfs && categoryPdfs.length > 0) {
      const normalizedTarget = normalizeTitle(targetTitle || '');

      // Exact title match
      if (normalizedTarget) {
        const exact = categoryPdfs.find(p => normalizeTitle(p.title) === normalizedTarget);
        if (exact) return exact;

        // Partial title match
        const partial = categoryPdfs.find(p => {
          const nP = normalizeTitle(p.title);
          return nP.includes(normalizedTarget) || normalizedTarget.includes(nP);
        });
        if (partial) return partial;
      }

      // Index match (1-based index)
      if (typeof index === 'number' && index > 0 && index <= categoryPdfs.length) {
        return categoryPdfs[index - 1];
      }

      // Default to first PDF in category
      return categoryPdfs[0];
    }
  }

  // Fallback: Global title search across all cached categories if categoryId is missing or had no match
  if (targetTitle) {
    const normalizedTarget = normalizeTitle(targetTitle);
    for (const catId of Object.keys(memoryCategoryCache)) {
      const items = memoryCategoryCache[catId] || [];
      const match = items.find(item => {
        const nT = normalizeTitle(item.title);
        return nT === normalizedTarget || nT.includes(normalizedTarget) || normalizedTarget.includes(nT);
      });
      if (match) return match;
    }
  }

  return null;
}

/**
 * Constructs URLs for various viewing & downloading methods
 */
export function getPdfViewerUrls(pdfUrl: string, title?: string, courseId?: string, categoryId?: string) {
  const cleanTitle = title || 'Lecture PDF Notes';
  const encodedPdf = encodeURIComponent(pdfUrl);
  const encodedTitle = encodeURIComponent(cleanTitle);

  return {
    directUrl: pdfUrl,
    // TargetBoard official PDF viewer page (matches TargetBoard app format)
    targetBoardPdfUrl: `https://targetboard.co.in/dashboard/pdf?url=${encodedPdf}&title=${encodedTitle}`,
    // Proxy URL to guarantee direct stream without any header or CORS issues
    proxyUrl: `/api/pdf/proxy?url=${encodedPdf}`,
    // TargetBoard course categories portal
    targetBoardCourseUrl: courseId 
      ? `https://targetboard.co.in/dashboard/course/${courseId}/categories${categoryId ? `/${categoryId}` : ''}`
      : 'https://targetboard.co.in/dashboard/courses'
  };
}
