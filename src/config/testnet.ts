// Base Sepolia 테스트넷 시연용 상수. 실제 가치가 없는 테스트 자산만 다룬다.
export const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14a34";
export const BASE_SEPOLIA_RPC_URL = "https://sepolia.base.org";
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

// 데모 프로젝트의 프리랜서(굽타 해프) 수신 지갑. MVP는 프로젝트당 단일 개발자를 가정한다.
export const DEMO_FREELANCER_ADDRESS = "0x80907d156e8606319A4c7c04e8fdc4E89DcFF6E8";
