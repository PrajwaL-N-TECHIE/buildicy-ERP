import { getFunctions, httpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { app } from '@/firebase/config';

const fns = getFunctions(app);

export const USE_CF_WRITES: boolean =
  import.meta.env.VITE_USE_CF_WRITES === 'true';

function call<TReq, TRes>(name: string) {
  return httpsCallable<TReq, TRes>(fns, name);
}

/**
 * Cloud Function stubs. Each will be wired up in Phase 5. Until then
 * the SPA uses direct Firestore writes via the repo modules.
 */
export const cf = {
  createTask: (req: unknown) =>
    call<unknown, { id: string }>('createTask')(req),
  updateTaskStatus: (req: unknown) =>
    call<unknown, { id: string }>('updateTaskStatus')(req),
  reviewTaskByReviewer: (req: unknown) =>
    call<unknown, { id: string }>('reviewTaskByReviewer')(req),
  reviewTaskByAdmin: (req: unknown) =>
    call<unknown, { id: string }>('reviewTaskByAdmin')(req),
  updateProjectDeadline: (req: unknown) =>
    call<unknown, { id: string }>('updateProjectDeadline')(req),
  scheduleMeeting: (req: unknown) =>
    call<unknown, { id: string }>('scheduleMeeting')(req),
  deleteMeeting: (req: unknown) =>
    call<unknown, { id: string }>('deleteMeeting')(req),
  checkIn: (req: unknown) =>
    call<unknown, { id: string }>('checkIn')(req),
  checkOut: (req: unknown) =>
    call<unknown, { id: string }>('checkOut')(req),
};

/**
 * Helper to unwrap the data field from a callable result.
 */
export function unwrap<T>(p: Promise<HttpsCallableResult<T>>): Promise<T> {
  return p.then((r) => r.data);
}
