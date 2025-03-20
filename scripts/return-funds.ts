import { ethers } from "hardhat";
import { Contract, Wallet } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
];

// Gas estimation constants
const GAS_LIMITS = {
  ETH_TRANSFER: BigInt(21000),
  ERC20_TRANSFER: BigInt(65000), // Conservative estimate for USDT/USDC
  SAFETY_MARGIN: BigInt(120) // 20% safety margin (base 100)
};

async function estimateGasCost(
  signer: Wallet,
  txType: 'ETH' | 'ERC20',
  tokenContract?: Contract,
  to?: string,
  amount?: bigint
): Promise<bigint> {
  // Get latest fee data
  const feeData = await ethers.provider.getFeeData();
  
  // Use max fee per gas if available, otherwise fall back to gas price
  const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
  
  // Get gas limit based on transaction type
  let gasLimit: bigint;
  
  if (txType === 'ETH') {
    gasLimit = GAS_LIMITS.ETH_TRANSFER;
  } else if (txType === 'ERC20' && tokenContract && to && amount) {
    try {
      // Try to estimate actual gas limit
      gasLimit = await tokenContract.transfer.estimateGas(to, amount);
      // Add 20% safety margin
      gasLimit = (gasLimit * GAS_LIMITS.SAFETY_MARGIN) / BigInt(100);
    } catch {
      // Fallback to conservative estimate if estimation fails
      gasLimit = GAS_LIMITS.ERC20_TRANSFER;
    }
  } else {
    throw new Error("Invalid parameters for gas estimation");
  }

  return gasPrice * gasLimit;
}

async function main() {
  // Get test account private keys from .env
  const testPrivateKeys = [
    process.env.TEST_ACCOUNT_1_PRIVATE_KEY,
    process.env.TEST_ACCOUNT_2_PRIVATE_KEY,
    process.env.TEST_ACCOUNT_3_PRIVATE_KEY,
  ].filter((key): key is string => !!key);

  if (testPrivateKeys.length !== 3) {
    throw new Error("Missing test account private keys in .env");
  }

  // Get deployer address
  const [deployer] = await ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log("Returning funds to:", deployerAddress);

  // Create signers for test accounts
  const testSigners = testPrivateKeys.map(key => new Wallet(key, ethers.provider));

  // Print initial balances
  console.log("\nInitial balances:");
  await printBalances(deployerAddress, testSigners);

  // Return USDT first
  console.log("\nReturning USDT...");
  for (let i = 0; i < testSigners.length; i++) {
    const usdt = new Contract(USDT_ADDRESS, ERC20_ABI, testSigners[i]);
    const balance = await usdt.balanceOf(testSigners[i].address);
    if (balance > 0) {
      console.log(`Returning ${balance} USDT from account ${i + 1}`);
      await (await usdt.transfer(deployerAddress, balance)).wait();
    }
  }

  // Return USDC second
  console.log("\nReturning USDC...");
  for (let i = 0; i < testSigners.length; i++) {
    const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, testSigners[i]);
    const balance = await usdc.balanceOf(testSigners[i].address);
    if (balance > 0) {
      console.log(`Returning ${balance} USDC from account ${i + 1}`);
      await (await usdc.transfer(deployerAddress, balance)).wait();
    }
  }

  // Return ETH last
  console.log("\nReturning ETH...");
  for (let i = 0; i < testSigners.length; i++) {
    const balance = await ethers.provider.getBalance(testSigners[i].address);
    if (balance > 0) {
      // Estimate gas cost for ETH transfer
      const gasCost = await estimateGasCost(testSigners[i], 'ETH');
      const amountToSend = balance - gasCost;

      if (amountToSend > 0) {
        console.log(`Returning ${ethers.formatEther(amountToSend)} ETH from account ${i + 1}`);
        const tx = await testSigners[i].sendTransaction({
          to: deployerAddress,
          value: amountToSend,
        });
        console.log("Transaction hash:", tx.hash);
        //await tx.wait();
      }
    }
  }

  // Print final balances
  console.log("\nFinal balances:");
  await printBalances(deployerAddress, testSigners);
}

async function printBalances(deployer: string, signers: Wallet[]) {
  const usdt = new Contract(USDT_ADDRESS, ERC20_ABI, signers[0]);
  const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signers[0]);

  console.log("\nDeployer:", deployer);
  console.log("ETH:", ethers.formatEther(await ethers.provider.getBalance(deployer)));
  console.log("USDT:", await usdt.balanceOf(deployer));
  console.log("USDC:", await usdc.balanceOf(deployer));

  for (let i = 0; i < signers.length; i++) {
    console.log(`\nTest Account ${i + 1}:`, signers[i].address);
    console.log("ETH:", ethers.formatEther(await ethers.provider.getBalance(signers[i].address)));
    console.log("USDT:", await usdt.balanceOf(signers[i].address));
    console.log("USDC:", await usdc.balanceOf(signers[i].address));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 