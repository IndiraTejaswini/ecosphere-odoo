import algosdk from 'algosdk';
import mongoose from 'mongoose';

/**
 * ============================================================================
 * Algorand TestNet Anchoring  (Boss Level Add-On #4, part 2)
 * ============================================================================
 * Once a day (see cron/complianceCron.ts), we take the root hash - the
 * `currentHash` of the most recent CarbonTransaction in our internal SHA-256
 * hash-chain (see utils/hashChain.ts) - and write it into the `note` field of
 * a 0-ALGO self-payment transaction on Algorand TestNet.
 *
 * Why this matters: Algorand is a public, decentralized ledger. Anchoring our
 * root hash there gives ANY third party (an auditor, a regulator, a hackathon
 * judge) a way to verify our internal ledger was NOT altered after the anchor
 * time - without having to trust our MongoDB instance at all. If someone
 * edited old transaction data in our DB, the recomputed root hash would no
 * longer match what's permanently on-chain.
 *
 * DISABLED BY DEFAULT (ALGORAND_ENABLED=false) because it needs:
 *   1. A funded TestNet account (free, ~30 seconds via the dispenser below)
 *   2. Outbound network access to algonode.cloud
 * Most hackathon judging environments won't have either set up, and you don't
 * want a network call failure to crash your demo. Flip the env var on once
 * you've created + funded an account:
 *   Dispenser: https://bank.testnet.algorand.network/
 * ============================================================================
 */
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud';
const ALGOD_TOKEN = process.env.ALGOD_TOKEN || '';

export async function anchorDailyRootHash(): Promise<{ anchored: boolean; txId?: string; rootHash?: string }> {
  if (process.env.ALGORAND_ENABLED !== 'true') {
    console.log('[Algorand] Anchoring skipped (ALGORAND_ENABLED is not "true").');
    return { anchored: false };
  }

  try {
    const mnemonic = process.env.ALGORAND_MNEMONIC;
    if (!mnemonic) throw new Error('ALGORAND_MNEMONIC is not set in .env');

    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

    // Dynamic model lookup avoids a circular import with models/CarbonTransaction.ts
    const CarbonTransaction = mongoose.model('CarbonTransaction');
    const latestTx: any = await CarbonTransaction.findOne().sort({ timestamp: -1, _id: -1 });

    if (!latestTx) {
      console.log('[Algorand] No transactions exist yet - nothing to anchor.');
      return { anchored: false };
    }

    const rootHash = latestTx.currentHash;
    const params = await client.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account.addr,
      to: account.addr, // self-payment; we only care about the `note` field
      amount: 0,
      note: new Uint8Array(Buffer.from(`ECOSPHERE_ROOT:${rootHash}`)),
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(account.sk);
    const { txId } = await client.sendRawTransaction(signedTxn).do();

    console.log(`[Algorand] ✅ Anchored root hash ${rootHash} in TestNet txn ${txId}`);
    return { anchored: true, txId, rootHash };
  } catch (err) {
    console.error('[Algorand] Anchoring failed:', err);
    return { anchored: false };
  }
}
