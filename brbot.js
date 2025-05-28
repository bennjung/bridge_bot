require("dotenv").config();
const ethers = require("ethers");

// --- Configuration Object ---
const config = {
  RPC_URL: process.env.RPC_URL,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  OFT_CONTRACT_ADDRESS: "0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742", // Sophon OFT/ProxyOFT on BSC
  TOKEN_DECIMALS: 18, // Sophon token decimals
  DESTINATION_CHAIN_EID: 30334, // Sophon Mainnet Endpoint ID (LayerZero V2)
  AMOUNT_TO_BRIDGE: "5", // Amount of Sophon to bridge
  EXTRA_OPTIONS_HEX: "0x0003010011010000000000000000000000000009eb10", // 650,000 gas for destination
  FIXED_TX_FEE: "0.005", // Renamed from FIXED_NATIVE_FEE_BNB (represents fee in native token of the source chain)
  // Add other configurations here if needed, e.g., for different tokens or chains
};
// --- End Configuration Object ---

// BSC Provider & Wallet 설정
const provider = new ethers.JsonRpcProvider(config.RPC_URL);
const wallet = new ethers.Wallet(config.PRIVATE_KEY, provider);

// Bridge Contract Address (using config)
const BRIDGE_CONTRACT_ADDRESS = config.OFT_CONTRACT_ADDRESS;

// Updated ABI with 'send' and 'quoteSend'
const BRIDGE_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
          { "internalType": "bytes32", "name": "to", "type": "bytes32" },
          { "internalType": "uint256", "name": "amountLD", "type": "uint256" },
          { "internalType": "uint256", "name": "minAmountLD", "type": "uint256" },
          { "internalType": "bytes", "name": "extraOptions", "type": "bytes" },
          { "internalType": "bytes", "name": "composeMsg", "type": "bytes" },
          { "internalType": "bytes", "name": "oftCmd", "type": "bytes" }
        ],
        "internalType": "struct SendParam",
        "name": "_sendParam",
        "type": "tuple"
      },
      {
        "components": [
          { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
          { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
        ],
        "internalType": "struct MessagingFee",
        "name": "_fee",
        "type": "tuple"
      },
      { "internalType": "address", "name": "_refundAddress", "type": "address" }
    ],
    "name": "send",
    "outputs": [], // Assuming no specific output like MessagingReceipt for now
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          { "internalType": "uint32", "name": "dstEid", "type": "uint32" },
          { "internalType": "bytes32", "name": "to", "type": "bytes32" },
          { "internalType": "uint256", "name": "amountLD", "type": "uint256" },
          { "internalType": "uint256", "name": "minAmountLD", "type": "uint256" },
          { "internalType": "bytes", "name": "extraOptions", "type": "bytes" },
          { "internalType": "bytes", "name": "composeMsg", "type": "bytes" },
          { "internalType": "bytes", "name": "oftCmd", "type": "bytes" }
        ],
        "internalType": "struct SendParam",
        "name": "sendParam", // quoteSend uses sendParam as name based on typical LZ ABI
        "type": "tuple"
      },
      { "internalType": "bool", "name": "payInLzToken", "type": "bool" }
    ],
    "name": "quoteSend",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "nativeFee", "type": "uint256" },
          { "internalType": "uint256", "name": "lzTokenFee", "type": "uint256" }
        ],
        "internalType": "struct MessagingFee",
        "name": "msgFee", // quoteSend often returns msgFee as name
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Minimal ERC20 ABI for approve and allowance
const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)"
];

// 컨트랙트 인스턴스
const bridgeContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, BRIDGE_ABI, wallet);
const sophonTokenContract = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, ERC20_ABI, wallet);


// 브릿지 실행 함수
async function bridgeTokens() {
  const dstEid = config.DESTINATION_CHAIN_EID;
  const toAddress = wallet.address;
  const toBytes32 = ethers.zeroPadValue(toAddress, 32); 
  
  const amountLD = ethers.parseUnits(config.AMOUNT_TO_BRIDGE, config.TOKEN_DECIMALS); 
  const minAmountLD = amountLD; 

  const extraOptions = config.EXTRA_OPTIONS_HEX;
  const composeMsg = "0x";
  const oftCmd = "0x";

  // Always use the fixed transaction fee from config
  const nativeFeeValue = ethers.parseEther(config.FIXED_TX_FEE);
  console.log(`[brbot.js] Using fixed nativeFee: ${ethers.formatEther(nativeFeeValue)} (Source Chain Native Token) from config.FIXED_TX_FEE`);

  const sendParam = {
    dstEid: dstEid,
    to: toBytes32,
    amountLD: amountLD,
    minAmountLD: minAmountLD,
    extraOptions: extraOptions,
    composeMsg: composeMsg,
    oftCmd: oftCmd
  };

  const feeParam = {
    nativeFee: nativeFeeValue,
    lzTokenFee: 0
  };

  const refundAddress = wallet.address;

  console.log(`[brbot.js] Starting bridge process (using 'send' function) for ${ethers.formatUnits(amountLD, config.TOKEN_DECIMALS)} Sophon to ${toAddress} on Sophon Mainnet (eid: ${dstEid}).`);
  console.log("[brbot.js] _sendParam:", sendParam);
  console.log("[brbot.js] _fee:", feeParam);
  console.log(`[brbot.js] _refundAddress: ${refundAddress}`);
  console.log(`[brbot.js] Attaching nativeFee (msg.value): ${ethers.formatEther(nativeFeeValue)} (Source Chain Native Token)`);

  try {
    // 1. Check allowance and approve if necessary
    console.log(`[brbot.js] Checking allowance for Sophon token (${sophonTokenContract.target}) to be spent by bridge contract (${bridgeContract.target})...`);
    const currentAllowance = await sophonTokenContract.allowance(wallet.address, BRIDGE_CONTRACT_ADDRESS);
    console.log(`[brbot.js] Current allowance: ${ethers.formatUnits(currentAllowance, config.TOKEN_DECIMALS)} Sophon`);

    if (currentAllowance < amountLD) {
      console.log(`[brbot.js] Allowance is less than amount to bridge. Approving ${ethers.formatUnits(amountLD, config.TOKEN_DECIMALS)} Sophon...`);
      const approveTx = await sophonTokenContract.approve(BRIDGE_CONTRACT_ADDRESS, amountLD);
      console.log(`[brbot.js] Approve transaction sent: ${approveTx.hash}`);
      await approveTx.wait();
      console.log("[brbot.js] Approve transaction confirmed.");
    } else {
      console.log("[brbot.js] Sufficient allowance already granted.");
    }

    // 2. Call send function
    console.log(`[brbot.js] Calling 'send' function...`);
    const tx = await bridgeContract.send(
      sendParam,
      feeParam,
      refundAddress,
      { value: nativeFeeValue } // Pass nativeFee as msg.value
    );
    console.log(`[brbot.js] 'send' transaction Hash: ${tx.hash}`);
    await tx.wait();
    console.log("[brbot.js] 'send' transaction completed successfully!");

  } catch (error) {
    console.error("[brbot.js] Bridge process failed:", error.message);
    if (error.data) {
        console.error("[brbot.js] Error data:", error.data);
    }
     if (error.transaction) {
        console.error("[brbot.js] Error transaction:", error.transaction);
    }
    if (error.receipt) {
        console.error("[brbot.js] Error receipt:", error.receipt);
    }
  }
}

// 실행
bridgeTokens();