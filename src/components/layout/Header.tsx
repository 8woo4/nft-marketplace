'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useReadContract,
} from 'wagmi'
import { formatAddress } from '@/lib/web3-utils'
import { formatEther, formatUnits } from 'viem'
import { tokenContractAddress } from '@/lib/constants'
import tokenAbi from '@/lib/tokenAbi.json'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  const { data: ethBalance } = useBalance({ address })

  // 🔹 MTK Balance
  const { data: mtkBalance } = useReadContract({
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])

  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  const renderRight = () => {
    if (!ready || !isConnected) {
      return (
        <button
          onClick={handleConnect}
          className="
            px-6 py-2 rounded-xl font-semibold
            bg-blue-600 hover:bg-blue-500
            text-white transition
          "
        >
          Connect Wallet
        </button>
      )
    }

    return (
      <div className="flex items-center gap- text-sm">
        {/* ETH */}
        <div>
          <span className="font-semibold">
            {ethBalance
              ? Number(formatEther(ethBalance.value)).toFixed(4)
              : '0.0000'}
          </span>{' '}
          ETH
        </div>

        {/* MTK */}
        <div>
          <span className="font-semibold">
            {mtkBalance ? formatUnits(mtkBalance as bigint, 18) : '0'}
          </span>{' '}
          MTK
        </div>

        {/* Address */}
        <div className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
          {formatAddress(address)}
        </div>

        {/* Disconnect */}
        <button
          onClick={() => disconnect()}
          className="text-red-400 hover:text-red-500 transition"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <header
      className="
        relative
        h-16
        border-b border-[rgb(var(--border))]
        bg-[rgb(var(--bg))]
      "
    >
      <div
        className="
          max-w-7xl mx-auto
          h-full
          px-6
          flex items-center
        "
      >
        {/* LEFT - Logo */}
        <div className="flex-1">
          <Link
            href="/"
            className="text-xl font-bold text-[#5C4033] tracking-tight"
          >
            NFT Market
          </Link>
        </div>

        {/* CENTER - NAV */}
        <nav
          className="
            absolute left-1/2 -translate-x-1/2
            flex items-center gap-10
            text-sm font-medium
          "
        >
          <Link
            href="/"
            className="hover:text-blue-400 transition"
          >
            마켓플레이스
          </Link>
          <Link
            href="/mint"
            className="hover:text-blue-400 transition"
          >
            Mint
          </Link>
          <Link
            href="/profile"
            className="hover:text-blue-400 transition"
          >
            내 NFT
          </Link>
        </nav>

        {/* RIGHT - WALLET */}
        <div className="flex-1 flex justify-end pr-10">
          {renderRight()}
        </div>
      </div>
    </header>
  )
}
