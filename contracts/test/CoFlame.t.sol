// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CoFlameToken.sol";
import "../src/CoFlameLighter.sol";
import "../src/CoFlameFactory.sol";

contract CoFlameTest is Test {
    CoFlameToken token;
    CoFlameLighter lighter;
    CoFlameFactory factory;

    address owner = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address scanner = address(0x5CA);

    function setUp() public {
        token = new CoFlameToken(owner);
        lighter = new CoFlameLighter(owner);
        factory = new CoFlameFactory(address(lighter), address(token), owner);

        lighter.setFactory(address(factory));
        lighter.setScanner(scanner, true);

        // Give alice/bob some ETH
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);

        // Give alice some CFLAME for governance tests
        token.transfer(alice, 5000 ether);
    }

    // ── Token Tests ───────────────────────────────────────────
    function test_tokenSupply() public view {
        assertEq(token.totalSupply(), 100_000_000 ether);
    }

    function test_tokenName() public view {
        assertEq(token.name(), "CoFlame");
        assertEq(token.symbol(), "CFLAME");
    }

    function test_depositAndClaimProfit() public {
        // Owner has most tokens, alice has 5000
        uint256 deposit = 1 ether;
        token.depositProfit{value: deposit}();

        uint256 aliceEarned = token.earned(alice);
        // alice has 5000 / 100M of supply
        uint256 expected = (deposit * 5000 ether) / 100_000_000 ether;
        assertApproxEqAbs(aliceEarned, expected, 1);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        token.claimReward();
        assertApproxEqAbs(alice.balance - balBefore, expected, 1);
    }

    // ── Governance Tests ──────────────────────────────────────
    function test_proposeAndVote() public {
        vm.prank(alice);
        uint256 id = token.propose("New lighter design");
        assertEq(id, 1);

        vm.prank(alice);
        token.vote(id, true);

        (,,,uint256 forVotes,,,) = token.proposals(id);
        assertEq(forVotes, token.balanceOf(alice));
    }

    function test_executeProposal() public {
        vm.prank(alice);
        uint256 id = token.propose("Ship globally");

        vm.prank(alice);
        token.vote(id, true);

        vm.warp(block.timestamp + 3 days + 1);
        token.executeProposal(id);

        (,,,,,, bool executed) = token.proposals(id);
        assertTrue(executed);
    }

    function test_cannotVoteTwice() public {
        vm.prank(alice);
        uint256 id = token.propose("test");
        vm.prank(alice);
        token.vote(id, true);
        vm.prank(alice);
        vm.expectRevert("voted");
        token.vote(id, false);
    }

    // ── Lighter Tests ─────────────────────────────────────────
    function test_buyLighterCypherpunk() public {
        vm.prank(alice);
        uint256 tokenId = factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);
        assertEq(tokenId, 1);
        assertEq(lighter.ownerOf(1), alice);
    }

    function test_buyLighterDeGen() public {
        vm.prank(alice);
        uint256 tokenId = factory.buyLighter{value: 0.0015 ether}(CoFlameLighter.Tier.DeGen);
        assertEq(tokenId, 1);
        assertEq(lighter.ownerOf(1), alice);
    }

    function test_buyLighterOracle() public {
        vm.prank(alice);
        uint256 tokenId = factory.buyLighter{value: 0.005 ether}(CoFlameLighter.Tier.Oracle);
        assertEq(tokenId, 1);
    }

    function test_insufficientPayment() public {
        vm.prank(alice);
        vm.expectRevert("insufficient payment");
        factory.buyLighter{value: 0.0001 ether}(CoFlameLighter.Tier.Cypherpunk);
    }

    function test_recordScan() public {
        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        vm.prank(scanner);
        lighter.recordScan(1);

        (,,uint256 scanCount,,) = lighter.lighters(1);
        assertEq(scanCount, 1);
    }

    function test_unauthorizedScanner() public {
        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        vm.prank(bob);
        vm.expectRevert("not scanner");
        lighter.recordScan(1);
    }

    function test_revenueShareIncreases() public {
        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        uint256 baseBps = lighter.revenueShareBps(1);
        assertEq(baseBps, 300); // 3%

        vm.prank(scanner);
        lighter.recordScan(1);

        uint256 afterScan = lighter.revenueShareBps(1);
        assertEq(afterScan, 350); // 3% + 0.5%
    }

    function test_scanExpiry() public {
        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        // Warp past 90 days
        vm.warp(block.timestamp + 91 days);

        vm.prank(scanner);
        vm.expectRevert("expired");
        lighter.recordScan(1);
    }

    function test_revenueRouting() public {
        uint256 tokenBalBefore = address(token).balance;
        uint256 lighterBalBefore = address(lighter).balance;

        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        // 50% to token, 50% to lighter
        assertEq(address(token).balance - tokenBalBefore, 0.00025 ether);
        assertEq(address(lighter).balance - lighterBalBefore, 0.00025 ether);
    }

    function test_claimLighterRevenue() public {
        vm.prank(alice);
        factory.buyLighter{value: 0.0005 ether}(CoFlameLighter.Tier.Cypherpunk);

        // Deposit more revenue directly
        lighter.depositRevenue{value: 1 ether}();

        // Record some scans to increase share
        vm.prank(scanner);
        lighter.recordScan(1);

        uint256 pending = lighter.pendingRevenue(1);
        assertTrue(pending > 0);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        lighter.claimRevenue(1);
        assertTrue(alice.balance > balBefore);
    }

    function test_onlyFactoryCanMint() public {
        vm.prank(alice);
        vm.expectRevert("not factory");
        lighter.mint(alice, CoFlameLighter.Tier.Cypherpunk);
    }

    // ── Receive ETH ───────────────────────────────────────────
    receive() external payable {}
}
