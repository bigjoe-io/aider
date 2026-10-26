// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AiderTestBase} from "./Aider.Base.t.sol";
import {Aider} from "../Aider.sol";

// =============================================================================
// Category 1 – Wallet basics
// Category 2 – Agent management
// Category 3 – agentPay happy path
// =============================================================================
contract AiderCoreTest is AiderTestBase {

    // =========================================================================
    // 1. Wallet basics
    // =========================================================================

    function test_CreateWallet_ReturnsIncrementingIds() public {
        // walletId already created in setUp (== 1).
        assertEq(walletId, 1);
        uint256 id2 = aider.createWallet();
        assertEq(id2, 2);
        uint256 id3 = aider.createWallet();
        assertEq(id3, 3);
    }

    function test_Deposit_IncreasesBalance() public {
        (, uint256 before,,,,) = aider.getWallet(walletId);
        aider.deposit(walletId, 50e6);
        (, uint256 after_,,,,) = aider.getWallet(walletId);
        assertEq(after_ - before, 50e6);
    }

    function test_Deposit_TransfersFromOwner() public {
        uint256 ownerBefore = usdc.balanceOf(owner);
        uint256 contractBefore = usdc.balanceOf(address(aider));
        aider.deposit(walletId, 25e6);
        assertEq(usdc.balanceOf(owner), ownerBefore - 25e6);
        assertEq(usdc.balanceOf(address(aider)), contractBefore + 25e6);
    }

    function test_Withdraw_DecreasesBalance() public {
        (, uint256 balBefore,,,,) = aider.getWallet(walletId);
        aider.withdraw(walletId, 10e6);
        (, uint256 balAfter,,,,) = aider.getWallet(walletId);
        assertEq(balBefore - balAfter, 10e6);
    }

    function test_Withdraw_TransfersToOwner() public {
        uint256 ownerBefore = usdc.balanceOf(owner);
        aider.withdraw(walletId, 10e6);
        assertEq(usdc.balanceOf(owner), ownerBefore + 10e6);
    }

    function test_Withdraw_NonOwner_RevertsNotWalletOwner() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.withdraw(walletId, 10e6);
    }

    function test_Withdraw_OverAvailable_RevertsInsufficientBalance() public {
        // Wallet has 100 USDC, no reserved → available=100. Try 101.
        vm.expectRevert(Aider.InsufficientBalance.selector);
        aider.withdraw(walletId, 101e6);
    }

    function test_Withdraw_OverAvailableWithReserved_RevertsInsufficientBalance() public {
        // Reserve some via requestPayment then try to withdraw more than available.
        _addDefaultAgent();
        vm.prank(agent1);
        aider.requestPayment(walletId, recipient, 50e6, "m", 3600);
        // available = 100 - 50 = 50; try to withdraw 51.
        vm.expectRevert(Aider.InsufficientBalance.selector);
        aider.withdraw(walletId, 51e6);
    }

    function test_PauseWallet_NonOwner_RevertsNotWalletOwner() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.pauseWallet(walletId, true);
    }

    function test_PauseWallet_OwnerCanPause() public {
        aider.pauseWallet(walletId, true);
        (,,,, bool paused,) = aider.getWallet(walletId);
        assertTrue(paused);
    }

    // =========================================================================
    // 2. Agent management
    // =========================================================================

    function test_AddAgent_StoresCorrectConfig() public {
        aider.addAgent(walletId, agent1, "myAgent", 5e6, 15e6, 9999);
        (
            string memory label,
            uint256 perPay,
            uint256 daily,
            uint256 expiresAt,
            bool active,
            ,
        ) = aider.getAgent(walletId, agent1);
        assertEq(label, "myAgent");
        assertEq(perPay, 5e6);
        assertEq(daily, 15e6);
        assertEq(expiresAt, 9999);
        assertTrue(active);
    }

    function test_UpdateAgent_ChangesLimitsOnly() public {
        _addDefaultAgent();
        // Pay a little so spentToday > 0.
        _agentPay(5e6);
        uint256 spentBefore = _spentToday();

        aider.updateAgent(walletId, agent1, 8e6, 30e6, 0);

        (
            ,
            uint256 perPay,
            uint256 daily,
            ,
            bool active,
            uint256 spentAfter,
        ) = aider.getAgent(walletId, agent1);

        assertEq(perPay, 8e6);
        assertEq(daily, 30e6);
        assertTrue(active);                     // active unchanged
        assertEq(spentAfter, spentBefore);      // spentToday unchanged
    }

    function test_RevokeAgent_SetsActiveFalse() public {
        _addDefaultAgent();
        aider.revokeAgent(walletId, agent1);
        (,,,, bool active,,) = aider.getAgent(walletId, agent1);
        assertFalse(active);
    }

    function test_AddAgent_NonOwner_RevertsNotWalletOwner() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.addAgent(walletId, agent2, "x", 1e6, 2e6, 0);
    }

    function test_UpdateAgent_NonExistent_RevertsAgentNotActive() public {
        // agent1 was never added – _agentExists returns false → AgentNotActive
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.updateAgent(walletId, agent1, 1e6, 2e6, 0);
    }

    function test_RevokeAgent_NonOwner_RevertsNotWalletOwner() public {
        _addDefaultAgent();
        vm.prank(agent2);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.revokeAgent(walletId, agent1);
    }

    // =========================================================================
    // 3. agentPay happy path
    // =========================================================================

    function test_AgentPay_TransfersExactAmount() public {
        _addDefaultAgent();
        uint256 recipBefore = usdc.balanceOf(recipient);
        _agentPay(7e6);
        assertEq(usdc.balanceOf(recipient), recipBefore + 7e6);
    }

    function test_AgentPay_SpentTodayIncreases() public {
        _addDefaultAgent();
        _agentPay(7e6);
        assertEq(_spentToday(), 7e6);
        _agentPay(3e6);
        assertEq(_spentToday(), 10e6);
    }

    function test_AgentPay_WalletBalanceDecreases() public {
        _addDefaultAgent();
        (, uint256 balBefore,,,,) = aider.getWallet(walletId);
        _agentPay(5e6);
        (, uint256 balAfter,,,,) = aider.getWallet(walletId);
        assertEq(balBefore - balAfter, 5e6);
    }

    function test_AgentPay_EmitsAgentPaidEvent() public {
        _addDefaultAgent();
        vm.expectEmit(true, true, true, true, address(aider));
        emit Aider.AgentPaid(walletId, agent1, recipient, 6e6, "pay6");
        vm.prank(agent1);
        aider.agentPay(walletId, recipient, 6e6, "pay6");
    }
}
