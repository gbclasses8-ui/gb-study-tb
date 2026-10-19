/**
 * Real Tests & Online Examination Helper for GB STUDY
 * Connects with genuine TargetBoard tests & question repositories
 */

export interface RealTestItem {
  _id: string;
  name: string;
  totalQuestions: number;
  totalTime: number;
  type?: string;
  courseId?: string;
  categoryId?: string;
}

export interface QuestionOption {
  text: string;
  _id?: string;
}

export interface RealQuestion {
  _id: string;
  question: string;
  options: QuestionOption[];
}

const memoryTestsCache: Record<string, RealTestItem[]> = {};
const memoryQuestionsCache: Record<string, RealQuestion[]> = {};

/**
 * Fetch real tests for a given course or category
 */
export async function fetchRealTests(courseId?: string, categoryId?: string): Promise<RealTestItem[]> {
  const cacheKey = `${courseId || ''}_${categoryId || ''}`;
  if (memoryTestsCache[cacheKey] && memoryTestsCache[cacheKey].length > 0) {
    return memoryTestsCache[cacheKey];
  }

  const params = new URLSearchParams();
  if (courseId) params.set('courseId', courseId);
  if (categoryId) params.set('categoryId', categoryId);
  params.set('limit', '40');

  const urls = [
    `/api/tests?${params.toString()}`,
    `https://seashell-app-3z5jp.ondigitalocean.app/api/v1/tests?${params.toString()}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        if (list.length > 0) {
          const items: RealTestItem[] = list.map((t: any) => ({
            _id: t._id,
            name: t.name || 'Chapter Mock Test',
            totalQuestions: t.totalQuestions || 50,
            totalTime: t.totalTime || 45,
            type: t.type || 'mock_test',
            courseId: courseId,
            categoryId: categoryId
          }));
          memoryTestsCache[cacheKey] = items;
          return items;
        }
      }
    } catch {}
  }

  return [];
}

/**
 * Fetch real questions for a test
 */
export async function fetchRealTestQuestions(testId: string): Promise<RealQuestion[]> {
  if (!testId) return [];

  if (memoryQuestionsCache[testId] && memoryQuestionsCache[testId].length > 0) {
    return memoryQuestionsCache[testId];
  }

  const urls = [
    `/api/tests/${encodeURIComponent(testId)}/questions`,
    `https://seashell-app-3z5jp.ondigitalocean.app/api/v1/tests/${encodeURIComponent(testId)}/questions/user`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) {
          memoryQuestionsCache[testId] = json;
          return json;
        }
      }
    } catch {}
  }

  return [];
}
