import { ethers } from "hardhat";
import { Contract, Wallet } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// Token addresses
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Amount to send to each address
const AMOUNTS = {
  ETH: ["0.001", "0.001", "0.001"],  // in ETH
  USDT: ["0.0005", "0.0005", "0.0005"], // in USDT
  USDC: ["0.0005", "0.0005", "0.0005"]  // in USDC
} as const;

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function decimals() view returns (uint8)",
];

async function main() {
  // Get contract address from .env
  const disperseAddress = process.env.DISPERSE_CONTRACT_ADDRESS;
  if (!disperseAddress) {
    throw new Error("Missing DISPERSE_CONTRACT_ADDRESS in .env");
  }

  // Get test account addresses from .env
  const testAddresses = [
    process.env.TEST_ACCOUNT_1_ADDRESS,
    process.env.TEST_ACCOUNT_2_ADDRESS,
    process.env.TEST_ACCOUNT_3_ADDRESS,
  ].filter((addr): addr is string => !!addr); // Type guard to ensure non-null values

  if (testAddresses.length !== 3) {
    throw new Error("Missing test account addresses in .env");
  }

  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("Dispersing from:", deployer.address);

  // Get token contracts
  const usdt = new Contract(USDT_ADDRESS, ERC20_ABI, deployer);
  const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, deployer);

  // Get token decimals
  const usdtDecimals = await usdt.decimals();
  const usdcDecimals = await usdc.decimals();
  
  // Convert amounts to proper decimals
  const ethValues = AMOUNTS.ETH.map(amount => ethers.parseEther(amount));
  const usdtValues = AMOUNTS.USDT.map(amount => ethers.parseUnits(amount, usdtDecimals));
  const usdcValues = AMOUNTS.USDC.map(amount => ethers.parseUnits(amount, usdcDecimals));

  // Get Disperse contract instance
  const Disperse = await ethers.getContractFactory("Disperse");
  const disperse = Disperse.attach(disperseAddress);
  console.log("Using Disperse contract at:", disperseAddress);

  // Print initial balances
  console.log("\nInitial balances:");
  await printBalances(deployer.address, testAddresses, usdt, usdc);

  // Prepare arrays for disperse
  const values = {
    eth: ethValues,
    usdt: usdtValues,
    usdc: usdcValues,
  };

  // Disperse ETH
  console.log("\nDispersing ETH...");
  const totalETH = ethValues.reduce((a, b) => a + b, BigInt(0));
  await (await disperse.disperseEther(testAddresses, values.eth, { value: totalETH })).wait();

  // Disperse USDC
  console.log("\nDispersing USDC...");
  const totalUSDC = usdcValues.reduce((a, b) => a + b, BigInt(0));
  await (await usdc.approve(disperseAddress, totalUSDC)).wait();
  await (await disperse.disperseToken(USDC_ADDRESS, testAddresses, values.usdc)).wait();

  // Disperse USDT
  console.log("\nDispersing USDT...");
  const totalUSDT = usdtValues.reduce((a, b) => a + b, BigInt(0));
  await (await usdt.approve(disperseAddress, totalUSDT)).wait();
  await (await disperse.disperseToken(USDT_ADDRESS, testAddresses, values.usdt)).wait();

  // Print final balances
  console.log("\nFinal balances:");
  await printBalances(deployer.address, testAddresses, usdt, usdc);
}

async function printBalances(deployer: string, addresses: string[], usdt: Contract, usdc: Contract) {
  console.log("\nDeployer:", deployer);
  console.log("ETH:", ethers.formatEther(await ethers.provider.getBalance(deployer)));
  console.log("USDT:", await usdt.balanceOf(deployer));
  console.log("USDC:", await usdc.balanceOf(deployer));

  for (let i = 0; i < addresses.length; i++) {
    console.log(`\nTest Account ${i + 1}:`, addresses[i]);
    console.log("ETH:", ethers.formatEther(await ethers.provider.getBalance(addresses[i])));
    console.log("USDT:", await usdt.balanceOf(addresses[i]));
    console.log("USDC:", await usdc.balanceOf(addresses[i]));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 