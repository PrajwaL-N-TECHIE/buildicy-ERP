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
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { ChatMessage } from '@/types';

const META = 'chat/_meta/channels';
const CHANNELS = 'chat/channels';

export const chatRepo = {
  watchChannels(cb: (channels: { id: string; name: string; memberIds: string[] }[]) => void) {
    return onSnapshot(
      collection(db, META),
      (snap) => {
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
      },
      (err) => {
        console.warn('[chatRepo] watchChannels notice:', err.message);
        cb([]);
      }
    );
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
        ),
      (err) => {
        console.warn('[chatRepo] watchChannelMessages notice:', err.message);
        cb([]);
      }
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
        ),
      (err) => {
        console.warn('[chatRepo] watchDM notice:', err.message);
        cb([]);
      }
    );
  },
  async sendDM(dmId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const ref = await addDoc(collection(db, 'chat/dms', dmId, 'messages'), {
      ...msg,
      timestamp: serverTimestamp(),
    });
    return ref.id;
  },
  async updateMessage(messageId: string, patch: Partial<ChatMessage>) {
    try {
      await updateDoc(doc(db, 'chat_messages', messageId), patch as Partial<ChatMessage>);
    } catch (err) {
      console.warn('[chatRepo] updateMessage notice:', err);
    }
  },
};
