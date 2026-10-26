// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AiderTestBase} from "./Aider.Base.t.sol";
import {Aider} from "../Aider.sol";

// =============================================================================
// Category 4  – agentPay revert paths
// Category 5  – Daily limit reset
// Category 9  – Access control: agents cannot call owner functions
// =============================================================================
contract AiderRevertsTest is AiderTestBase {

    // =========================================================================
    // 4a. agentPay – wallet-level reverts
    // =========================================================================

    function test_AgentPay_WalletPaused_RevertsWalletPaused() public {
        _addDefaultAgent();
        aider.pauseWallet(walletId, true);
        vm.prank(agent1);
        vm.expectRevert(Aider.WalletPaused.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_RevokedAgent_RevertsAgentRevokedError() public {
        _addDefaultAgent();
        aider.revokeAgent(walletId, agent1);
        vm.prank(agent1);
        vm.expectRevert(Aider.AgentRevokedError.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_ExpiredAgent_RevertsAgentExpired() public {
        // Agent expires 1 second from now, then warp past it.
        uint256 exp = block.timestamp + 1;
        aider.addAgent(walletId, agent1, "a", PER_PAY, DAILY, exp);
        vm.warp(block.timestamp + 2);
        vm.prank(agent1);
        vm.expectRevert(Aider.AgentExpired.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_UnknownCaller_RevertsAgentNotActive() public {
        // agent1 was never added → _agentExists = false → AgentNotActive
        vm.prank(agent1);
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_RecipientBlocked_RevertsRecipientBlocked() public {
        _addDefaultAgent();
        aider.setBlocklist(walletId, recipient, true);
        vm.prank(agent1);
        vm.expectRevert(Aider.RecipientBlocked.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_AllowlistMode_RecipientNotAllowed_Reverts() public {
        _addDefaultAgent();
        aider.setRecipientMode(walletId, Aider.RecipientMode.ALLOWLIST);
        // recipient is NOT on the allowlist
        vm.prank(agent1);
        vm.expectRevert(Aider.RecipientNotAllowed.selector);
        aider.agentPay(walletId, recipient, 5e6, "m");
    }

    function test_AgentPay_OverPerPaymentLimit_Reverts() public {
        _addDefaultAgent();  // perPaymentLimit = 10 USDC
        vm.prank(agent1);
        vm.expectRevert(Aider.OverPerPaymentLimit.selector);
        aider.agentPay(walletId, recipient, 11e6, "m");
    }

    function test_AgentPay_OverDailyLimit_Reverts() public {
        _addDefaultAgent();  // dailyLimit = 20 USDC; pay 10+10=20 first
        _agentPay(10e6);
        _agentPay(10e6);
        // now spentToday == dailyLimit, next 1 USDC should trigger OverDailyLimit
        vm.prank(agent1);
        vm.expectRevert(Aider.OverDailyLimit.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");
    }

    function test_AgentPay_InsufficientBalance_Reverts() public {
        // Wallet has 100 USDC; reserve 95 via requestPayment so available=5.
        _addDefaultAgent();
        // Use a second independent agent for requestPayment (needs higher limits).
        aider.addAgent(walletId, agent2, "big", 100e6, 200e6, 0);
        vm.prank(agent2);
        aider.requestPayment(walletId, recipient, 95e6, "res", 3600);
        // available = 100 - 95 = 5; agent1 tries 6 USDC → InsufficientBalance
        vm.prank(agent1);
        vm.expectRevert(Aider.InsufficientBalance.selector);
        aider.agentPay(walletId, recipient, 6e6, "m");
    }

    // =========================================================================
    // 5. Daily limit reset after warp
    // =========================================================================

    function test_DailyLimitReset_AfterWarp_AllowsFreshPayment() public {
        _addDefaultAgent();  // dailyLimit = 20 USDC
        _agentPay(10e6);
        _agentPay(10e6);  // now at daily limit

        // Confirm we're at limit.
        vm.prank(agent1);
        vm.expectRevert(Aider.OverDailyLimit.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");

        // Warp 1 full day forward.
        vm.warp(block.timestamp + 86400);

        // Payment that would have failed should now succeed.
        _agentPay(5e6);
        assertEq(_spentToday(), 5e6);
    }

    // =========================================================================
    // 9. Access control: agents cannot call owner functions
    // =========================================================================

    function test_Agent_CannotDeposit() public {
        _addDefaultAgent();
        // agent1 needs some USDC to even attempt; seed it
        usdc.mint(agent1, 10e6);
        vm.startPrank(agent1);
        usdc.approve(address(aider), type(uint256).max);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.deposit(walletId, 5e6);
        vm.stopPrank();
    }

    function test_Agent_CannotWithdraw() public {
        _addDefaultAgent();
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.withdraw(walletId, 5e6);
    }

    function test_Agent_CannotAddAgent() public {
        _addDefaultAgent();
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.addAgent(walletId, agent2, "x", 1e6, 2e6, 0);
    }

    function test_Agent_CannotUpdateAgent() public {
        _addDefaultAgent();
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.updateAgent(walletId, agent1, 1e6, 2e6, 0);
    }

    function test_Agent_CannotRevokeAgent() public {
        _addDefaultAgent();
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.revokeAgent(walletId, agent1);
    }

    function test_Agent_CannotApproveRequest() public {
        _addDefaultAgent();
        vm.prank(agent1);
        uint256 reqId = aider.requestPayment(walletId, recipient, 5e6, "m", 3600);
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.approveRequest(reqId);
    }

    function test_Agent_CannotPauseWallet() public {
        _addDefaultAgent();
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.pauseWallet(walletId, true);
    }
}
