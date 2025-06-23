import {create} from 'zustand';
import {AccountApiItem} from "@/types/account.type.ts";

interface AccountState {
  accounts?: AccountApiItem[];
  currentAccount?: AccountApiItem | null;
}

export interface AccountStore extends AccountState {
  setAccounts: (args: AccountState['accounts']) => void;
  setCurrentAccount: (args: AccountState['currentAccount']) => void;
}

const initialState: Pick<AccountStore, keyof AccountState> = {
  accounts: [],
  currentAccount: null
};

const useAccountStore = create<AccountStore>((set) => ({
  ...initialState,
  setAccounts: (accounts) => {
    set(() => ({accounts}));
  },
  setCurrentAccount: (currentAccount) => {
    set(() => ({currentAccount}))
  }
}));

export default useAccountStore;