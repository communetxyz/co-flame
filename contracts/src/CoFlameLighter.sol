// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CoFlameLighter — ERC-721 NFT representing a physical lighter
contract CoFlameLighter is ERC721, Ownable {
    enum Tier { Cypherpunk, DeGen, Oracle }

    struct LighterInfo {
        Tier tier;
        uint256 mintedAt;
        uint256 scanCount;
        uint256 lastScanAt;
        uint256 claimedRevenue;
    }

    // Tier parameters
    struct TierParams {
        uint256 price;        // in wei
        uint256 baseBps;      // base revenue share in bps (100 = 1%)
        uint256 scanBonusBps; // additional bps per scan
        uint256 duration;     // active duration in seconds
    }

    uint256 public nextTokenId = 1;
    mapping(uint256 => LighterInfo) public lighters;
    mapping(Tier => TierParams) public tierParams;
    mapping(address => bool) public authorizedScanners;

    address public factory;
    address public revenuePool; // CoFlameToken address for profit deposits

    event LighterMinted(uint256 indexed tokenId, address indexed owner, Tier tier);
    event ScanRecorded(uint256 indexed tokenId, uint256 scanCount, uint256 timestamp);
    event RevenueClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);

    modifier onlyScanner() {
        require(authorizedScanners[msg.sender], "not scanner");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "not factory");
        _;
    }

    constructor(address _owner) ERC721("CoFlame Lighter", "LIGHTER") Ownable(_owner) {
        // Cypherpunk: $1 equiv, 3% base, +0.5%/scan, 90 days
        tierParams[Tier.Cypherpunk] = TierParams(0.0005 ether, 300, 50, 90 days);
        // DeGen: $3 equiv, 8% base, +1%/scan, 120 days
        tierParams[Tier.DeGen] = TierParams(0.0015 ether, 800, 100, 120 days);
        // Oracle: $5 equiv, 15% base, +1.5%/scan, 180 days
        tierParams[Tier.Oracle] = TierParams(0.005 ether, 1500, 150, 180 days);
    }

    function setFactory(address _factory) external onlyOwner {
        factory = _factory;
    }

    function setRevenuePool(address _pool) external onlyOwner {
        revenuePool = _pool;
    }

    function setScanner(address scanner, bool authorized) external onlyOwner {
        authorizedScanners[scanner] = authorized;
    }

    /// @notice Mint a lighter NFT — called by factory on purchase
    function mint(address to, Tier tier) external onlyFactory returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        lighters[tokenId] = LighterInfo({
            tier: tier,
            mintedAt: block.timestamp,
            scanCount: 0,
            lastScanAt: 0,
            claimedRevenue: 0
        });
        emit LighterMinted(tokenId, to, tier);
        return tokenId;
    }

    /// @notice Record a proof-of-possession scan
    function recordScan(uint256 tokenId) external onlyScanner {
        require(_ownerOf(tokenId) != address(0), "nonexistent");
        LighterInfo storage info = lighters[tokenId];
        require(_isActive(tokenId), "expired");
        info.scanCount++;
        info.lastScanAt = block.timestamp;
        emit ScanRecorded(tokenId, info.scanCount, block.timestamp);
    }

    /// @notice Calculate accumulated revenue share (in bps of revenue pool)
    function revenueShareBps(uint256 tokenId) public view returns (uint256) {
        LighterInfo storage info = lighters[tokenId];
        TierParams storage tp = tierParams[info.tier];
        return tp.baseBps + (info.scanCount * tp.scanBonusBps);
    }

    /// @notice Check if lighter's revenue-share window is still active
    function _isActive(uint256 tokenId) internal view returns (bool) {
        LighterInfo storage info = lighters[tokenId];
        TierParams storage tp = tierParams[info.tier];
        return block.timestamp <= info.mintedAt + tp.duration;
    }

    function isActive(uint256 tokenId) external view returns (bool) {
        return _isActive(tokenId);
    }

    /// @notice Claim revenue share — sends ETH from this contract's balance
    function claimRevenue(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        uint256 share = pendingRevenue(tokenId);
        require(share > 0, "nothing to claim");
        lighters[tokenId].claimedRevenue += share;
        (bool ok,) = msg.sender.call{value: share}("");
        require(ok, "transfer failed");
        emit RevenueClaimed(tokenId, msg.sender, share);
    }

    /// @notice Pending claimable revenue for a lighter
    function pendingRevenue(uint256 tokenId) public view returns (uint256) {
        uint256 totalPool = address(this).balance + lighters[tokenId].claimedRevenue;
        uint256 shareBps = revenueShareBps(tokenId);
        uint256 totalEntitled = (totalPool * shareBps) / 10_000;
        if (totalEntitled <= lighters[tokenId].claimedRevenue) return 0;
        return totalEntitled - lighters[tokenId].claimedRevenue;
    }

    /// @notice Deposit revenue into this contract for lighter holders
    function depositRevenue() external payable {}

    receive() external payable {}
}
