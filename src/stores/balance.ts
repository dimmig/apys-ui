import { defineStore } from "pinia";
import { useAuthStore } from "@/stores/auth";
import type { TokenBalance } from "@/stores/types";
import type { TokenMeta } from "@/network/models/InfoServerModels";
import { fungibleTokenApi } from "@/network/api/FungibleTokenApi";
import { apysApi } from "@/network/api/ApysApi";
import Big from "big.js";

interface State {
  balances: TokenBalance[];
}

export const useBalanceStore = defineStore({
  id: "balance",
  state: (): State => ({
    balances: [],
  }),
  getters: {
    getBalanceByToken: (state: State) => (tokenId: string) => {
      return state.balances.find((it) => it.meta.contractId === tokenId);
    },
    getAppBalanceByToken: (state: State) => (tokenId: string) => {
      return (
        state.balances.find((it) => it.meta.contractId === tokenId)
          ?.appBalance ?? new Big(0)
      );
    },
    checkAppBalanceLoadedForToken: (state: State) => (tokenId: string) => {
      return (
        state.balances.find((it) => it.meta.contractId === tokenId)
          ?.appBalanceLoaded ?? false
      );
    },
  },
  actions: {
    initBalancesByTokensMeta(tokens: TokenMeta[]) {
      this.balances = tokens.map((token) => ({
        meta: token,
        appBalance: Big(0),
        appBalanceLoaded: false,
        walletBalance: Big(0),
        walletBalanceLoaded: false,
      }));
    },

    async fetchAppBalance(tokenId: string): Promise<boolean> {
      // Get stores
      const { accountId } = useAuthStore();

      // Fetch info from info server
      const response = await apysApi.getAccountBalance(accountId, tokenId);

      // Update state
      const balanceIndex = this.balances.findIndex(
        (it) => it.meta.contractId === tokenId
      );
      if (balanceIndex !== -1) {
        this.balances[balanceIndex] = {
          ...this.balances[balanceIndex],
          appBalance: response,
          appBalanceLoaded: true,
        };

        // Return true if balance fetched
        return true;
      }
      // Otherwise, return false
      return false;
    },

    async fetchWalletBalance(tokenId: string): Promise<boolean> {
      // Get stores
      const { accountId } = useAuthStore();

      // Fetch info from info server
      const response = await fungibleTokenApi.getBalanceOf(accountId, tokenId);

      // Update state
      const balanceIndex = this.balances.findIndex(
        (it) => it.meta.contractId === tokenId
      );
      if (balanceIndex !== -1) {
        this.balances[balanceIndex] = {
          ...this.balances[balanceIndex],
          walletBalance: response,
          walletBalanceLoaded: true,
        };

        // Return true if balance fetched
        return true;
      }
      // Otherwise, return false
      return false;
    },

    async deposit(tokenId: string, amount: string) {
      return apysApi.deposit(tokenId, amount);
    },

    async withdraw(tokenId: string, amount: string) {
      return apysApi.withdraw(tokenId, amount);
    },
  },
});
