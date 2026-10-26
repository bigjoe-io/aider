// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title Aider: a USDC wallet for AI agents on Arc
/// @notice A human owner keeps USDC in a wallet inside this contract and gives AI agents their own keys
/// with spending limits. Payments within the limits go through immediately; bigger ones become
/// approval requests with the funds reserved; the owner can revoke an agent or pause the wallet at once.
/// @dev v2 of the contract first deployed as `Leash`. Every v1 function, event and error keeps its exact
/// signature, so clients written for v1 keep working; v2 only adds checks, views and batch helpers.
contract Aider is ReentrancyGuard {
    using EnumerableSet for EnumerableSet.UintSet;

    /// @notice USDC on Arc, used through its ERC-20 interface (6 decimals).
    address public constant USDC_TOKEN = 0x3600000000000000000000000000000000000000;

    /// @notice Longest time an approval request can stay open.
    uint256 public constant MAX_REQUEST_TTL = 7 days;

    /// @notice Most approval requests one agent can have open in one wallet at the same time.
    uint256 public constant MAX_OPEN_REQUESTS_PER_AGENT = 10;

    enum RecipientMode {
        ANY,
        ALLOWLIST
    }

    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED,
        EXPIRED
    }

    struct Wallet {
        address owner;
        uint256 balance;
        uint256 reserved;
        bool paused;
        RecipientMode mode;
    }

    struct Agent {
        string label;
        uint256 perPaymentLimit;
        uint256 dailyLimit;
        uint256 expiresAt;
        bool active;
        uint256 spentToday;
        uint256 dayStart;
    }

    struct PaymentRequest {
        uint256 walletId;
        address agent;
        address to;
        uint256 amount;
        string memo;
        uint256 expiresAt;
        RequestStatus status;
    }

    error NotWalletOwner();
    error WalletPaused();
    error AgentNotActive();
    error AgentRevokedError();
    error AgentExpired();
    error RecipientNotAllowed();
    error RecipientBlocked();
    error OverPerPaymentLimit();
    error OverDailyLimit();
    error InsufficientBalance();
    error RequestNotPending();
    error RequestExpiredError();
    error ZeroAmount();
    error ZeroAddress();
    error InvalidTTL();
    error RequestNotExpiredYet();
    // v2
    error RequestNotFound();
    error InvalidRecipient();
    error OwnerCannotBeAgent();
    error InvalidExpiry();
    error TooManyOpenRequests();

    event WalletCreated(uint256 indexed walletId, address indexed owner);
    event Deposited(uint256 indexed walletId, uint256 amount);
    event Withdrawn(uint256 indexed walletId, uint256 amount);
    event WalletPausedEvent(uint256 indexed walletId, bool paused);
    event AgentAdded(uint256 indexed walletId, address indexed agent, string label);
    event AgentUpdated(uint256 indexed walletId, address indexed agent);
    event AgentRevoked(uint256 indexed walletId, address indexed agent);
    event AgentPaid(
        uint256 indexed walletId,
        address indexed agent,
        address indexed to,
        uint256 amount,
        string memo
    );
    event PaymentRequested(
        uint256 indexed requestId,
        uint256 indexed walletId,
        address indexed agent,
        address to,
        uint256 amount,
        string memo,
        uint256 expiresAt
    );
    event RequestApproved(uint256 indexed requestId, uint256 indexed walletId);
    event RequestRejected(uint256 indexed requestId, uint256 indexed walletId);
    event RequestExpired(uint256 indexed requestId, uint256 indexed walletId);
    event RecipientModeSet(uint256 indexed walletId, RecipientMode mode);
    event AllowlistUpdated(uint256 indexed walletId, address recipient, bool allowed);
    event BlocklistUpdated(uint256 indexed walletId, address recipient, bool blocked);

    uint256 private _nextWalletId = 1;
    uint256 private _nextRequestId = 1;

    mapping(uint256 => Wallet) private _wallets;
    mapping(uint256 => mapping(address => Agent)) private _agents;
    mapping(uint256 => PaymentRequest) private _requests;

    mapping(uint256 => mapping(address => bool)) private _allowlist;
    mapping(uint256 => mapping(address => bool)) private _blocklist;

    /// @dev Open (status PENDING) request ids per wallet, so listing them costs O(open requests).
    mapping(uint256 => EnumerableSet.UintSet) private _pendingRequests;
    /// @dev Open requests per wallet and agent, capped at MAX_OPEN_REQUESTS_PER_AGENT.
    mapping(uint256 => mapping(address => uint256)) private _openRequestCount;
    /// @dev Bumped on every revoke. A request is only valid while the epoch it was made in is current,
    /// so revoking an agent voids its open requests, even if the agent is added again later.
    mapping(uint256 => mapping(address => uint256)) private _agentEpoch;
    mapping(uint256 => uint256) private _requestEpoch;

    modifier _onlyWalletOwner(uint256 walletId) {
        if (_wallets[walletId].owner != msg.sender) revert NotWalletOwner();
        _;
    }

    // ---------------------------------------------------------------------
    // Wallets
    // ---------------------------------------------------------------------

    /// @notice Creates a wallet owned by the caller.
    /// @return walletId The new wallet's id (ids start at 1).
    function createWallet() external returns (uint256 walletId) {
        walletId = _nextWalletId;
        _nextWalletId++;

        _wallets[walletId] = Wallet({
            owner: msg.sender,
            balance: 0,
            reserved: 0,
            paused: false,
            mode: RecipientMode.ANY
        });

        emit WalletCreated(walletId, msg.sender);
    }

    /// @notice Moves `amount` USDC from the owner into the wallet. The owner must first approve this
    /// contract on the USDC token. Only the wallet's owner can deposit.
    function deposit(uint256 walletId, uint256 amount) external nonReentrant _onlyWalletOwner(walletId) {
        if (amount == 0) revert ZeroAmount();

        _wallets[walletId].balance += amount;

        bool ok = IERC20(USDC_TOKEN).transferFrom(msg.sender, address(this), amount);
        require(ok, "USDC_TRANSFER_FROM_FAILED");

        emit Deposited(walletId, amount);
    }

    /// @notice Sends `amount` of the wallet's unreserved USDC to the owner. Works while paused.
    function withdraw(uint256 walletId, uint256 amount) external nonReentrant _onlyWalletOwner(walletId) {
        if (amount == 0) revert ZeroAmount();

        Wallet storage wallet = _wallets[walletId];
        uint256 available = wallet.balance - wallet.reserved;
        if (available < amount) revert InsufficientBalance();

        wallet.balance -= amount;

        bool ok = IERC20(USDC_TOKEN).transfer(msg.sender, amount);
        require(ok, "USDC_TRANSFER_FAILED");

        emit Withdrawn(walletId, amount);
    }

    /// @notice Pauses or resumes every agent of the wallet. Owner actions keep working while paused.
    function pauseWallet(uint256 walletId, bool paused) external _onlyWalletOwner(walletId) {
        _wallets[walletId].paused = paused;
        emit WalletPausedEvent(walletId, paused);
    }

    // ---------------------------------------------------------------------
    // Agents
    // ---------------------------------------------------------------------

    /// @notice Gives `agentAddress` a spending key on the wallet, or re-enables / relabels an existing
    /// agent. Re-adding an agent keeps what it already spent today, so it can't reset its daily limit.
    /// @param expiresAt Unix time after which the key stops working, or 0 for no expiry.
    function addAgent(
        uint256 walletId,
        address agentAddress,
        string calldata label,
        uint256 perPaymentLimit,
        uint256 dailyLimit,
        uint256 expiresAt
    ) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();
        if (agentAddress == msg.sender) revert OwnerCannotBeAgent();
        _requireValidExpiry(expiresAt);

        Agent storage agent = _agents[walletId][agentAddress];
        uint256 today = _dayStart(block.timestamp);
        uint256 carried = (_agentExists(agent) && agent.dayStart == today) ? agent.spentToday : 0;

        agent.label = label;
        agent.perPaymentLimit = perPaymentLimit;
        agent.dailyLimit = dailyLimit;
        agent.expiresAt = expiresAt;
        agent.active = true;
        agent.spentToday = carried;
        agent.dayStart = today;

        emit AgentAdded(walletId, agentAddress, label);
    }

    /// @notice Changes an existing agent's limits and expiry. Does not re-enable a revoked agent.
    function updateAgent(
        uint256 walletId,
        address agentAddress,
        uint256 perPaymentLimit,
        uint256 dailyLimit,
        uint256 expiresAt
    ) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();
        _requireValidExpiry(expiresAt);

        Agent storage agent = _agents[walletId][agentAddress];
        if (!_agentExists(agent)) revert AgentNotActive();

        agent.perPaymentLimit = perPaymentLimit;
        agent.dailyLimit = dailyLimit;
        agent.expiresAt = expiresAt;

        emit AgentUpdated(walletId, agentAddress);
    }

    /// @notice Revokes an agent immediately. Its open approval requests become void: they can't be
    /// approved any more and anyone can release their reservations with expireRequest.
    function revokeAgent(uint256 walletId, address agentAddress) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();

        Agent storage agent = _agents[walletId][agentAddress];
        if (!_agentExists(agent)) revert AgentNotActive();

        agent.active = false;
        _agentEpoch[walletId][agentAddress]++;

        emit AgentRevoked(walletId, agentAddress);
    }

    // ---------------------------------------------------------------------
    // Recipient rules
    // ---------------------------------------------------------------------

    /// @notice Lets agents pay anyone (ANY) or only allowlisted recipients (ALLOWLIST).
    function setRecipientMode(uint256 walletId, RecipientMode mode) external _onlyWalletOwner(walletId) {
        _wallets[walletId].mode = mode;
        emit RecipientModeSet(walletId, mode);
    }

    /// @notice Adds `recipient` to (or removes it from) the wallet's allowlist.
    function setAllowlist(uint256 walletId, address recipient, bool allowed) external _onlyWalletOwner(walletId) {
        _allowlist[walletId][recipient] = allowed;
        emit AllowlistUpdated(walletId, recipient, allowed);
    }

    /// @notice Adds `recipient` to (or removes it from) the wallet's blocklist. Blocked always wins.
    function setBlocklist(uint256 walletId, address recipient, bool blocked) external _onlyWalletOwner(walletId) {
        _blocklist[walletId][recipient] = blocked;
        emit BlocklistUpdated(walletId, recipient, blocked);
    }

    // ---------------------------------------------------------------------
    // Agent payments
    // ---------------------------------------------------------------------

    /// @notice Pays `amount` USDC from the wallet to `to`, if every rule passes. Called by an agent.
    function agentPay(
        uint256 walletId,
        address to,
        uint256 amount,
        string calldata memo
    ) external nonReentrant {
        Wallet storage wallet = _wallets[walletId];
        require(wallet.owner != address(0), "WALLET_NOT_FOUND");

        Agent storage agent = _agents[walletId][msg.sender];
        _requireAgentCanAct(agent);

        if (wallet.paused) revert WalletPaused();
        _requireValidRecipient(to);
        if (amount == 0) revert ZeroAmount();

        if (_blocklist[walletId][to]) revert RecipientBlocked();
        if (wallet.mode == RecipientMode.ALLOWLIST && !_allowlist[walletId][to]) revert RecipientNotAllowed();

        if (amount > agent.perPaymentLimit) revert OverPerPaymentLimit();

        _refreshDailySpend(agent);
        if (agent.spentToday + amount > agent.dailyLimit) revert OverDailyLimit();

        if (wallet.balance - wallet.reserved < amount) revert InsufficientBalance();

        agent.spentToday += amount;
        wallet.balance -= amount;

        bool ok = IERC20(USDC_TOKEN).transfer(to, amount);
        require(ok, "USDC_TRANSFER_FAILED");

        emit AgentPaid(walletId, msg.sender, to, amount, memo);
    }

    // ---------------------------------------------------------------------
    // Approval requests
    // ---------------------------------------------------------------------

    /// @notice Asks the owner to approve a payment, usually one over the agent's limits. Reserves
    /// `amount` so it can't be spent twice. Recipient rules apply.
    /// @param ttlSeconds How long the owner has to approve, 1 second to MAX_REQUEST_TTL.
    function requestPayment(
        uint256 walletId,
        address to,
        uint256 amount,
        string calldata memo,
        uint256 ttlSeconds
    ) external nonReentrant returns (uint256 requestId) {
        Wallet storage wallet = _wallets[walletId];
        require(wallet.owner != address(0), "WALLET_NOT_FOUND");

        Agent storage agent = _agents[walletId][msg.sender];
        _requireAgentCanAct(agent);

        if (wallet.paused) revert WalletPaused();
        _requireValidRecipient(to);
        if (amount == 0) revert ZeroAmount();
        if (ttlSeconds == 0 || ttlSeconds > MAX_REQUEST_TTL) revert InvalidTTL();

        if (_blocklist[walletId][to]) revert RecipientBlocked();
        if (wallet.mode == RecipientMode.ALLOWLIST && !_allowlist[walletId][to]) revert RecipientNotAllowed();

        if (_openRequestCount[walletId][msg.sender] >= MAX_OPEN_REQUESTS_PER_AGENT) revert TooManyOpenRequests();

        if (wallet.balance - wallet.reserved < amount) revert InsufficientBalance();

        wallet.reserved += amount;

        requestId = _nextRequestId;
        _nextRequestId++;

        uint256 expiresAt = block.timestamp + ttlSeconds;
        _requests[requestId] = PaymentRequest({
            walletId: walletId,
            agent: msg.sender,
            to: to,
            amount: amount,
            memo: memo,
            expiresAt: expiresAt,
            status: RequestStatus.PENDING
        });

        _requestEpoch[requestId] = _agentEpoch[walletId][msg.sender];
        _pendingRequests[walletId].add(requestId);
        _openRequestCount[walletId][msg.sender]++;

        emit PaymentRequested(requestId, walletId, msg.sender, to, amount, memo, expiresAt);
    }

    /// @notice Approves and pays a request. Owner only, before the request's TTL ends, while the
    /// requesting agent is still active and unexpired, and only if the recipient is still allowed.
    /// Approved payments don't count toward the agent's daily limit.
    function approveRequest(uint256 requestId) external nonReentrant {
        PaymentRequest storage request = _requests[requestId];
        if (request.agent == address(0)) revert RequestNotFound();
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();

        Wallet storage wallet = _wallets[request.walletId];
        if (wallet.owner != msg.sender) revert NotWalletOwner();

        if (block.timestamp > request.expiresAt) revert RequestExpiredError();

        (bool agentRevoked, bool agentExpired) = _requestAgentState(requestId, request);
        if (agentRevoked) revert AgentRevokedError();
        if (agentExpired) revert AgentExpired();

        if (_blocklist[request.walletId][request.to]) revert RecipientBlocked();
        if (wallet.mode == RecipientMode.ALLOWLIST && !_allowlist[request.walletId][request.to]) {
            revert RecipientNotAllowed();
        }

        request.status = RequestStatus.APPROVED;
        _closeRequest(requestId, request);
        wallet.reserved -= request.amount;
        wallet.balance -= request.amount;

        bool ok = IERC20(USDC_TOKEN).transfer(request.to, request.amount);
        require(ok, "USDC_TRANSFER_FAILED");

        emit RequestApproved(requestId, request.walletId);
    }

    /// @notice Rejects a request and releases its reservation. Owner only.
    function rejectRequest(uint256 requestId) external {
        PaymentRequest storage request = _requests[requestId];
        if (request.agent == address(0)) revert RequestNotFound();
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();
        if (_wallets[request.walletId].owner != msg.sender) revert NotWalletOwner();

        _reject(requestId, request);
    }

    /// @notice Rejects several requests in one transaction. Owner of every request's wallet only.
    /// Requests that are no longer pending are skipped.
    /// @return rejected How many requests were rejected.
    function rejectRequests(uint256[] calldata requestIds) external returns (uint256 rejected) {
        for (uint256 i = 0; i < requestIds.length; i++) {
            PaymentRequest storage request = _requests[requestIds[i]];
            if (request.agent == address(0)) revert RequestNotFound();
            if (_wallets[request.walletId].owner != msg.sender) revert NotWalletOwner();
            if (request.status != RequestStatus.PENDING) continue;

            _reject(requestIds[i], request);
            rejected++;
        }
    }

    /// @notice Releases a request's reservation once its TTL has passed, or at any time if the agent
    /// that made it was revoked or has expired. Anyone can call it.
    function expireRequest(uint256 requestId) external {
        PaymentRequest storage request = _requests[requestId];
        if (request.agent == address(0)) revert RequestNotFound();
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();
        if (!_isReleasable(requestId, request)) revert RequestNotExpiredYet();

        _expire(requestId, request);
    }

    /// @notice Releases several requests in one transaction (see expireRequest). Anyone can call it.
    /// Requests that are not pending, or not yet releasable, are skipped.
    /// @return expired How many requests were released.
    function expireRequests(uint256[] calldata requestIds) external returns (uint256 expired) {
        for (uint256 i = 0; i < requestIds.length; i++) {
            PaymentRequest storage request = _requests[requestIds[i]];
            if (request.agent == address(0)) revert RequestNotFound();
            if (request.status != RequestStatus.PENDING || !_isReleasable(requestIds[i], request)) continue;

            _expire(requestIds[i], request);
            expired++;
        }
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getWallet(
        uint256 walletId
    )
        external
        view
        returns (
            address owner,
            uint256 balance,
            uint256 reserved,
            uint256 available,
            bool paused,
            RecipientMode mode
        )
    {
        Wallet storage wallet = _wallets[walletId];
        owner = wallet.owner;
        balance = wallet.balance;
        reserved = wallet.reserved;
        available = balance >= reserved ? balance - reserved : 0;
        paused = wallet.paused;
        mode = wallet.mode;
    }

    /// @notice An agent's settings. `spentToday` is what the agent has spent in the current UTC day.
    function getAgent(
        uint256 walletId,
        address agentAddress
    )
        external
        view
        returns (
            string memory label,
            uint256 perPaymentLimit,
            uint256 dailyLimit,
            uint256 expiresAt,
            bool active,
            uint256 spentToday,
            uint256 dayStart
        )
    {
        Agent storage agent = _agents[walletId][agentAddress];
        label = agent.label;
        perPaymentLimit = agent.perPaymentLimit;
        dailyLimit = agent.dailyLimit;
        expiresAt = agent.expiresAt;
        active = agent.active;
        spentToday = agent.spentToday;
        dayStart = agent.dayStart;

        uint256 today = _dayStart(block.timestamp);
        if (_agentExists(agent) && today > dayStart) {
            spentToday = 0;
            dayStart = today;
        }
    }

    /// @notice A request as stored. Unknown ids return an empty request (agent == address(0)).
    function getRequest(uint256 requestId) external view returns (PaymentRequest memory) {
        return _requests[requestId];
    }

    /// @notice Whether a request can be approved now, and whether expireRequest would release it now.
    function getRequestState(
        uint256 requestId
    ) external view returns (RequestStatus status, bool approvable, bool releasable) {
        PaymentRequest storage request = _requests[requestId];
        if (request.agent == address(0)) revert RequestNotFound();

        status = request.status;
        if (status != RequestStatus.PENDING) return (status, false, false);

        (bool agentRevoked, bool agentExpired) = _requestAgentState(requestId, request);
        approvable = block.timestamp <= request.expiresAt && !agentRevoked && !agentExpired
            && _isRecipientAllowed(request.walletId, request.to);
        releasable = _isReleasable(requestId, request);
    }

    /// @notice Ids of the wallet's requests that are still PENDING, including ones whose TTL has
    /// passed but that nobody has released yet. Order is not guaranteed.
    function getPendingRequests(uint256 walletId) external view returns (uint256[] memory pendingIds) {
        return _pendingRequests[walletId].values();
    }

    /// @notice How many requests `agentAddress` has open in the wallet.
    function openRequestCount(uint256 walletId, address agentAddress) external view returns (uint256) {
        return _openRequestCount[walletId][agentAddress];
    }

    function nextWalletId() external view returns (uint256) {
        return _nextWalletId;
    }

    function nextRequestId() external view returns (uint256) {
        return _nextRequestId;
    }

    /// @notice Returns whether `recipient` is on the allowlist for `walletId`.
    function isAllowlisted(uint256 walletId, address recipient) external view returns (bool) {
        return _allowlist[walletId][recipient];
    }

    /// @notice Returns whether `recipient` is on the blocklist for `walletId`.
    function isBlocklisted(uint256 walletId, address recipient) external view returns (bool) {
        return _blocklist[walletId][recipient];
    }

    /// @notice Returns whether `recipient` can currently be paid from `walletId` (recipient checks only).
    function isRecipientPermitted(uint256 walletId, address recipient) external view returns (bool) {
        return _isRecipientAllowed(walletId, recipient);
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    function _dayStart(uint256 ts) internal pure returns (uint256) {
        return ts - (ts % 86400);
    }

    function _requireValidRecipient(address to) internal view {
        if (to == address(0)) revert ZeroAddress();
        // Paying this contract or the USDC token itself would debit the wallet and strand the funds.
        if (to == address(this) || to == USDC_TOKEN) revert InvalidRecipient();
    }

    function _requireValidExpiry(uint256 expiresAt) internal view {
        if (expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidExpiry();
    }

    function _isRecipientAllowed(uint256 walletId, address to) internal view returns (bool) {
        if (to == address(0) || to == address(this) || to == USDC_TOKEN) return false;
        if (_blocklist[walletId][to]) return false;
        if (_wallets[walletId].mode == RecipientMode.ANY) return true;
        return _allowlist[walletId][to];
    }

    function _refreshDailySpend(Agent storage agent) internal {
        uint256 today = _dayStart(block.timestamp);
        if (today > agent.dayStart) {
            agent.spentToday = 0;
            agent.dayStart = today;
        }
    }

    function _agentExists(Agent storage agent) internal view returns (bool) {
        if (agent.active) return true;
        if (agent.dayStart != 0) return true;
        if (agent.expiresAt != 0) return true;
        if (agent.perPaymentLimit != 0) return true;
        if (agent.dailyLimit != 0) return true;
        if (bytes(agent.label).length != 0) return true;
        return false;
    }

    function _requireAgentCanAct(Agent storage agent) internal view {
        if (!_agentExists(agent)) revert AgentNotActive();
        if (!agent.active) revert AgentRevokedError();
        if (agent.expiresAt != 0 && block.timestamp > agent.expiresAt) revert AgentExpired();
    }

    /// @dev Whether the agent behind a request was revoked since the request was made, or has expired.
    function _requestAgentState(
        uint256 requestId,
        PaymentRequest storage request
    ) internal view returns (bool agentRevoked, bool agentExpired) {
        Agent storage agent = _agents[request.walletId][request.agent];
        agentRevoked = !agent.active || _requestEpoch[requestId] != _agentEpoch[request.walletId][request.agent];
        agentExpired = agent.expiresAt != 0 && block.timestamp > agent.expiresAt;
    }

    function _isReleasable(uint256 requestId, PaymentRequest storage request) internal view returns (bool) {
        if (block.timestamp > request.expiresAt) return true;
        (bool agentRevoked, bool agentExpired) = _requestAgentState(requestId, request);
        return agentRevoked || agentExpired;
    }

    function _closeRequest(uint256 requestId, PaymentRequest storage request) internal {
        _pendingRequests[request.walletId].remove(requestId);
        _openRequestCount[request.walletId][request.agent]--;
    }

    function _reject(uint256 requestId, PaymentRequest storage request) internal {
        request.status = RequestStatus.REJECTED;
        _closeRequest(requestId, request);
        _wallets[request.walletId].reserved -= request.amount;
        emit RequestRejected(requestId, request.walletId);
    }

    function _expire(uint256 requestId, PaymentRequest storage request) internal {
        request.status = RequestStatus.EXPIRED;
        _closeRequest(requestId, request);
        _wallets[request.walletId].reserved -= request.amount;
        emit RequestExpired(requestId, request.walletId);
    }
}
