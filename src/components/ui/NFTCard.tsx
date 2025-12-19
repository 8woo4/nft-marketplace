'use client'

import { useState } from 'react'
import { useNFTMetadata } from '@/hooks/useNFTMetadata'
import { formatEther } from '@/lib/web3-utils'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { useRouter } from 'next/navigation'

import marketplaceAbi from '@/lib/marketplaceAbi.json'
import nftAbi from '@/lib/nftAbi.json'
import { marketplaceContractAddress, nftContractAddress } from '@/lib/constants'
import { parseUnits } from 'viem'

interface NFTCardProps {
  tokenId: bigint
  price?: bigint
  seller?: string
  isListed?: boolean
}

export function NFTCard({ tokenId, price, seller, isListed }: NFTCardProps) {
  const router = useRouter()
  const { data: metadata, isLoading } = useNFTMetadata(tokenId)
  const { address } = useAccount()

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash })

  const [isListing, setIsListing] = useState(false)
  const [listPrice, setListPrice] = useState('')

  const isOwner = seller?.toLowerCase() === address?.toLowerCase()

  // --------------------------------------------------
  // NFT Approve Check
  // --------------------------------------------------
  const { data: nftApproved } = useReadContract({
    address: nftContractAddress as `0x${string}`,
    abi: nftAbi,
    functionName: 'getApproved',
    args: [tokenId],
    query: { enabled: !!address },
  })

  const alreadyApproved =
    typeof nftApproved === 'string' &&
    nftApproved.toLowerCase() === marketplaceContractAddress.toLowerCase()

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------
  const handleApproveNFT = () => {
    writeContract({
      address: nftContractAddress as `0x${string}`,
      abi: nftAbi,
      functionName: 'approve',
      args: [marketplaceContractAddress, tokenId],
    })
  }

  const handleListAction = () => {
    if (!listPrice) return
    const priceWei = parseUnits(listPrice, 18)

    writeContract({
      address: marketplaceContractAddress as `0x${string}`,
      abi: marketplaceAbi,
      functionName: 'listItem',
      args: [tokenId, priceWei],
    })
  }

  const handleBuy = () => {
    if (!price) return

    writeContract({
      address: marketplaceContractAddress as `0x${string}`,
      abi: marketplaceAbi,
      functionName: 'buyItem',
      args: [tokenId],
    })
  }

  const handleCancel = () => {
    writeContract({
      address: marketplaceContractAddress as `0x${string}`,
      abi: marketplaceAbi,
      functionName: 'cancelListing',
      args: [tokenId],
    })
  }

  // --------------------------------------------------
  // Auto Refresh
  // --------------------------------------------------
  if (isSuccess) {
    setTimeout(() => {
      router.refresh()
    }, 1200)
  }

  // --------------------------------------------------
  // Loading Skeleton
  // --------------------------------------------------
  if (isLoading) {
    return (
      <div className="h-[420px] rounded-2xl bg-[rgb(var(--card))] animate-pulse border border-[rgb(var(--border))]" />
    )
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div
      className="
        group
        rounded-2xl
        overflow-hidden
        bg-[rgb(var(--card))]
        border border-[rgb(var(--border))]
        shadow-lg
        transition-all
        hover:-translate-y-1
        hover:shadow-2xl
      "
    >
      {/* IMAGE */}
      <div className="relative aspect-square overflow-hidden bg-black">
        {metadata?.image ? (
          <img
            src={metadata.image}
            alt=""
            className="
              w-full h-full object-cover
              transition-transform duration-500
              group-hover:scale-110
            "
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4">
        <h3 className="font-semibold text-lg tracking-tight">
          {metadata?.name || `NFT #${tokenId}`}
        </h3>

        <p className="text-xs text-[rgb(var(--muted))] mb-4">
          Token ID #{tokenId.toString()}
        </p>

        {isListed && price && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
              Price
            </span>
            <span className="font-bold text-xl text-indigo-400">
              {formatEther(price)} MTK
            </span>
          </div>
        )}

        <div className="space-y-2">
          {/* BUY */}
          {isListed && !isOwner && (
            <button
              onClick={handleBuy}
              disabled={isPending || isConfirming}
              className="
                w-full py-2.5 rounded-xl font-semibold
                bg-indigo-600 hover:bg-indigo-500
                transition disabled:opacity-40
              "
            >
              {isPending || isConfirming ? 'Processing…' : 'Buy Now'}
            </button>
          )}

          {/* CANCEL */}
          {isListed && isOwner && (
            <button
              onClick={handleCancel}
              disabled={isPending || isConfirming}
              className="
                w-full py-2.5 rounded-xl
                border border-red-500/40
                text-red-400
                hover:bg-red-500/10
                transition
              "
            >
              {isPending || isConfirming ? 'Processing…' : 'Cancel Listing'}
            </button>
          )}

          {/* LIST */}
          {!isListed && isOwner && (
            <div className="space-y-2">
              {!isListing ? (
                <button
                  onClick={() => setIsListing(true)}
                  className="
                    w-full py-2.5 rounded-xl font-semibold
                    bg-indigo-600 hover:bg-indigo-500
                    transition
                  "
                >
                  List for Sale
                </button>
              ) : (
                <>
                  {!alreadyApproved && (
                    <button
                      onClick={handleApproveNFT}
                      disabled={isPending}
                      className="
                        w-full py-2.5 rounded-xl
                        bg-gray-700 hover:bg-gray-600
                        transition
                      "
                    >
                      Approve NFT
                    </button>
                  )}

                  <input
                    type="number"
                    placeholder="Price in MTK"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="
                      w-full px-3 py-2 rounded-xl
                      bg-black/30
                      border border-[rgb(var(--border))]
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    "
                  />

                  <button
                    onClick={handleListAction}
                    disabled={isPending || !alreadyApproved}
                    className="
                      w-full py-2.5 rounded-xl font-semibold
                      bg-indigo-600 hover:bg-indigo-500
                      transition disabled:opacity-40
                    "
                  >
                    List
                  </button>

                  <button
                    onClick={() => setIsListing(false)}
                    className="w-full text-xs text-[rgb(var(--muted))]"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}

          {isSuccess && (
            <div className="text-center text-emerald-400 text-sm mt-2">
              Transaction Successful! Refreshing…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
