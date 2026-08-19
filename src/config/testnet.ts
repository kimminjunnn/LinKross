// Base Sepolia 테스트넷 시연용 상수. 실제 가치가 없는 테스트 자산만 다룬다.
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";
// 공식 sepolia.base.org가 간헐적으로 "no backend is currently healthy"를
// 반환해 MetaMask/ethers estimateGas가 "missing revert data"로 오검출되는
// 사례가 있었다. publicnode의 미러가 더 안정적으로 확인되어 기본값으로 쓴다.
export const BASE_SEPOLIA_RPC_URL = "https://base-sepolia-rpc.publicnode.com";
export const BASE_SEPOLIA_EXPLORER_URL = "https://sepolia.basescan.org";

export const BASE_SEPOLIA_NETWORK_PARAMS = {
  chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [BASE_SEPOLIA_RPC_URL],
  blockExplorerUrls: [BASE_SEPOLIA_EXPLORER_URL],
} as const;

export const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const USDC_DECIMALS = 6;
