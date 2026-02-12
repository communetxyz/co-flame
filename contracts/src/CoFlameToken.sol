// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CoFlameToken — $CFLAME governance + revenue-share token
/// @notice 100 M supply, 50% profit share to holders, on-chain governance
contract CoFlameToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 ether;

    // ── Revenue Distribution ──────────────────────────────────
    uint256 public totalProfitDeposited;
    uint256 public profitPerTokenStored; // scaled by 1e18
    mapping(address => uint256) public userProfitPerTokenPaid;
    mapping(address => uint256) public rewards;

    // ── Governance ────────────────────────────────────────────
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public constant PROPOSAL_THRESHOLD = 1000 ether; // need 1 000 CFLAME

    // ── Events ────────────────────────────────────────────────
    event ProfitDeposited(address indexed from, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event ProposalCreated(uint256 indexed id, address proposer, string description);
    event Voted(uint256 indexed id, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);

    constructor(address _owner) ERC20("CoFlame", "CFLAME") Ownable(_owner) {
        _mint(_owner, TOTAL_SUPPLY);
    }

    // ── Revenue helpers ───────────────────────────────────────
    modifier updateReward(address account) {
        if (account != address(0)) {
            rewards[account] = earned(account);
            userProfitPerTokenPaid[account] = profitPerTokenStored;
        }
        _;
    }

    function earned(address account) public view returns (uint256) {
        uint256 balance = balanceOf(account);
        return (balance * (profitPerTokenStored - userProfitPerTokenPaid[account])) / 1e18 + rewards[account];
    }

    /// @notice Deposit ETH profits for pro-rata distribution
    function depositProfit() external payable {
        require(msg.value > 0, "zero");
        require(totalSupply() > 0, "no supply");
        profitPerTokenStored += (msg.value * 1e18) / totalSupply();
        totalProfitDeposited += msg.value;
        emit ProfitDeposited(msg.sender, msg.value);
    }

    /// @notice Claim accumulated ETH rewards
    function claimReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "nothing");
        rewards[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: reward}("");
        require(ok, "transfer failed");
        emit RewardClaimed(msg.sender, reward);
    }

    // ── Governance ────────────────────────────────────────────
    function propose(string calldata description) external returns (uint256) {
        require(balanceOf(msg.sender) >= PROPOSAL_THRESHOLD, "below threshold");
        uint256 id = ++proposalCount;
        Proposal storage p = proposals[id];
        p.id = id;
        p.proposer = msg.sender;
        p.description = description;
        p.deadline = block.timestamp + VOTING_PERIOD;
        emit ProposalCreated(id, msg.sender, description);
        return id;
    }

    function vote(uint256 proposalId, bool support) external updateReward(msg.sender) {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "no proposal");
        require(block.timestamp < p.deadline, "ended");
        require(!p.hasVoted[msg.sender], "voted");
        uint256 weight = balanceOf(msg.sender);
        require(weight > 0, "no tokens");
        p.hasVoted[msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(p.id != 0, "no proposal");
        require(block.timestamp >= p.deadline, "not ended");
        require(!p.executed, "already executed");
        require(p.forVotes > p.againstVotes, "not passed");
        p.executed = true;
        emit ProposalExecuted(proposalId);
    }

    // ── Override transfers to update rewards ──────────────────
    function _update(address from, address to, uint256 value)
        internal
        override
        updateReward(from)
        updateReward(to)
    {
        super._update(from, to, value);
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
