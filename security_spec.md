# Security Specification - POS Kasir Application

## 1. Data Invariants
- Only authenticated users with verified email or store accounts can access the POS catalog, record transactions, and manage inventory.
- Product prices and stocks must always be positive numeric values.
- Transactions are immutable after creation (financial records cannot be altered by unauthorized users or backdated).
- A cashier can only create a transaction under their own verified `cashierId` (`request.auth.uid`).
- User profile documents in `/users/{userId}` can only be read/updated by the corresponding user (`request.auth.uid == userId`).
- Negative values for quantities, subtotals, or payment amounts are forbidden.

## 2. Dirty Dozen Malicious Payloads

1. **Anonymous Infiltration**: Unauthenticated `create` on `/products/p1` with arbitrary price and stock. -> Result: PERMISSION_DENIED.
2. **Ghost Cashier Spoofing**: Cashier `userA` attempts to record transaction with `cashierId: "userB"`. -> Result: PERMISSION_DENIED.
3. **Negative Price Poisoning**: Malicious user creates a product with `price: -50000` to drain store totals. -> Result: PERMISSION_DENIED.
4. **Denial-of-Wallet (1MB Name Payload)**: Attacker attempts to write a product name exceeding `100` characters. -> Result: PERMISSION_DENIED.
5. **Invoice Tampering**: Modifying `finalAmount` on an existing `/transactions/{txId}` document. -> Result: PERMISSION_DENIED.
6. **Shadow Field Injection**: Creating a product with hidden/arbitrary privileged property `isSuperAdminOverride: true`. -> Result: PERMISSION_DENIED.
7. **PII Harvesting**: User A attempts to read all fields in User B's `/users/userB` profile without authorization. -> Result: PERMISSION_DENIED.
8. **Negative Stock Insertion**: Creating or updating product with `stock: -100`. -> Result: PERMISSION_DENIED.
9. **Unsafe Path Injection**: Creating a document at `/products/../../system_config` with invalid characters. -> Result: PERMISSION_DENIED.
10. **Zero Cash Payment Exploit**: Transaction submitted with `finalAmount: 100000` but `paymentAmount: -5000`. -> Result: PERMISSION_DENIED.
11. **Timestamp Falsification**: Submitting transaction with spoofed future or past date string. -> Result: PERMISSION_DENIED.
12. **Role Self-Escalation**: Regular cashier updates their `/users/{uid}` document to `role: "admin"` or `role: "owner"`. -> Result: PERMISSION_DENIED.
