const { ethers } = require('ethers')
const fs = require('fs')
const path = require('path')
const os = require('os')

const WALLET_DIR = path.join(os.homedir(), '.solhint-mcp')
const WALLET_FILE = path.join(WALLET_DIR, 'wallet.json')
const BASE_RPC = 'https://mainnet.base.org'
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const PRO_THRESHOLD = ethers.BigNumber.from('1000000') // 1 USDC (6 decimals)

const USDC_ABI = ['function balanceOf(address account) view returns (uint256)']

function getOrCreateWallet() {
  if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true })
  }

  if (fs.existsSync(WALLET_FILE)) {
    return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'))
  }

  const wallet = ethers.Wallet.createRandom()
  const data = {
    privateKey: wallet.privateKey,
    address: wallet.address,
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2), { mode: 0o600 })
  return data
}

async function checkProStatus(address) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC)
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)
    const balance = await usdc.balanceOf(address)
    return balance.gte(PRO_THRESHOLD)
  } catch {
    // RPC failure — degrade gracefully, free tools remain unaffected
    return false
  }
}

module.exports = { getOrCreateWallet, checkProStatus, USDC_ADDRESS }
