// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Leash is ReentrancyGuard {
    address public constant USDC_TOKEN = 0x3600000000000000000000000000000000000000;

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
    mapping(uint256 => uint256[]) private _walletRequests;

    mapping(uint256 => mapping(address => bool)) private _allowlist;
    mapping(uint256 => mapping(address => bool)) private _blocklist;

    modifier _onlyWalletOwner(uint256 walletId) {
        if (_wallets[walletId].owner != msg.sender) revert NotWalletOwner();
        _;
    }

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

    function deposit(uint256 walletId, uint256 amount) external nonReentrant _onlyWalletOwner(walletId) {
        if (amount == 0) revert ZeroAmount();

        // CEI: update state before the external call.
        _wallets[walletId].balance += amount;

        bool ok = IERC20(USDC_TOKEN).transferFrom(msg.sender, address(this), amount);
        require(ok, "USDC_TRANSFER_FROM_FAILED");

        emit Deposited(walletId, amount);
    }

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

    function pauseWallet(uint256 walletId, bool paused) external _onlyWalletOwner(walletId) {
        _wallets[walletId].paused = paused;
        emit WalletPausedEvent(walletId, paused);
    }

    function addAgent(
        uint256 walletId,
        address agentAddress,
        string calldata label,
        uint256 perPaymentLimit,
        uint256 dailyLimit,
        uint256 expiresAt
    ) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();

        _agents[walletId][agentAddress] = Agent({
            label: label,
            perPaymentLimit: perPaymentLimit,
            dailyLimit: dailyLimit,
            expiresAt: expiresAt,
            active: true,
            spentToday: 0,
            dayStart: _dayStart(block.timestamp)
        });

        emit AgentAdded(walletId, agentAddress, label);
    }

    function updateAgent(
        uint256 walletId,
        address agentAddress,
        uint256 perPaymentLimit,
        uint256 dailyLimit,
        uint256 expiresAt
    ) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();

        Agent storage agent = _agents[walletId][agentAddress];
        if (!_agentExists(agent)) revert AgentNotActive();

        agent.perPaymentLimit = perPaymentLimit;
        agent.dailyLimit = dailyLimit;
        agent.expiresAt = expiresAt;

        emit AgentUpdated(walletId, agentAddress);
    }

    function revokeAgent(uint256 walletId, address agentAddress) external _onlyWalletOwner(walletId) {
        if (agentAddress == address(0)) revert ZeroAddress();
        _agents[walletId][agentAddress].active = false;
        emit AgentRevoked(walletId, agentAddress);
    }

    function setRecipientMode(uint256 walletId, RecipientMode mode) external _onlyWalletOwner(walletId) {
        _wallets[walletId].mode = mode;
        emit RecipientModeSet(walletId, mode);
    }

    function setAllowlist(uint256 walletId, address recipient, bool allowed) external _onlyWalletOwner(walletId) {
        _allowlist[walletId][recipient] = allowed;
        emit AllowlistUpdated(walletId, recipient, allowed);
    }

    function setBlocklist(uint256 walletId, address recipient, bool blocked) external _onlyWalletOwner(walletId) {
        _blocklist[walletId][recipient] = blocked;
        emit BlocklistUpdated(walletId, recipient, blocked);
    }

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
        if (to == address(0)) revert ZeroAddress();
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
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (ttlSeconds == 0) revert InvalidTTL();

        if (_blocklist[walletId][to]) revert RecipientBlocked();
        if (wallet.mode == RecipientMode.ALLOWLIST && !_allowlist[walletId][to]) revert RecipientNotAllowed();

        if (wallet.balance - wallet.reserved < amount) revert InsufficientBalance();

        wallet.reserved += amount;

        requestId = _nextRequestId;
        _nextRequestId++;

        _requests[requestId] = PaymentRequest({
            walletId: walletId,
            agent: msg.sender,
            to: to,
            amount: amount,
            memo: memo,
            expiresAt: block.timestamp + ttlSeconds,
            status: RequestStatus.PENDING
        });

        _walletRequests[walletId].push(requestId);

        emit PaymentRequested(requestId, walletId, msg.sender, to, amount, memo, block.timestamp + ttlSeconds);
    }

    function approveRequest(uint256 requestId) external nonReentrant {
        PaymentRequest storage request = _requests[requestId];
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();

        Wallet storage wallet = _wallets[request.walletId];
        if (wallet.owner != msg.sender) revert NotWalletOwner();

        if (block.timestamp > request.expiresAt) revert RequestExpiredError();

        // Re-validate recipient against current policy before paying.
        if (_blocklist[request.walletId][request.to]) revert RecipientBlocked();
        if (wallet.mode == RecipientMode.ALLOWLIST && !_allowlist[request.walletId][request.to]) {
            revert RecipientNotAllowed();
        }

        request.status = RequestStatus.APPROVED;
        wallet.reserved -= request.amount;
        wallet.balance -= request.amount;

        bool ok = IERC20(USDC_TOKEN).transfer(request.to, request.amount);
        require(ok, "USDC_TRANSFER_FAILED");

        emit RequestApproved(requestId, request.walletId);
    }

    function rejectRequest(uint256 requestId) external {
        PaymentRequest storage request = _requests[requestId];
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();

        Wallet storage wallet = _wallets[request.walletId];
        if (wallet.owner != msg.sender) revert NotWalletOwner();

        request.status = RequestStatus.REJECTED;
        wallet.reserved -= request.amount;

        emit RequestRejected(requestId, request.walletId);
    }

    function expireRequest(uint256 requestId) external {
        PaymentRequest storage request = _requests[requestId];
        if (request.status != RequestStatus.PENDING) revert RequestNotPending();
        if (block.timestamp <= request.expiresAt) revert RequestNotExpiredYet();

        Wallet storage wallet = _wallets[request.walletId];

        request.status = RequestStatus.EXPIRED;
        wallet.reserved -= request.amount;

        emit RequestExpired(requestId, request.walletId);
    }

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
    }

    function getRequest(uint256 requestId) external view returns (PaymentRequest memory) {
        return _requests[requestId];
    }

    function getPendingRequests(uint256 walletId) external view returns (uint256[] memory pendingIds) {
        uint256[] storage all = _walletRequests[walletId];
        uint256 len = all.length;
        uint256 pendingCount = 0;

        for (uint256 i = 0; i < len; i++) {
            if (_requests[all[i]].status == RequestStatus.PENDING) {
                pendingCount++;
            }
        }

        pendingIds = new uint256[](pendingCount);
        uint256 idx = 0;

        for (uint256 i = 0; i < len; i++) {
            uint256 rid = all[i];
            if (_requests[rid].status == RequestStatus.PENDING) {
                pendingIds[idx] = rid;
                idx++;
            }
        }
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

    /// @notice Returns whether `recipient` is currently permitted to receive payments from `walletId`.
    /// Combines blocklist and allowlist/mode checks.
    function isRecipientPermitted(uint256 walletId, address recipient) external view returns (bool) {
        return _isRecipientAllowed(walletId, recipient);
    }

    function _dayStart(uint256 ts) internal pure returns (uint256) {
        return ts - (ts % 86400);
    }

    function _isRecipientAllowed(uint256 walletId, address to) internal view returns (bool) {
        if (_blocklist[walletId][to]) {
            return false;
        }

        Wallet storage wallet = _wallets[walletId];
        if (wallet.mode == RecipientMode.ANY) {
            return true;
        }

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
}
