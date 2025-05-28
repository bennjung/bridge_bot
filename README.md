# Bridge Bot

컨트랙트를 사용해 브릿지하는 봇입니다.

## 🚀 설치 및 실행

### 1. 종속성 설치
```bash
npm install
```

### 2. 환경변수 설정
1. `env.example` 파일을 `.env`로 복사합니다:
```bash
copy env.example .env
```

2. `.env` 파일을 열어서 실제 값들을 입력합니다:
```
RPC_URL=your_source_chain_rpc_url_here
PRIVATE_KEY=your_actual_private_key_here
```

### 3. 기본 세팅 (`brbot.js`)
`brbot.js` 파일 상단에는 브릿징 작업을 위한 주요 설정들이 `config` 객체 안에 정의되어 있습니다. 이 값들을 사용자의 상황에 맞게 수정해야 합니다.<br>

### `brbot.js - Config `

```javascript
const config = {
  RPC_URL: process.env.RPC_URL, // .env 파일에서 설정한 소스 체인 RPC URL (수정 불필요)
  PRIVATE_KEY: process.env.PRIVATE_KEY, // .env 파일에서 설정한 개인 키 (수정 불필요)
  OFT_CONTRACT_ADDRESS: "0x31dba3c96481fde3cd81c2aaf51f2d8bf618c742", // [필수] 브릿징할 OFT 토큰의 소스 체인 상의 컨트랙트 주소
  TOKEN_DECIMALS: 18, // [필수] 브릿징할 토큰의 소수점 자릿수 (예: ETH, 대부분의 ERC20은 18, USDC는 6)
  DESTINATION_CHAIN_EID: 30334, // [필수] 목적지 체인의 LayerZero Endpoint ID
  AMOUNT_TO_BRIDGE: "5", // [필수] 브릿징할 토큰의 양 (문자열 형태, 예: "100")
  EXTRA_OPTIONS_HEX: "0x0003010011010000000000000000000000000009eb10", // [중요] 목적지 체인 가스 설정 등을 위한 LayerZero extraOptions. 브릿지하는 체인 쌍 및 토큰에 따라 적절한 값을 찾아 설정해야 합니다.
  FIXED_TX_FEE: "0.005", // [필수] LayerZero 메시징을 위한 고정 수수료 (소스 체인의 네이티브 토큰 단위, 예: "0.005" BNB 또는 "0.001" ETH)
};
```

**각 항목 설명:**

| 항목명                 | 설명                                                          | 예시 / 참고                                      |
| :--------------------- | :------------------------------------------------------------ | :----------------------------------------------- |
| `OFT_CONTRACT_ADDRESS` | [필수] 소스 체인의토큰 컨트랙트 주소.                       | `"0x..."` (토큰/체인별로 다름)                     |
| `TOKEN_DECIMALS`       | [필수] 브릿징할 토큰의 소수점 자릿수.                             | `18` (일반), `6` (USDC 등)                         |
| `DESTINATION_CHAIN_EID`| [필수] 목적지 체인의 LayerZero Endpoint ID.                     | `30334` (Sophon 예시)                             |
| `AMOUNT_TO_BRIDGE`     | [필수] 브릿징할 토큰의 양 (문자열 형태).                   | `"5"`, `"100.5"`                                |
| `EXTRA_OPTIONS_HEX`    | [중요] 목적지 가스 등 LayerZero `extraOptions` (16진수 bytes). | `"0x000301..."` (LZ 문서/성공 트랜잭션 참조)      |
| `FIXED_TX_FEE`         | [필수] 레제로에 사용할 트젝비용. | `"0.005"` (BNB), `"0.001"` (ETH)                 |

**주의:** `RPC_URL`과 `PRIVATE_KEY`는 `.env` 파일에서 설정하며, `config` 객체 내에서는 `process.env`를 통해 자동으로 로드됩니다. `brbot.js` 파일 내에서 이 두 항목을 직접 수정할 필요는 없습니다.

### 4. 실행
```bash
node brbot.js
```