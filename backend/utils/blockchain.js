const crypto = require('crypto');

/**
 * Generate a blockchain-style hash for policy records
 * @param {Object} data - Data to hash
 * @returns {string} - Blockchain hash
 */
exports.generateBlockchainHash = (data) => {
  const timestamp = Date.now();
  const dataString = JSON.stringify({ ...data, timestamp });
  
  // Create SHA-256 hash
  const hash = crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
  
  // Return with 0x prefix to simulate blockchain transaction
  return '0x' + hash.substring(0, 16);
};

/**
 * Verify blockchain hash integrity
 * @param {Object} data - Original data
 * @param {string} hash - Hash to verify
 * @returns {boolean} - Verification result
 */
exports.verifyBlockchainHash = (data, hash) => {
  try {
    // Extract timestamp from hash (in real implementation, this would be more complex)
    const expectedHash = exports.generateBlockchainHash(data);
    return hash === expectedHash;
  } catch (error) {
    console.error('Hash verification error:', error);
    return false;
  }
};

/**
 * Create a merkle tree hash for batch operations
 * @param {Array} hashes - Array of hashes
 * @returns {string} - Merkle root hash
 */
exports.createMerkleRoot = (hashes) => {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];
  
  const merkleTree = [...hashes];
  
  while (merkleTree.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < merkleTree.length; i += 2) {
      const left = merkleTree[i];
      const right = merkleTree[i + 1] || left; // Use left if odd number
      
      const combined = crypto
        .createHash('sha256')
        .update(left + right)
        .digest('hex');
      
      nextLevel.push(combined);
    }
    
    merkleTree.length = 0;
    merkleTree.push(...nextLevel);
  }
  
  return '0x' + merkleTree[0].substring(0, 16);
};

/**
 * Generate a unique transaction ID
 * @returns {string} - Transaction ID
 */
exports.generateTransactionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  
  const hash = crypto
    .createHash('sha256')
    .update(timestamp + random)
    .digest('hex');
  
  return 'tx_' + hash.substring(0, 12);
};
