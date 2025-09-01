"use client";

import React, { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { formatEther } from "viem";

const MOCK_TOKENS = [
  { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", name: "Ethereum", decimals: 18 },
  { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
  { address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", symbol: "WBTC", name: "Wrapped Bitcoin", decimals: 8 },
  { address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", symbol: "UNI", name: "Uniswap", decimals: 18 },
  { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
];

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: string;
}

export default function PortfolioDashboard() {
  const { address: connectedAddress } = useAccount();
  const [batchedData, setBatchedData] = useState<TokenData[]>([]);
  const [individualData, setIndividualData] = useState<TokenData[]>([]);
  const [batchedTime, setBatchedTime] = useState<number>(0);
  const [individualTime, setIndividualTime] = useState<number>(0);
  const [loading, setLoading] = useState<string>("");

  const { data: ethBalance } = useScaffoldReadContract({
    contractName: "portfolio-reader",
    functionName: "getEthBalance",
    args: [connectedAddress],
  });

  const { writeContractAsync: writePortfolioReader } = useScaffoldWriteContract("portfolio-reader");

  const formatBalance = (balance: string, decimals: number = 18) => {
    if (balance === "0") return "0.0000";
    const num = parseFloat(formatEther(BigInt(balance)));
    return num.toFixed(4);
  };

  const generateMockUSDValue = () => {
    return (Math.random() * 2000).toFixed(2);
  };

  const testBatchedCalls = async () => {
    if (!connectedAddress) {
      setLoading("Please connect your wallet first");
      return;
    }

    setLoading("Loading batched portfolio data...");
    const startTime = Date.now();

    try {
      const tokenAddresses = MOCK_TOKENS.map(token => token.address);

      await writePortfolioReader({
        functionName: "getPortfolioBalances",
        args: [connectedAddress, tokenAddresses],
      });

      const mockBatchedData: TokenData[] = MOCK_TOKENS.map((token, index) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        balance:
          token.address === "0x0000000000000000000000000000000000000000"
            ? ethBalance?.toString() || "0"
            : (Math.random() * 1000).toFixed(0),
        decimals: token.decimals,
        usdValue: generateMockUSDValue(),
      }));

      const endTime = Date.now();
      const timeTaken = endTime - startTime;

      setBatchedData(mockBatchedData);
      setBatchedTime(timeTaken);
      setLoading("");
    } catch (error) {
      setLoading(`Error: ${error}`);
    }
  };

  const testIndividualCalls = async () => {
    if (!connectedAddress) {
      setLoading("Please connect your wallet first");
      return;
    }

    setLoading("Loading individual token data...");
    const startTime = Date.now();

    try {
      const mockIndividualData: TokenData[] = [];

      for (const token of MOCK_TOKENS) {
        const balance =
          token.address === "0x0000000000000000000000000000000000000000"
            ? ethBalance?.toString() || "0"
            : (Math.random() * 1000).toFixed(0);

        mockIndividualData.push({
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          balance: balance,
          decimals: token.decimals,
          usdValue: generateMockUSDValue(),
        });

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const endTime = Date.now();
      const timeTaken = endTime - startTime;

      setIndividualData(mockIndividualData);
      setIndividualTime(timeTaken);
      setLoading("");
    } catch (error) {
      setLoading(`Error: ${error}`);
    }
  };

  const PortfolioTable = ({ data, title, time }: { data: TokenData[]; title: string; time: number }) => {
    const totalValue = data.reduce((sum, token) => sum + parseFloat(token.usdValue), 0);

    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-header p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center justify-between">
            {title}
            {time > 0 && <span className="badge badge-info">{time}ms</span>}
          </h3>
          <div className="text-2xl font-bold text-success mt-2">Total: ${totalValue.toFixed(2)}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Token</th>
                <th>Name</th>
                <th>Balance</th>
                <th>USD Value</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {data.map((token, index) => (
                <tr key={index}>
                  <td>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs font-bold">
                        {token.symbol.slice(0, 2)}
                      </div>
                      <span className="font-semibold">{token.symbol}</span>
                    </div>
                  </td>
                  <td>{token.name}</td>
                  <td className="font-mono">{formatBalance(token.balance, token.decimals)}</td>
                  <td className="text-success font-semibold">${token.usdValue}</td>
                  <td className="font-mono text-xs">
                    {token.address.slice(0, 6)}...{token.address.slice(-4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-center space-x-4">
        <button
          className="btn btn-primary btn-lg"
          onClick={testBatchedCalls}
          disabled={!connectedAddress || loading !== ""}
        >
          {loading === "Loading batched portfolio data..." ? <span className="loading loading-spinner"></span> : null}
          Test Batched Calls
        </button>
        <button
          className="btn btn-secondary btn-lg"
          onClick={testIndividualCalls}
          disabled={!connectedAddress || loading !== ""}
        >
          {loading === "Loading individual token data..." ? <span className="loading loading-spinner"></span> : null}
          Test Individual Calls
        </button>
      </div>

      {loading && (
        <div className="alert alert-info">
          <span>{loading}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {batchedData.length > 0 && (
          <PortfolioTable data={batchedData} title="Batched Call Results" time={batchedTime} />
        )}

        {individualData.length > 0 && (
          <PortfolioTable data={individualData} title="Individual Call Results" time={individualTime} />
        )}
      </div>
    </div>
  );
}
