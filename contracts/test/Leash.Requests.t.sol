// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {LeashTestBase} from "./Leash.Base.t.sol";
import {Leash} from "../Leash.sol";

// =============================================================================
// Category 6  – Payment requests (happy path + expiry)
// Category 7  – Request state machine
// Category 8  – Approved requests don't count toward daily limit
// Category 10 – getPendingRequests filtering
// Category 11 – View helpers (isAllowlisted, isBlocklisted, isRecipientPermitted)
// =============================================================================
contract LeashRequestsTest is LeashTestBase {

    // =========================================================================
    // Helpers specific to this category
    // =========================================================================

    /// Create a pending request from agent1 for 10 USDC, TTL=3600s.
    function _makeRequest() internal returns (uint256 reqId) {
        _addDefaultAgent();
        vm.prank(agent1);
        reqId = leash.requestPayment(walletId, recipient, 10e6, "memo", 3600);
    }

    // =========================================================================
    // 6. Payment requests – happy paths
    // =========================================================================

    function test_RequestPayment_ReservesAmount() public {
        (,, uint256 reservedBefore,,,) = leash.getWallet(walletId);
        _makeRequest();
        (,, uint256 reservedAfter,,,) = leash.getWallet(walletId);
        assertEq(reservedAfter - reservedBefore, 10e6);
    }

    function test_ApproveRequest_PaysRecipientAndReleasesReservation() public {
        uint256 reqId = _makeRequest();
        uint256 recipBefore = usdc.balanceOf(recipient);
        (, uint256 balBefore, uint256 resBefore,,,) = leash.getWallet(walletId);

        leash.approveRequest(reqId);

        uint256 recipAfter = usdc.balanceOf(recipient);
        (, uint256 balAfter, uint256 resAfter,,,) = leash.getWallet(walletId);

        assertEq(recipAfter - recipBefore, 10e6,  "recipient balance");
        assertEq(balBefore - balAfter, 10e6,      "wallet balance");
        assertEq(resBefore - resAfter, 10e6,      "wallet reserved");
    }

    function test_RejectRequest_ReleasesReservationWithoutPaying() public {
        uint256 reqId = _makeRequest();
        uint256 recipBefore = usdc.balanceOf(recipient);
        (,, uint256 resBefore,,,) = leash.getWallet(walletId);

        leash.rejectRequest(reqId);

        uint256 recipAfter = usdc.balanceOf(recipient);
        (,, uint256 resAfter,,,) = leash.getWallet(walletId);

        assertEq(recipAfter, recipBefore,        "recipient untouched");
        assertEq(resBefore - resAfter, 10e6,     "reservation released");

        Leash.PaymentRequest memory req = leash.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Leash.RequestStatus.REJECTED));
    }

    function test_ExpireRequest_ReleasesReservationAfterTTL() public {
        uint256 reqId = _makeRequest();
        (,, uint256 resBefore,,,) = leash.getWallet(walletId);

        // Warp past the TTL (3600 s).
        vm.warp(block.timestamp + 3601);

        // Anyone can call expireRequest.
        vm.prank(address(0xDEAD));
        leash.expireRequest(reqId);

        (,, uint256 resAfter,,,) = leash.getWallet(walletId);
        assertEq(resBefore - resAfter, 10e6);

        Leash.PaymentRequest memory req = leash.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Leash.RequestStatus.EXPIRED));
    }

    function test_ApproveRequest_AfterExpiry_RevertsRequestExpiredError() public {
        uint256 reqId = _makeRequest();
        vm.warp(block.timestamp + 3601);
        vm.expectRevert(Leash.RequestExpiredError.selector);
        leash.approveRequest(reqId);
    }

    function test_ApproveRequest_WalletPaused_OwnerCanStillApprove() public {
        // pause DOES NOT block approveRequest (owner is acting explicitly).
        uint256 reqId = _makeRequest();
        leash.pauseWallet(walletId, true);
        // Should NOT revert – owner approves despite wallet being paused.
        leash.approveRequest(reqId);
        Leash.PaymentRequest memory req = leash.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Leash.RequestStatus.APPROVED));
    }

    // =========================================================================
    // 7. Request state machine
    // =========================================================================

    function test_ApproveRequest_WhenAlreadyApproved_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        leash.approveRequest(reqId);
        vm.expectRevert(Leash.RequestNotPending.selector);
        leash.approveRequest(reqId);
    }

    function test_ApproveRequest_AfterReject_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        leash.rejectRequest(reqId);
        vm.expectRevert(Leash.RequestNotPending.selector);
        leash.approveRequest(reqId);
    }

    function test_RejectRequest_AfterApprove_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        leash.approveRequest(reqId);
        vm.expectRevert(Leash.RequestNotPending.selector);
        leash.rejectRequest(reqId);
    }

    // =========================================================================
    // 8. Approved requests don't count toward daily limit
    // =========================================================================

    function test_ApprovedRequests_DoNotCountTowardDailyLimit() public {
        _addDefaultAgent();

        // Exhaust daily limit via agentPay.
        _agentPay(10e6);
        _agentPay(10e6);  // spentToday == 20e6 == dailyLimit

        // Deposit more so balance isn't the issue.
        leash.deposit(walletId, 100e6);

        // Agent requests 5 USDC – this bypasses the daily-limit check.
        vm.prank(agent1);
        uint256 reqId = leash.requestPayment(walletId, recipient, 5e6, "req", 3600);

        // Owner approves – should succeed.
        leash.approveRequest(reqId);

        // spentToday did NOT change.
        assertEq(_spentToday(), 20e6, "spentToday must be unchanged after approveRequest");

        // A fresh agentPay (new day: warp) should work fine.
        vm.warp(block.timestamp + 86400);
        _agentPay(5e6);
        assertEq(_spentToday(), 5e6, "fresh day spend should be 5");
    }

    // =========================================================================
    // 10. getPendingRequests filtering
    // =========================================================================

    function test_GetPendingRequests_ReturnsOnlyPending() public {
        _addDefaultAgent();

        // Create four requests.
        vm.prank(agent1); uint256 rPending  = leash.requestPayment(walletId, recipient, 5e6,  "p",   3600);
        vm.prank(agent1); uint256 rApprove  = leash.requestPayment(walletId, recipient, 5e6,  "a",   3600);
        vm.prank(agent1); uint256 rReject   = leash.requestPayment(walletId, recipient, 5e6,  "r",   3600);
        vm.prank(agent1); uint256 rExpire   = leash.requestPayment(walletId, recipient, 5e6,  "e",   3600);

        // Settle three of them.
        leash.approveRequest(rApprove);
        leash.rejectRequest(rReject);
        vm.warp(block.timestamp + 3601);
        leash.expireRequest(rExpire);

        uint256[] memory pending = leash.getPendingRequests(walletId);
        assertEq(pending.length, 1);
        assertEq(pending[0], rPending);
    }

    // =========================================================================
    // 11. View helpers
    // =========================================================================

    function test_IsAllowlisted_ReturnsCorrectValue() public {
        assertFalse(leash.isAllowlisted(walletId, recipient));
        leash.setAllowlist(walletId, recipient, true);
        assertTrue(leash.isAllowlisted(walletId, recipient));
        leash.setAllowlist(walletId, recipient, false);
        assertFalse(leash.isAllowlisted(walletId, recipient));
    }

    function test_IsBlocklisted_ReturnsCorrectValue() public {
        assertFalse(leash.isBlocklisted(walletId, recipient));
        leash.setBlocklist(walletId, recipient, true);
        assertTrue(leash.isBlocklisted(walletId, recipient));
        leash.setBlocklist(walletId, recipient, false);
        assertFalse(leash.isBlocklisted(walletId, recipient));
    }

    function test_IsRecipientPermitted_AnyMode_TrueUnlessBlocked() public {
        // Mode = ANY by default
        assertTrue(leash.isRecipientPermitted(walletId, recipient));
        leash.setBlocklist(walletId, recipient, true);
        assertFalse(leash.isRecipientPermitted(walletId, recipient));
    }

    function test_IsRecipientPermitted_AllowlistMode() public {
        leash.setRecipientMode(walletId, Leash.RecipientMode.ALLOWLIST);
        // Not on allowlist → false
        assertFalse(leash.isRecipientPermitted(walletId, recipient));
        leash.setAllowlist(walletId, recipient, true);
        // On allowlist → true
        assertTrue(leash.isRecipientPermitted(walletId, recipient));
        // Blocklist overrides allowlist
        leash.setBlocklist(walletId, recipient, true);
        assertFalse(leash.isRecipientPermitted(walletId, recipient));
    }
}
