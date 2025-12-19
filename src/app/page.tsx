'use client'

import { useEffect } from 'react'
import { useMarketplaceListings } from '@/hooks/useMarketplaceListings'
import { NFTCard } from '@/components/ui/NFTCard'

import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt
} from 'wagmi'

import tokenAbi from '@/lib/tokenAbi.json'
import { tokenContractAddress, marketplaceContractAddress } from '@/lib/constants'
import { parseUnits } from 'viem'


export default function Home() {
  const { address } = useAccount()
  const { data: listings, isLoading } = useMarketplaceListings()

  // ----------------------------
  // allowance 읽기
  // ----------------------------
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenContractAddress as `0x${string}`,
    abi: tokenAbi,
    functionName: 'allowance',
    args: address
      ? [address as `0x${string}`, marketplaceContractAddress as `0x${string}`]
      : undefined,
  })

  const safeAllowance = (allowance as bigint | null) ?? 0n
  const isApprovedForMarket = safeAllowance > 0n

  // approve 실행
  const { writeContract, data: approveHash, isPending } = useWriteContract()

  const {
    isLoading: isApproving,
    isSuccess: isApproveSuccess,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // approve 성공 → allowance 다시 불러오기
  useEffect(() => {
    if (isApproveSuccess) refetchAllowance()
  }, [isApproveSuccess])

  const handleApprove = () => {
    writeContract({
      address: tokenContractAddress as `0x${string}`,
      abi: tokenAbi,
      functionName: 'approve',
      args: [
        marketplaceContractAddress,
        parseUnits('100000000000000', 18),
      ],
    })
  }


  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>

      {/* 🔥 allowance=0 인 경우만 approve 버튼 보여줌 */}
      {!isApprovedForMarket && (
        <div className="mb-6">
          <button
            onClick={handleApprove}
            disabled={isApproving || isPending}
            className="text-sm font-medium
    text-[rgb(var(--text))]
    hover:text-[rgb(var(--accent))]
    transition"
          >
            {isApproving || isPending ? 'Approving...' : 'Approve MTK'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <NFTCard
              key={listing.tokenId.toString()}
              tokenId={listing.tokenId}
              price={listing.price}
              seller={listing.seller}
              isListed={listing.isListed}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          현재 마켓에 등록된 NFT가 없습니다.
        </div>
      )}
    </div>
  )
}
