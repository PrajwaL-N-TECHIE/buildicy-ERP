import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ChatMessage } from '@/types';

const META = 'chat/_meta/channels';
const CHANNELS = 'chat/channels';

/**
 * Phase 3 structure (live in Phase 2 repos as a placeholder):
 *   chat/_meta/channels/{channelId}            — channel name + members
 *   chat/channels/{channelId}/messages/{msgId} — messages (200 history cap)
 *   chat/dms/{dmId}/messages/{msgId}           — DM threads
 *
 * Phase 5: client create only; server moderates (e.g., anti-spam).
 */
export const chatRepo = {
  watchChannels(cb: (channels: { id: string; name: string; memberIds: string[] }[]) => void) {
    return onSnapshot(collection(db, META), (snap) => {
      cb(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? d.id,
            memberIds: data.memberIds ?? [],
          };
        })
      );
    });
  },
  watchChannelMessages(channelId: string, cb: (msgs: ChatMessage[]) => void) {
    return onSnapshot(
      query(collection(db, CHANNELS, channelId, 'messages'), orderBy('timestamp', 'asc'), limit(200)),
      (snap) =>
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp ?? serverTimestamp(),
          } as ChatMessage))
        )
    );
  },
  async sendChannelMessage(channelId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const ref = await addDoc(collection(db, CHANNELS, channelId, 'messages'), {
      ...msg,
      timestamp: serverTimestamp(),
    });
    await setDoc(
      doc(db, META, channelId),
      { lastMessageAt: serverTimestamp() },
      { merge: true }
    );
    return ref.id;
  },
  /**
   * Deterministic DM id from two uids.
   */
  dmIdFor(uidA: string, uidB: string) {
    return [uidA, uidB].sort().join('_');
  },
  watchDM(dmId: string, cb: (msgs: ChatMessage[]) => void) {
    return onSnapshot(
      query(collection(db, 'chat/dms', dmId, 'messages'), orderBy('timestamp', 'asc'), limit(200)),
      (snap) =>
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp ?? serverTimestamp(),
          } as ChatMessage))
        )
    );
  },
  async sendDM(dmId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const ref = await addDoc(collection(db, 'chat/dms', dmId, 'messages'), {
      ...msg,
      timestamp: serverTimestamp(),
    });
    return ref.id;
  },
};
