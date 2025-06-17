// storage/mmkvStorage.ts
import { MMKV } from 'react-native-mmkv'
import type { StateStorage } from 'zustand/middleware'

const mmkv = new MMKV({ id: 'app-storage' })

export const mmkvStorage: StateStorage = {
  getItem: (name) => {
    const val = mmkv.getString(name)
    return val ?? null
  },
  setItem: (name, value) => {
    mmkv.set(name, value)
  },
  removeItem: (name) => {
    mmkv.delete(name)
  },
}
