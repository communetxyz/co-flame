# 🔥 Co-Flame

Cooperatively owned smart lighter brand. Buy a lighter → get an NFT → prove possession → earn revenue share.

## Contracts (Sepolia)

| Contract | Address |
|---|---|
| CoFlameToken ($CFLAME) | `0x79B6aF083213f45d8Bc15C2a8540DEB038dDa1B1` |
| CoFlameLighter (NFT) | `0x6107F9a107Ee15cccB9715c698eD60fC67174594` |
| CoFlameFactory | `0x243E11e0e96422A2f16A772D8eD8787f91A778FE` |

## Lighter Tiers

| Tier | Price | Base Share | Scan Bonus | Duration |
|---|---|---|---|---|
| Cypherpunk | 0.0005 ETH | 3% | +0.5%/scan | 90 days |
| DeGen | 0.0015 ETH | 8% | +1%/scan | 120 days |
| Oracle | 0.005 ETH | 15% | +1.5%/scan | 180 days |

## Development

```bash
# Contracts
cd contracts && forge build && forge test

# Frontend
cd frontend && npm install && npm run build
```
