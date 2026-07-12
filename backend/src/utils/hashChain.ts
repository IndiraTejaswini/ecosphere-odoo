import crypto from 'crypto';

/**
 * ============================================================================
 * Cryptographic Hash Chain  (Boss Level Add-On #4, part 1)
 * ============================================================================
 * Every CarbonTransaction stores the SHA-256 hash of {its own data + the
 * previous transaction's hash}. This means:
 *   - Tampering with ANY historical transaction changes its hash, which
 *     breaks every subsequent link in the chain -> tampering is detectable.
 *   - You get a simple, dependency-free "blockchain-lite" audit trail using
 *     only Node's built-in `crypto` module - no external chain needed.
 *
 * See models/CarbonTransaction.ts for where this is wired into a pre('save')
 * hook, and utils/algorandAnchor.ts for how the ROOT of this chain gets
 * anchored to a public, third-party ledger (Algorand TestNet) for extra
 * tamper-evidence that doesn't rely on trusting our own MongoDB instance.
 * ============================================================================
 */
export const GENESIS_HASH = '0'.repeat(64);

export function computeHash(data: Record<string, any>, previousHash: string): string {
  const payload = JSON.stringify(data) + previousHash;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Verifies a full chain of transactions (oldest -> newest) is unbroken.
 * Handy for a "Verify Ledger Integrity" admin/demo button.
 */
export function verifyChain(
  transactions: Array<{
    department: any;
    source: string;
    quantity: number;
    calculatedCO2e: number;
    timestamp: Date;
    previousHash: string;
    currentHash: string;
  }>
): { valid: boolean; brokenAtIndex: number | null } {
  let expectedPrevious = GENESIS_HASH;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    if (tx.previousHash !== expectedPrevious) {
      return { valid: false, brokenAtIndex: i };
    }
    const recomputed = computeHash(
      {
        department: tx.department,
        source: tx.source,
        quantity: tx.quantity,
        calculatedCO2e: tx.calculatedCO2e,
        timestamp: tx.timestamp,
      },
      tx.previousHash
    );
    if (recomputed !== tx.currentHash) {
      return { valid: false, brokenAtIndex: i };
    }
    expectedPrevious = tx.currentHash;
  }

  return { valid: true, brokenAtIndex: null };
}
