// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {AiderTestBase} from "./Aider.Base.t.sol";
import {Aider} from "../Aider.sol";

// =============================================================================
// Category 6  – Payment requests (happy path + expiry)
// Category 7  – Request state machine
// Category 8  – Approved requests don't count toward daily limit
// Category 10 – getPendingRequests filtering
// Category 11 – View helpers (isAllowlisted, isBlocklisted, isRecipientPermitted)
// =============================================================================
contract AiderRequestsTest is AiderTestBase {

    // =========================================================================
    // Helpers specific to this category
    // =========================================================================

    /// Create a pending request from agent1 for 10 USDC, TTL=3600s.
    function _makeRequest() internal returns (uint256 reqId) {
        _addDefaultAgent();
        vm.prank(agent1);
        reqId = aider.requestPayment(walletId, recipient, 10e6, "memo", 3600);
    }

    // =========================================================================
    // 6. Payment requests – happy paths
    // =========================================================================

    function test_RequestPayment_ReservesAmount() public {
        (,, uint256 reservedBefore,,,) = aider.getWallet(walletId);
        _makeRequest();
        (,, uint256 reservedAfter,,,) = aider.getWallet(walletId);
        assertEq(reservedAfter - reservedBefore, 10e6);
    }

    function test_ApproveRequest_PaysRecipientAndReleasesReservation() public {
        uint256 reqId = _makeRequest();
        uint256 recipBefore = usdc.balanceOf(recipient);
        (, uint256 balBefore, uint256 resBefore,,,) = aider.getWallet(walletId);

        aider.approveRequest(reqId);

        uint256 recipAfter = usdc.balanceOf(recipient);
        (, uint256 balAfter, uint256 resAfter,,,) = aider.getWallet(walletId);

        assertEq(recipAfter - recipBefore, 10e6,  "recipient balance");
        assertEq(balBefore - balAfter, 10e6,      "wallet balance");
        assertEq(resBefore - resAfter, 10e6,      "wallet reserved");
    }

    function test_RejectRequest_ReleasesReservationWithoutPaying() public {
        uint256 reqId = _makeRequest();
        uint256 recipBefore = usdc.balanceOf(recipient);
        (,, uint256 resBefore,,,) = aider.getWallet(walletId);

        aider.rejectRequest(reqId);

        uint256 recipAfter = usdc.balanceOf(recipient);
        (,, uint256 resAfter,,,) = aider.getWallet(walletId);

        assertEq(recipAfter, recipBefore,        "recipient untouched");
        assertEq(resBefore - resAfter, 10e6,     "reservation released");

        Aider.PaymentRequest memory req = aider.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Aider.RequestStatus.REJECTED));
    }

    function test_ExpireRequest_ReleasesReservationAfterTTL() public {
        uint256 reqId = _makeRequest();
        (,, uint256 resBefore,,,) = aider.getWallet(walletId);

        // Warp past the TTL (3600 s).
        vm.warp(block.timestamp + 3601);

        // Anyone can call expireRequest.
        vm.prank(address(0xDEAD));
        aider.expireRequest(reqId);

        (,, uint256 resAfter,,,) = aider.getWallet(walletId);
        assertEq(resBefore - resAfter, 10e6);

        Aider.PaymentRequest memory req = aider.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Aider.RequestStatus.EXPIRED));
    }

    function test_ApproveRequest_AfterExpiry_RevertsRequestExpiredError() public {
        uint256 reqId = _makeRequest();
        vm.warp(block.timestamp + 3601);
        vm.expectRevert(Aider.RequestExpiredError.selector);
        aider.approveRequest(reqId);
    }

    function test_ApproveRequest_WalletPaused_OwnerCanStillApprove() public {
        // pause DOES NOT block approveRequest (owner is acting explicitly).
        uint256 reqId = _makeRequest();
        aider.pauseWallet(walletId, true);
        // Should NOT revert – owner approves despite wallet being paused.
        aider.approveRequest(reqId);
        Aider.PaymentRequest memory req = aider.getRequest(reqId);
        assertEq(uint8(req.status), uint8(Aider.RequestStatus.APPROVED));
    }

    // =========================================================================
    // 7. Request state machine
    // =========================================================================

    function test_ApproveRequest_WhenAlreadyApproved_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        aider.approveRequest(reqId);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.approveRequest(reqId);
    }

    function test_ApproveRequest_AfterReject_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        aider.rejectRequest(reqId);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.approveRequest(reqId);
    }

    function test_RejectRequest_AfterApprove_RevertsRequestNotPending() public {
        uint256 reqId = _makeRequest();
        aider.approveRequest(reqId);
        vm.expectRevert(Aider.RequestNotPending.selector);
        aider.rejectRequest(reqId);
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
        aider.deposit(walletId, 100e6);

        // Agent requests 5 USDC – this bypasses the daily-limit check.
        vm.prank(agent1);
        uint256 reqId = aider.requestPayment(walletId, recipient, 5e6, "req", 3600);

        // Owner approves – should succeed.
        aider.approveRequest(reqId);

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
        vm.prank(agent1); uint256 rPending  = aider.requestPayment(walletId, recipient, 5e6,  "p",   3600);
        vm.prank(agent1); uint256 rApprove  = aider.requestPayment(walletId, recipient, 5e6,  "a",   3600);
        vm.prank(agent1); uint256 rReject   = aider.requestPayment(walletId, recipient, 5e6,  "r",   3600);
        vm.prank(agent1); uint256 rExpire   = aider.requestPayment(walletId, recipient, 5e6,  "e",   3600);

        // Settle three of them.
        aider.approveRequest(rApprove);
        aider.rejectRequest(rReject);
        vm.warp(block.timestamp + 3601);
        aider.expireRequest(rExpire);

        uint256[] memory pending = aider.getPendingRequests(walletId);
        assertEq(pending.length, 1);
        assertEq(pending[0], rPending);
    }

    // =========================================================================
    // 11. View helpers
    // =========================================================================

    function test_IsAllowlisted_ReturnsCorrectValue() public {
        assertFalse(aider.isAllowlisted(walletId, recipient));
        aider.setAllowlist(walletId, recipient, true);
        assertTrue(aider.isAllowlisted(walletId, recipient));
        aider.setAllowlist(walletId, recipient, false);
        assertFalse(aider.isAllowlisted(walletId, recipient));
    }

    function test_IsBlocklisted_ReturnsCorrectValue() public {
        assertFalse(aider.isBlocklisted(walletId, recipient));
        aider.setBlocklist(walletId, recipient, true);
        assertTrue(aider.isBlocklisted(walletId, recipient));
        aider.setBlocklist(walletId, recipient, false);
        assertFalse(aider.isBlocklisted(walletId, recipient));
    }

    function test_IsRecipientPermitted_AnyMode_TrueUnlessBlocked() public {
        // Mode = ANY by default
        assertTrue(aider.isRecipientPermitted(walletId, recipient));
        aider.setBlocklist(walletId, recipient, true);
        assertFalse(aider.isRecipientPermitted(walletId, recipient));
    }

    function test_IsRecipientPermitted_AllowlistMode() public {
        aider.setRecipientMode(walletId, Aider.RecipientMode.ALLOWLIST);
        // Not on allowlist → false
        assertFalse(aider.isRecipientPermitted(walletId, recipient));
        aider.setAllowlist(walletId, recipient, true);
        // On allowlist → true
        assertTrue(aider.isRecipientPermitted(walletId, recipient));
        // Blocklist overrides allowlist
        aider.setBlocklist(walletId, recipient, true);
        assertFalse(aider.isRecipientPermitted(walletId, recipient));
    }
}
