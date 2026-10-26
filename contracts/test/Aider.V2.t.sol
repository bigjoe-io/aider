// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AiderTestBase} from "./Aider.Base.t.sol";
import {Aider} from "../Aider.sol";

// =============================================================================
// v2 behaviour: every fix from the audit, plus the gaps the audit found in the
// v1 suite. Runs at a realistic time (a real UTC midnight + 10h), not at t=1.
// =============================================================================
contract AiderV2Test is AiderTestBase {
    uint256 internal constant T0 = 1_792_972_800; // 2026-10-26T00:00:00Z
    address internal constant RECIP2 = address(0xB2);

    function setUp() public override {
        vm.warp(T0 + 10 hours);
        super.setUp();
        _addDefaultAgent(); // 10 USDC per payment, 20 USDC per day, never expires
    }

    function _request(uint256 amount, uint256 ttl) internal returns (uint256 id) {
        vm.prank(agent1);
        id = aider.requestPayment(walletId, recipient, amount, "r", ttl);
    }

    function _status(uint256 id) internal view returns (Aider.RequestStatus) {
        return aider.getRequest(id).status;
    }

    // ---------------------------------------------------------------------
    // F1 / F16 / F22: paying the contract or the USDC token is refused
    // ---------------------------------------------------------------------

    function test_AgentPay_ToContract_RevertsInvalidRecipient() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.InvalidRecipient.selector);
        aider.agentPay(walletId, address(aider), 1e6, "x");
    }

    function test_AgentPay_ToUsdcToken_RevertsInvalidRecipient() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.InvalidRecipient.selector);
        aider.agentPay(walletId, USDC_ADDR, 1e6, "x");
    }

    function test_RequestPayment_ToContract_RevertsInvalidRecipient() public {
        vm.prank(agent1);
        vm.expectRevert(Aider.InvalidRecipient.selector);
        aider.requestPayment(walletId, address(aider), 1e6, "x", 600);
    }

    function test_IsRecipientPermitted_FalseForContractAndToken() public view {
        assertFalse(aider.isRecipientPermitted(walletId, address(aider)));
        assertFalse(aider.isRecipientPermitted(walletId, USDC_ADDR));
        assertFalse(aider.isRecipientPermitted(walletId, address(0)));
    }

    // ---------------------------------------------------------------------
    // F2 / F14 / F34: re-adding an agent keeps today's spend
    // ---------------------------------------------------------------------

    function test_ReAddSameDay_KeepsSpentToday() public {
        _agentPay(10e6);
        _agentPay(10e6);
        aider.revokeAgent(walletId, agent1);
        aider.addAgent(walletId, agent1, "agent1", PER_PAY, DAILY, 0);
        assertEq(_spentToday(), 20e6);
        vm.prank(agent1);
        vm.expectRevert(Aider.OverDailyLimit.selector);
        aider.agentPay(walletId, recipient, 1, "m");
    }

    function test_ReAddActiveAgent_ToRename_KeepsSpentToday() public {
        _agentPay(10e6);
        aider.addAgent(walletId, agent1, "renamed", PER_PAY, DAILY, 0);
        assertEq(_spentToday(), 10e6);
        (string memory label,,,,,,) = aider.getAgent(walletId, agent1);
        assertEq(label, "renamed");
    }

    function test_ReAddNextDay_ResetsSpentToday() public {
        _agentPay(10e6);
        aider.revokeAgent(walletId, agent1);
        vm.warp(T0 + 1 days + 1);
        aider.addAgent(walletId, agent1, "agent1", PER_PAY, DAILY, 0);
        assertEq(_spentToday(), 0);
        _agentPay(10e6);
        _agentPay(10e6);
    }

    // ---------------------------------------------------------------------
    // F3: the owner can't be an agent; F11: expiry must be in the future
    // ---------------------------------------------------------------------

    function test_AddAgent_Owner_RevertsOwnerCannotBeAgent() public {
        vm.expectRevert(Aider.OwnerCannotBeAgent.selector);
        aider.addAgent(walletId, owner, "me", 1e6, 1e6, 0);
    }

    function test_AddAgent_PastExpiry_RevertsInvalidExpiry() public {
        vm.expectRevert(Aider.InvalidExpiry.selector);
        aider.addAgent(walletId, agent2, "a2", 1e6, 1e6, block.timestamp);
    }

    function test_UpdateAgent_PastExpiry_RevertsInvalidExpiry() public {
        vm.expectRevert(Aider.InvalidExpiry.selector);
        aider.updateAgent(walletId, agent1, 1e6, 1e6, block.timestamp - 1);
    }

    function test_AddAgent_ZeroExpiry_MeansNever() public {
        aider.addAgent(walletId, agent2, "a2", 1e6, 1e6, 0);
        vm.warp(block.timestamp + 3650 days);
        vm.prank(agent2);
        aider.agentPay(walletId, recipient, 1e6, "still works");
    }

    // ---------------------------------------------------------------------
    // F9 / F13: revoking voids open requests (even after re-adding)
    // ---------------------------------------------------------------------

    function test_Revoke_VoidsOpenRequests_ApproveReverts() public {
        uint256 id = _request(50e6, 1800);
        aider.revokeAgent(walletId, agent1);
        vm.expectRevert(Aider.AgentRevokedError.selector);
        aider.approveRequest(id);
    }

    function test_Revoke_ThenReAdd_OldRequestStillVoid() public {
        uint256 id = _request(50e6, 1800);
        aider.revokeAgent(walletId, agent1);
        aider.addAgent(walletId, agent1, "agent1", PER_PAY, DAILY, 0);
        vm.expectRevert(Aider.AgentRevokedError.selector);
        aider.approveRequest(id);
        // A new request after re-adding is approvable.
        uint256 id2 = _request(5e6, 1800);
        aider.approveRequest(id2);
        assertEq(uint256(_status(id2)), uint256(Aider.RequestStatus.APPROVED));
    }

    function test_Revoke_AnyoneCanReleaseVoidRequestsAtOnce() public {
        uint256 id = _request(50e6, 1800);
        aider.revokeAgent(walletId, agent1);
        vm.prank(address(0xCAFE));
        aider.expireRequest(id);
        (, uint256 balance, uint256 reserved, uint256 available) = _wallet4();
        assertEq(reserved, 0);
        assertEq(available, balance);
        aider.withdraw(walletId, balance);
    }

    function test_ExpiredAgent_RequestNotApprovable_AndReleasable() public {
        aider.updateAgent(walletId, agent1, PER_PAY, DAILY, block.timestamp + 60);
        uint256 id = _request(5e6, 1800);
        vm.warp(block.timestamp + 61);
        vm.expectRevert(Aider.AgentExpired.selector);
        aider.approveRequest(id);
        (Aider.RequestStatus s, bool approvable, bool releasable) = aider.getRequestState(id);
        assertEq(uint256(s), uint256(Aider.RequestStatus.PENDING));
        assertFalse(approvable);
        assertTrue(releasable);
        aider.expireRequest(id);
    }

    // ---------------------------------------------------------------------
    // K1: unknown request ids
    // ---------------------------------------------------------------------

    function test_UnknownRequest_AllActionsRevertRequestNotFound() public {
        vm.expectRevert(Aider.RequestNotFound.selector);
        aider.approveRequest(999);
        vm.expectRevert(Aider.RequestNotFound.selector);
        aider.rejectRequest(999);
        vm.expectRevert(Aider.RequestNotFound.selector);
        aider.expireRequest(999);
        vm.expectRevert(Aider.RequestNotFound.selector);
        aider.getRequestState(999);
        uint256[] memory ids = new uint256[](1);
        ids[0] = 999;
        vm.expectRevert(Aider.RequestNotFound.selector);
        aider.expireRequests(ids);
    }

    // ---------------------------------------------------------------------
    // K3: TTL bounds; open-request cap
    // ---------------------------------------------------------------------

    function test_RequestTtl_Bounds() public {
        _request(1e6, 1);
        _request(1e6, 7 days);
        vm.startPrank(agent1);
        vm.expectRevert(Aider.InvalidTTL.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 0);
        vm.expectRevert(Aider.InvalidTTL.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 7 days + 1);
        vm.stopPrank();
    }

    function test_OpenRequestCap_TenThenTooMany_AndClosingFreesASlot() public {
        uint256 first;
        for (uint256 i = 0; i < 10; i++) {
            uint256 id = _request(1e6, 1800);
            if (i == 0) first = id;
        }
        assertEq(aider.openRequestCount(walletId, agent1), 10);
        vm.prank(agent1);
        vm.expectRevert(Aider.TooManyOpenRequests.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 1800);
        aider.rejectRequest(first);
        assertEq(aider.openRequestCount(walletId, agent1), 9);
        _request(1e6, 1800);
    }

    // ---------------------------------------------------------------------
    // K2: getAgent returns the effective spentToday
    // ---------------------------------------------------------------------

    function test_GetAgent_SpentTodayIsZeroAfterUtcMidnight() public {
        _agentPay(10e6);
        assertEq(_spentToday(), 10e6);
        vm.warp(T0 + 1 days);
        assertEq(_spentToday(), 0);
    }

    // ---------------------------------------------------------------------
    // K4: revoking a never-added address
    // ---------------------------------------------------------------------

    function test_RevokeNeverAddedAgent_RevertsAgentNotActive() public {
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.revokeAgent(walletId, agent2);
    }

    // ---------------------------------------------------------------------
    // Batch reject / release, pending set, getRequestState
    // ---------------------------------------------------------------------

    function test_RejectRequests_RejectsPendingAndSkipsSettled() public {
        uint256 a = _request(5e6, 1800);
        uint256 b = _request(6e6, 1800);
        uint256 c = _request(7e6, 1800);
        aider.approveRequest(a);
        uint256[] memory ids = new uint256[](3);
        (ids[0], ids[1], ids[2]) = (a, b, c);
        assertEq(aider.rejectRequests(ids), 2);
        assertEq(uint256(_status(b)), uint256(Aider.RequestStatus.REJECTED));
        assertEq(uint256(_status(c)), uint256(Aider.RequestStatus.REJECTED));
        assertEq(aider.getPendingRequests(walletId).length, 0);
        (,, uint256 reserved,) = _wallet4();
        assertEq(reserved, 0);
    }

    function test_RejectRequests_ByAgent_RevertsNotWalletOwner() public {
        uint256 a = _request(5e6, 1800);
        uint256[] memory ids = new uint256[](1);
        ids[0] = a;
        vm.prank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.rejectRequests(ids);
    }

    function test_ExpireRequests_ReleasesOnlyReleasable() public {
        uint256 shortTtl = _request(5e6, 60);
        uint256 longTtl = _request(6e6, 1800);
        vm.warp(block.timestamp + 61);
        uint256[] memory ids = new uint256[](2);
        (ids[0], ids[1]) = (shortTtl, longTtl);
        vm.prank(address(0xCAFE));
        assertEq(aider.expireRequests(ids), 1);
        assertEq(uint256(_status(shortTtl)), uint256(Aider.RequestStatus.EXPIRED));
        assertEq(uint256(_status(longTtl)), uint256(Aider.RequestStatus.PENDING));
        uint256[] memory pending = aider.getPendingRequests(walletId);
        assertEq(pending.length, 1);
        assertEq(pending[0], longTtl);
    }

    function test_GetPendingRequests_StillListsTtlPassedUntilReleased() public {
        uint256 id = _request(5e6, 60);
        vm.warp(block.timestamp + 61);
        assertEq(aider.getPendingRequests(walletId).length, 1);
        (, bool approvable, bool releasable) = aider.getRequestState(id);
        assertFalse(approvable);
        assertTrue(releasable);
        aider.expireRequest(id);
        assertEq(aider.getPendingRequests(walletId).length, 0);
    }

    // ---------------------------------------------------------------------
    // Gaps from the v1 suite (F8, F20, F21, F25–F33)
    // ---------------------------------------------------------------------

    function test_DailyLimit_HoldsAllUtcDay_ResetsAtMidnight() public {
        _agentPay(10e6);
        _agentPay(10e6);
        vm.warp(T0 + 86_399);
        vm.prank(agent1);
        vm.expectRevert(Aider.OverDailyLimit.selector);
        aider.agentPay(walletId, recipient, 1, "m");
        vm.warp(T0 + 86_400);
        _agentPay(10e6);
        _agentPay(10e6);
    }

    function test_DailyLimit_IsCalendarDay_NotRolling24h() public {
        vm.warp(T0 + 1 days + 23 hours + 59 minutes);
        _agentPay(10e6);
        _agentPay(10e6);
        vm.warp(T0 + 2 days + 60);
        _agentPay(10e6); // a rolling 24h window would still block this
    }

    function test_RequestPayment_RejectsRevokedStrangerPausedAndRecipientRules() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 600);

        aider.setBlocklist(walletId, RECIP2, true);
        vm.prank(agent1);
        vm.expectRevert(Aider.RecipientBlocked.selector);
        aider.requestPayment(walletId, RECIP2, 1e6, "r", 600);

        aider.setRecipientMode(walletId, Aider.RecipientMode.ALLOWLIST);
        vm.prank(agent1);
        vm.expectRevert(Aider.RecipientNotAllowed.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 600);
        aider.setRecipientMode(walletId, Aider.RecipientMode.ANY);

        aider.pauseWallet(walletId, true);
        vm.prank(agent1);
        vm.expectRevert(Aider.WalletPaused.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 600);
        aider.pauseWallet(walletId, false);

        aider.revokeAgent(walletId, agent1);
        vm.prank(agent1);
        vm.expectRevert(Aider.AgentRevokedError.selector);
        aider.requestPayment(walletId, recipient, 1e6, "r", 600);
    }

    function test_RequestPayment_CannotReserveSameFundsTwice() public {
        _request(60e6, 1800);
        vm.prank(agent1);
        vm.expectRevert(Aider.InsufficientBalance.selector);
        aider.requestPayment(walletId, recipient, 60e6, "r", 1800);
    }

    function test_ExpireRequest_BeforeAndAtTtl_Reverts_ApproveAtTtlWorks() public {
        uint256 id = _request(5e6, 1800);
        uint256 expiresAt = block.timestamp + 1800;
        vm.prank(agent1);
        vm.expectRevert(Aider.RequestNotExpiredYet.selector);
        aider.expireRequest(id);
        vm.warp(expiresAt);
        vm.expectRevert(Aider.RequestNotExpiredYet.selector);
        aider.expireRequest(id);
        aider.approveRequest(id);
    }

    function test_SettledRequests_CannotBeRejectedOrExpiredAgain() public {
        uint256 a = _request(5e6, 1800);
        uint256 b = _request(6e6, 1800);
        aider.approveRequest(a);
        aider.rejectRequest(b);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.rejectRequest(b);
        vm.warp(block.timestamp + 1801);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.expireRequest(a);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.expireRequest(b);
    }

    function test_RejectAndExpire_KeepBalance_FundsFullyWithdrawable() public {
        uint256 a = _request(30e6, 60);
        uint256 b = _request(20e6, 1800);
        aider.rejectRequest(b);
        vm.warp(block.timestamp + 61);
        aider.expireRequest(a);
        (, uint256 balance, uint256 reserved, uint256 available) = _wallet4();
        assertEq(balance, 100e6);
        assertEq(reserved, 0);
        assertEq(available, 100e6);
        aider.withdraw(walletId, 100e6);
        assertEq(usdc.balanceOf(address(aider)), 0);
    }

    function test_Agent_CannotCallAnyOwnerFunction() public {
        uint256 id = _request(5e6, 1800);
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        vm.startPrank(agent1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.rejectRequest(id);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.approveRequest(id);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.rejectRequests(ids);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.setRecipientMode(walletId, Aider.RecipientMode.ALLOWLIST);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.setAllowlist(walletId, address(0xBEEF), true);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.setBlocklist(walletId, recipient, false);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.updateAgent(walletId, agent1, 100e6, 100e6, 0);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.withdraw(walletId, 1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.deposit(walletId, 1);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.pauseWallet(walletId, true);
        vm.stopPrank();
    }

    function test_Allowlist_PositiveCase_ThenRemoval() public {
        aider.setRecipientMode(walletId, Aider.RecipientMode.ALLOWLIST);
        aider.setAllowlist(walletId, recipient, true);
        _agentPay(1e6);
        assertEq(usdc.balanceOf(recipient), 1e6);
        aider.setAllowlist(walletId, recipient, false);
        vm.prank(agent1);
        vm.expectRevert(Aider.RecipientNotAllowed.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");
    }

    function test_Pause_StopsEveryAgent_OwnerCanWithdrawAndApprove_UnpauseRestores() public {
        aider.addAgent(walletId, agent2, "a2", PER_PAY, DAILY, 0);
        uint256 id = _request(5e6, 1800);
        aider.pauseWallet(walletId, true);
        vm.prank(agent1);
        vm.expectRevert(Aider.WalletPaused.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");
        vm.prank(agent2);
        vm.expectRevert(Aider.WalletPaused.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");
        aider.withdraw(walletId, 10e6);
        aider.approveRequest(id);
        aider.pauseWallet(walletId, false);
        _agentPay(1e6);
    }

    function test_CrossWalletIsolation() public {
        address owner2 = address(0x0222);
        usdc.mint(owner2, 100e6);
        vm.startPrank(owner2);
        usdc.approve(address(aider), type(uint256).max);
        uint256 w2 = aider.createWallet();
        aider.deposit(w2, 50e6);
        aider.addAgent(w2, agent2, "a2", PER_PAY, DAILY, 0);
        vm.stopPrank();

        vm.prank(agent1);
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.agentPay(w2, recipient, 1e6, "m");
        vm.prank(agent2);
        vm.expectRevert(Aider.AgentNotActive.selector);
        aider.agentPay(walletId, recipient, 1e6, "m");

        uint256 id = _request(5e6, 1800);
        vm.startPrank(owner2);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.approveRequest(id);
        vm.expectRevert(Aider.NotWalletOwner.selector);
        aider.withdraw(walletId, 1);
        vm.stopPrank();
    }

    function test_UpdateAgent_NewLimitsAndExpiryAreEnforced() public {
        aider.updateAgent(walletId, agent1, 3e6, 4e6, block.timestamp + 60);
        (,,, uint256 expiresAt,,,) = aider.getAgent(walletId, agent1);
        assertEq(expiresAt, block.timestamp + 60);
        vm.prank(agent1);
        vm.expectRevert(Aider.OverPerPaymentLimit.selector);
        aider.agentPay(walletId, recipient, 3e6 + 1, "m");
        _agentPay(3e6);
        vm.prank(agent1);
        vm.expectRevert(Aider.OverDailyLimit.selector);
        aider.agentPay(walletId, recipient, 1e6 + 1, "m");
        vm.warp(block.timestamp + 61);
        vm.prank(agent1);
        vm.expectRevert(Aider.AgentExpired.selector);
        aider.agentPay(walletId, recipient, 1, "m");
    }

    function test_WithdrawBoundary_ReservationStillPays() public {
        uint256 id = _request(50e6, 1800);
        aider.withdraw(walletId, 50e6);
        vm.expectRevert(Aider.InsufficientBalance.selector);
        aider.withdraw(walletId, 1);
        aider.approveRequest(id);
        assertEq(usdc.balanceOf(recipient), 50e6);
        (, uint256 balance, uint256 reserved,) = _wallet4();
        assertEq(balance, 0);
        assertEq(reserved, 0);
    }

    function test_ApprovedRequest_DoesNotUseTodaysAllowance() public {
        uint256 id = _request(15e6, 1800);
        aider.approveRequest(id);
        assertEq(_spentToday(), 0);
        _agentPay(10e6);
        _agentPay(10e6);
    }

    function test_Events_PaymentRequestedAndLifecycle() public {
        uint256 nextId = aider.nextRequestId();
        vm.expectEmit(true, true, true, true, address(aider));
        emit Aider.PaymentRequested(nextId, walletId, agent1, recipient, 5e6, "r", block.timestamp + 600);
        uint256 id = _request(5e6, 600);
        assertEq(id, nextId);

        vm.expectEmit(true, true, false, false, address(aider));
        emit Aider.RequestApproved(id, walletId);
        aider.approveRequest(id);

        uint256 id2 = _request(5e6, 600);
        vm.expectEmit(true, true, false, false, address(aider));
        emit Aider.RequestRejected(id2, walletId);
        aider.rejectRequest(id2);

        vm.expectEmit(true, true, false, false, address(aider));
        emit Aider.AgentRevoked(walletId, agent1);
        aider.revokeAgent(walletId, agent1);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    function _wallet4() internal view returns (address o, uint256 balance, uint256 reserved, uint256 available) {
        (o, balance, reserved, available,,) = aider.getWallet(walletId);
    }
}
