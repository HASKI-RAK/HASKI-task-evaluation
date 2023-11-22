import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export type StoreState = unknown
export type PersistedStoreState = unknown

export const resetters: (() => void)[] = []

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useStore = create<StoreState>()((...a) => ({}))

export const usePersistedStore = create<PersistedStoreState>()(
  devtools(
    persist(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (...a) => ({
        // _user: null,
        // expire: null
      }),
      {
        name: 'persisted_storage',
        // Here we can whitelist the keys we want to persist
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        partialize: (state) => ({
          // _user: state._user,
          // expire: state.expire
        }),
        onRehydrateStorage: () => {
          console.log('PersistedStore hydration starts')
        },
        version: 1.0 // When this changes, the persisted data will be discarded and the store reinitialized (Useful for migrations)
      }
    )
  )
)
export const resetAllSlices = () => resetters.forEach((reset) => reset())
