import { Contract } from "ethers";

export interface IERC20Extended extends Contract {
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<boolean>;
  transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
  approve(spender: string, amount: bigint): Promise<any>;
  allowance(owner: string, spender: string): Promise<bigint>;
} 