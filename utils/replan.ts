import type { Block } from './storage';

export type ReplanAction = 'moved' | 'shrunk' | 'skipped' | 'unchanged' | 'protected';

export interface ReplanResult {
  blocks: Block[];
  actions: Array<{
    blockId: string;
    action: ReplanAction;
    originalStartTime?: string;
    newStartTime?: string;
    originalDuration?: number;
    newDuration?: number;
  }>;
  minutesBehind: number;
}

interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function roundToNextQuarter(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

export function generateReplan(
  blocks: Block[],
  now: Date = new Date()
): ReplanResult {
  const nowMinutes = roundToNextQuarter(timeToMinutes(
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  ));
  const dayEndMinutes = 24 * 60;

  const actions: ReplanResult['actions'] = [];
  const resultBlocks: Block[] = [];
  
  const fixedBlocks = blocks.filter(b => b.fixed);
  const flexibleBlocks = blocks.filter(b => !b.fixed && !b.completed);

  let minutesBehind = 0;

  fixedBlocks.forEach(block => {
    const blockStart = timeToMinutes(block.startTime);
    
    if (blockStart < nowMinutes) {
      const behind = nowMinutes - blockStart;
      minutesBehind += behind;
    }
    
    resultBlocks.push({ ...block });
  });

  const occupiedSlots: TimeSlot[] = fixedBlocks.map(block => ({
    startMinutes: timeToMinutes(block.startTime),
    endMinutes: timeToMinutes(block.startTime) + block.duration,
  }));

  const freeSlots: TimeSlot[] = [];
  let currentStart = nowMinutes;

  occupiedSlots
    .sort((a, b) => a.startMinutes - b.startMinutes)
    .forEach(slot => {
      if (currentStart < slot.startMinutes) {
        freeSlots.push({
          startMinutes: currentStart,
          endMinutes: slot.startMinutes,
        });
      }
      currentStart = Math.max(currentStart, slot.endMinutes + 5);
    });

  if (currentStart < dayEndMinutes) {
    freeSlots.push({
      startMinutes: currentStart,
      endMinutes: dayEndMinutes,
    });
  }

  const sortedFlexible = flexibleBlocks.sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;
    
    const timeDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (timeDiff !== 0) return timeDiff;
    
    return a.duration - b.duration;
  });

  sortedFlexible.forEach(block => {
    const blockStart = timeToMinutes(block.startTime);
    
    if (blockStart < nowMinutes) {
      minutesBehind += nowMinutes - blockStart;
    }

    let placed = false;
    let fallbackMinutes = block.fallbackMinutes || Math.round(block.duration * 0.6);
    
    for (let i = 0; i < freeSlots.length; i++) {
      const slot = freeSlots[i];
      const slotDuration = slot.endMinutes - slot.startMinutes;
      
      if (slotDuration >= block.duration) {
        const newBlock = {
          ...block,
          startTime: minutesToTime(slot.startMinutes),
        };
        
        resultBlocks.push(newBlock);
        actions.push({
          blockId: block.id,
          action: block.startTime === newBlock.startTime ? 'unchanged' : 'moved',
          originalStartTime: block.startTime,
          newStartTime: newBlock.startTime,
        });
        
        freeSlots[i] = {
          startMinutes: slot.startMinutes + block.duration + 5,
          endMinutes: slot.endMinutes,
        };
        
        freeSlots.sort((a, b) => a.startMinutes - b.startMinutes);
        placed = true;
        break;
      }
    }

    if (!placed && block.protected) {
      for (let i = 0; i < freeSlots.length; i++) {
        const slot = freeSlots[i];
        const slotDuration = slot.endMinutes - slot.startMinutes;
        
        if (slotDuration >= fallbackMinutes) {
          const newBlock = {
            ...block,
            startTime: minutesToTime(slot.startMinutes),
            duration: fallbackMinutes,
          };
          
          resultBlocks.push(newBlock);
          actions.push({
            blockId: block.id,
            action: 'shrunk',
            originalStartTime: block.startTime,
            newStartTime: newBlock.startTime,
            originalDuration: block.duration,
            newDuration: fallbackMinutes,
          });
          
          freeSlots[i] = {
            startMinutes: slot.startMinutes + fallbackMinutes + 5,
            endMinutes: slot.endMinutes,
          };
          
          freeSlots.sort((a, b) => a.startMinutes - b.startMinutes);
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      actions.push({
        blockId: block.id,
        action: 'skipped',
        originalStartTime: block.startTime,
      });
    }
  });

  resultBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  return {
    blocks: resultBlocks,
    actions,
    minutesBehind,
  };
}

export function generateSalvageStreakReplan(
  blocks: Block[],
  now: Date = new Date()
): ReplanResult {
  const baseResult = generateReplan(blocks, now);
  
  const aggressiveActions = baseResult.actions.map(action => {
    if (action.action === 'skipped' && !blocks.find(b => b.id === action.blockId)?.protected) {
      const block = blocks.find(b => b.id === action.blockId);
      if (block) {
        const fallbackMinutes = block.fallbackMinutes || Math.round(block.duration * 0.5);
        return {
          ...action,
          action: 'shrunk' as ReplanAction,
          newDuration: fallbackMinutes,
        };
      }
    }
    return action;
  });

  return {
    ...baseResult,
    actions: aggressiveActions,
  };
}

export function generateHardResetReplan(
  blocks: Block[],
  now: Date = new Date()
): ReplanResult {
  const nowMinutes = roundToNextQuarter(timeToMinutes(
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  ));

  const resultBlocks: Block[] = blocks
    .filter(b => b.fixed || b.protected || b.completed)
    .map(block => {
      if (!block.fixed && !block.completed) {
        return {
          ...block,
          startTime: minutesToTime(nowMinutes + 30),
          duration: block.fallbackMinutes || Math.round(block.duration * 0.5),
        };
      }
      return block;
    });

  const actions: ReplanResult['actions'] = blocks
    .filter(b => !b.fixed && !b.protected && !b.completed)
    .map(block => ({
      blockId: block.id,
      action: 'skipped' as ReplanAction,
      originalStartTime: block.startTime,
    }));

  return {
    blocks: resultBlocks.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    actions,
    minutesBehind: 0,
  };
}

export function checkForDrift(blocks: Block[], now: Date = new Date()): string | null {
  const nowMinutes = timeToMinutes(
    `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  );

  for (const block of blocks) {
    if (block.completed || block.fixed) continue;
    
    const blockStart = timeToMinutes(block.startTime);
    const minutesLate = nowMinutes - blockStart;
    
    if (minutesLate > 10) {
      return block.id;
    }
  }

  return null;
}
