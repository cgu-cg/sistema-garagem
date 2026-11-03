import { useEffect, useRef, useState, type ButtonHTMLAttributes } from 'react';

function scrollParent(element: HTMLElement): HTMLElement {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY) && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return (document.scrollingElement ?? document.documentElement) as HTMLElement;
}

export function useTrafficRowDrag(enabled: boolean, onMove: (source: string, target: string) => void,
  onStep: (id: string, step: number) => void) {
  const pointer = useRef<{ id: string; startY: number; x: number; y: number; scroll: HTMLElement } | null>(null);
  const active = useRef(false), target = useRef<string | null>(null), frame = useRef<number | null>(null);
  const [dragging, setDragging] = useState<string | null>(null), [over, setOver] = useState<string | null>(null);
  const callbacks = useRef({ onMove, onStep }); callbacks.current = { onMove, onStep };
  function reset() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null; pointer.current = null; active.current = false; target.current = null;
    setDragging(null); setOver(null);
  }
  function updateTarget() {
    if (!pointer.current) return;
    const row = document.elementFromPoint(pointer.current.x, pointer.current.y)?.closest('[data-traffic-row-id]');
    const next = row?.getAttribute('data-traffic-row-id') ?? null;
    if (target.current !== next) { target.current = next; setOver(next); }
  }
  function autoScroll() {
    if (!pointer.current || !active.current) { frame.current = null; return; }
    const { scroll, y } = pointer.current, bounds = scroll.getBoundingClientRect();
    const top = Math.max(0, bounds.top), bottom = Math.min(innerHeight, bounds.bottom);
    const step = y < top + 36 ? -12 : y > bottom - 36 ? 12 : 0;
    if (step) { scroll.scrollTop += step; updateTarget(); }
    frame.current = requestAnimationFrame(autoScroll);
  }
  useEffect(() => { if (!enabled) reset(); }, [enabled]);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  function handleProps(id: string): ButtonHTMLAttributes<HTMLButtonElement> {
    return {
      draggable: false, disabled: !enabled,
      onDragStart: event => event.preventDefault(),
      onKeyDown: event => {
        if (!enabled || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault(); callbacks.current.onStep(id, event.key === 'ArrowUp' ? -1 : 1);
      },
      onPointerDown: event => {
        if (!enabled || event.button !== 0) return;
        pointer.current = { id, startY: event.clientY, x: event.clientX, y: event.clientY, scroll: scrollParent(event.currentTarget) };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: event => {
        if (!enabled || !pointer.current) return;
        pointer.current.x = event.clientX; pointer.current.y = event.clientY;
        if (!active.current && Math.abs(event.clientY - pointer.current.startY) < 6) return;
        if (!active.current) {
          active.current = true; setDragging(pointer.current.id); frame.current = requestAnimationFrame(autoScroll);
        }
        updateTarget();
      },
      onPointerUp: () => {
        const source = active.current ? pointer.current?.id : null, destination = target.current;
        reset(); if (enabled && source && destination && source !== destination) callbacks.current.onMove(source, destination);
      },
      onPointerCancel: reset,
    };
  }
  return { dragging, over, handleProps };
}
