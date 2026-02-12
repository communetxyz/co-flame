// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CoFlameLighter.sol";
import "./CoFlameToken.sol";

/// @title CoFlameFactory — Sells lighters and routes revenue
contract CoFlameFactory is Ownable {
    CoFlameLighter public lighter;
    CoFlameToken public token;

    uint256 public constant REVENUE_SPLIT_BPS = 5000; // 50% to token holders

    event LighterPurchased(address indexed buyer, uint256 indexed tokenId, CoFlameLighter.Tier tier);

    constructor(address _lighter, address _token, address _owner) Ownable(_owner) {
        lighter = CoFlameLighter(payable(_lighter));
        token = CoFlameToken(payable(_token));
    }

    /// @notice Buy a lighter — pays ETH, mints NFT, splits revenue
    function buyLighter(CoFlameLighter.Tier tier) external payable returns (uint256) {
        CoFlameLighter.TierParams memory tp;
        (tp.price, tp.baseBps, tp.scanBonusBps, tp.duration) = lighter.tierParams(tier);
        require(msg.value >= tp.price, "insufficient payment");

        uint256 tokenId = lighter.mint(msg.sender, tier);

        // Split revenue: 50% to token profit pool, 50% to lighter revenue pool
        uint256 toTokenHolders = (msg.value * REVENUE_SPLIT_BPS) / 10_000;
        uint256 toLighterPool = msg.value - toTokenHolders;

        if (toTokenHolders > 0) {
            token.depositProfit{value: toTokenHolders}();
        }
        if (toLighterPool > 0) {
            lighter.depositRevenue{value: toLighterPool}();
        }

        // Refund excess
        if (msg.value > tp.price) {
            (bool ok,) = msg.sender.call{value: msg.value - tp.price}("");
            require(ok, "refund failed");
        }

        emit LighterPurchased(msg.sender, tokenId, tier);
        return tokenId;
    }
}
