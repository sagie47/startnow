import { useState, useEffect, useCallback, useRef } from 'react';
import { Block, loadBlocks, saveBlocks, loadProofs, saveProofs } from '@/utils/storage';

export function useBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [proofs, setProofs] = useState<Array<{ id: string; blockId: string; link?: string; note?: string; timestamp: number }>>([]);
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [loadedBlocks, loadedProofs] = await Promise.all([loadBlocks(), loadProofs()]);
    setBlocks(loadedBlocks);
    setProofs(loadedProofs);
    setLoading(false);
  };

  const debouncedSave = useCallback((blocksToSave: Block[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveBlocks(blocksToSave);
    }, 500);
  }, []);

  const updateBlocks = useCallback((newBlocks: Block[] | ((prev: Block[]) => Block[])) => {
    setBlocks((prev) => {
      const updated = typeof newBlocks === 'function' ? newBlocks(prev) : newBlocks;
      debouncedSave(updated);
      return updated;
    });
  }, [debouncedSave]);

  const updateProofs = useCallback((newProofs: Array<{ id: string; blockId: string; link?: string; note?: string; timestamp: number }> | ((prev: Array<{ id: string; blockId: string; link?: string; note?: string; timestamp: number }>) => Array<{ id: string; blockId: string; link?: string; note?: string; timestamp: number }>)) => {
    setProofs((prev) => {
      const updated = typeof newProofs === 'function' ? newProofs(prev) : newProofs;
      saveProofs(updated);
      return updated;
    });
  }, []);

  const addBlock = useCallback((block: Omit<Block, 'id'>) => {
    updateBlocks((prev) => [
      ...prev,
      { 
        ...block, 
        id: Date.now().toString(),
        priority: block.priority || 2,
        fallbackMinutes: block.fallbackMinutes,
        protected: block.protected || false,
      }
    ]);
  }, [updateBlocks]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    updateBlocks((prev) => 
      prev.map((block) => (block.id === id ? { ...block, ...updates } : block))
    );
  }, [updateBlocks]);

  const deleteBlock = useCallback((id: string) => {
    updateBlocks((prev) => prev.filter((block) => block.id !== id));
    updateProofs((prev) => prev.filter((proof) => proof.blockId !== id));
  }, [updateBlocks, updateProofs]);

  const addProof = useCallback((proof: { blockId: string; link?: string; note?: string }) => {
    updateProofs((prev) => [
      ...prev,
      { ...proof, id: Date.now().toString(), timestamp: Date.now() }
    ]);
  }, [updateProofs]);

  const getProofForBlock = useCallback((blockId: string) => {
    return proofs.find((proof) => proof.blockId === blockId);
  }, [proofs]);

  const stats = {
    planned: blocks.length,
    done: blocks.filter(b => b.completed).length,
  };

  return {
    blocks,
    proofs,
    loading,
    updateBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    addProof,
    getProofForBlock,
    stats,
  };
}
