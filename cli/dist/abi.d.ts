export declare const AIDER_ABI: readonly [{
    readonly type: "function";
    readonly name: "MAX_OPEN_REQUESTS_PER_AGENT";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "MAX_REQUEST_TTL";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "USDC_TOKEN";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "addAgent";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }, {
        readonly name: "label";
        readonly type: "string";
    }, {
        readonly name: "perPaymentLimit";
        readonly type: "uint256";
    }, {
        readonly name: "dailyLimit";
        readonly type: "uint256";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "agentPay";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "string";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "approveRequest";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "createWallet";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "deposit";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "expireRequest";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "expireRequests";
    readonly inputs: readonly [{
        readonly name: "requestIds";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [{
        readonly name: "expired";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "getAgent";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "label";
        readonly type: "string";
    }, {
        readonly name: "perPaymentLimit";
        readonly type: "uint256";
    }, {
        readonly name: "dailyLimit";
        readonly type: "uint256";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
    }, {
        readonly name: "active";
        readonly type: "bool";
    }, {
        readonly name: "spentToday";
        readonly type: "uint256";
    }, {
        readonly name: "dayStart";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPendingRequests";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "pendingIds";
        readonly type: "uint256[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getRequest";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "walletId";
            readonly type: "uint256";
        }, {
            readonly name: "agent";
            readonly type: "address";
        }, {
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly name: "amount";
            readonly type: "uint256";
        }, {
            readonly name: "memo";
            readonly type: "string";
        }, {
            readonly name: "expiresAt";
            readonly type: "uint256";
        }, {
            readonly name: "status";
            readonly type: "uint8";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getRequestState";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "status";
        readonly type: "uint8";
    }, {
        readonly name: "approvable";
        readonly type: "bool";
    }, {
        readonly name: "releasable";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getWallet";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "balance";
        readonly type: "uint256";
    }, {
        readonly name: "reserved";
        readonly type: "uint256";
    }, {
        readonly name: "available";
        readonly type: "uint256";
    }, {
        readonly name: "paused";
        readonly type: "bool";
    }, {
        readonly name: "mode";
        readonly type: "uint8";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isAllowlisted";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isBlocklisted";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isRecipientPermitted";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "nextRequestId";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "nextWalletId";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "openRequestCount";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "pauseWallet";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "paused";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "rejectRequest";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "rejectRequests";
    readonly inputs: readonly [{
        readonly name: "requestIds";
        readonly type: "uint256[]";
    }];
    readonly outputs: readonly [{
        readonly name: "rejected";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "requestPayment";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "memo";
        readonly type: "string";
    }, {
        readonly name: "ttlSeconds";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "revokeAgent";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setAllowlist";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "allowed";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setBlocklist";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }, {
        readonly name: "blocked";
        readonly type: "bool";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setRecipientMode";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "mode";
        readonly type: "uint8";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "updateAgent";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "agentAddress";
        readonly type: "address";
    }, {
        readonly name: "perPaymentLimit";
        readonly type: "uint256";
    }, {
        readonly name: "dailyLimit";
        readonly type: "uint256";
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "AgentAdded";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "label";
        readonly type: "string";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "AgentPaid";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "memo";
        readonly type: "string";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "AgentRevoked";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "AgentUpdated";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "AllowlistUpdated";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "recipient";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "allowed";
        readonly type: "bool";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "BlocklistUpdated";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "recipient";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "blocked";
        readonly type: "bool";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "Deposited";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "PaymentRequested";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "agent";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: false;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "memo";
        readonly type: "string";
        readonly indexed: false;
    }, {
        readonly name: "expiresAt";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RecipientModeSet";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "mode";
        readonly type: "uint8";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RequestApproved";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RequestExpired";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RequestRejected";
    readonly inputs: readonly [{
        readonly name: "requestId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "WalletCreated";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "owner";
        readonly type: "address";
        readonly indexed: true;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "WalletPausedEvent";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "paused";
        readonly type: "bool";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "Withdrawn";
    readonly inputs: readonly [{
        readonly name: "walletId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "AgentExpired";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "AgentNotActive";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "AgentRevokedError";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InsufficientBalance";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidExpiry";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidRecipient";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidTTL";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotWalletOwner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OverDailyLimit";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OverPerPaymentLimit";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OwnerCannotBeAgent";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RecipientBlocked";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RecipientNotAllowed";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ReentrancyGuardReentrantCall";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RequestExpiredError";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RequestNotExpiredYet";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RequestNotFound";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "RequestNotPending";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "TooManyOpenRequests";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "WalletPaused";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ZeroAddress";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "ZeroAmount";
    readonly inputs: readonly [];
}];
//# sourceMappingURL=abi.d.ts.map