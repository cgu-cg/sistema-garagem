import { operationalContext } from '@/lib/mvpTemporal';
import { c4OperationalContext, initialCIDate } from '@/lib/c4';
import { canWriteC4 } from '@/lib/c4Authorization';
import { canMutate, getMutationState, subscribeMutationState, confirmRefresh, requireRefresh, SavedRefreshRequired } from '@/lib/mvpTemporal';
import { fetchManutencaoDataFromApi } from '../manutencao/manutencaoManager';
import { saveCISnapshot } from './ciManager';
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BloqueioCarro } from "@/data/solturaData";
import { INVENTORY_CARS } from "@/data/inventoryCars";
import { 
  getConsorciadaByCarro,
  getGaragemFisicaByCarro,
  fetchCIBloqueiosFromApi,
} from "./ciManager";
import { useAuth } from "@/stores/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Popover, 
  PopoverAnchor, 
  PopoverContent 
} from "@/components/ui/popover";
import { c4Enabled, c4Folha, c4Mutable, c4Configured } from '@/lib/c4';
import { garageOne } from '@/lib/c4Vehicles';
import { c4KnownFields, c4EditedText } from '@/lib/c4ItemFields';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Bus, 
  Wrench, 
  X, 
  CheckCircle2, 
  Trash2, 
  Check, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  ChevronDown, 
  RotateCcw,
  Printer,
  MoreVertical,
  Pencil,
  AlertTriangle,
  Eraser,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CiManutencaoViewProps {
  ciList: BloqueioCarro[];
  setCiList: React.Dispatch<React.SetStateAction<BloqueioCarro[]>>;
  garagemFiltro?: "VCG" | "VCM" | "TODAS";
  dataOperacao?: string;
  setDataOperacao?: (d: string) => void;
}

export type TabCategory = "PREVENTIVA" | "OFICINA" | "REFORCO" | "BLOQUEADO";

export interface CarOption {
  prefixo: string;
  garagem: "VCM" | "VCG";
}

interface CarSearchSelectProps {
  value: string;
  onChange: (prefixo: string) => void;
  allowedCars: CarOption[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Componente de seleção de veículos com campo de busca integrado (digita e filtra em tempo real)
 */
export function CarSearchSelect({
  value,
  onChange,
  allowedCars,
  placeholder = "Carro",
  className,
  inputClassName,
  autoFocus = false,
  required = false,
  disabled = false,
}: CarSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o texto do input quando o value externo mudar
  useEffect(() => {
    setSearch(value || "");
  }, [value]);

  // Lista de carros filtrada pela busca digitada
  const filteredCars = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allowedCars;
    return allowedCars.filter(c => c.prefixo.toLowerCase().includes(q));
  }, [allowedCars, search]);

  // Seleciona um veículo
  const handleSelectCar = (prefixo: string) => {
    onChange(prefixo);
    setSearch(prefixo);
    setIsOpen(false);
  };

  // Limpa a seleção
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Trata teclas especiais (Enter, Esc)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCars.length > 0) {
        handleSelectCar(filteredCars[0].prefixo);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSearch(value || "");
    } else if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative flex items-center w-full", className)}>
          <div className="absolute left-2 text-muted-foreground/60 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </div>

          <Input
            ref={inputRef}
            type="text"
            value={search}
            disabled={disabled}
            required={required}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) setIsOpen(true);
              
              const exactMatch = allowedCars.find(c => c.prefixo === e.target.value.trim());
              if (exactMatch) {
                onChange(exactMatch.prefixo);
              }
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={cn(
              "pl-7 pr-12 font-mono text-xs font-bold bg-background h-8 transition-all",
              value && "border-primary/50 bg-primary/5 text-foreground",
              inputClassName
            )}
          />

          <div className="absolute right-1 flex items-center gap-0.5">
            {/* Botão Limpar */}
            {(search || value) && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                tabIndex={-1}
                className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Limpar seleção"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Indicador de Dropdown */}
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                if (!disabled) {
                  setIsOpen(!isOpen);
                  inputRef.current?.focus();
                }
              }}
              className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", isOpen && "rotate-180")} />
            </button>
          </div>
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[var(--radix-popover-anchor-width)] min-w-[190px] max-h-56 overflow-y-auto p-1.5 z-50 bg-popover text-popover-foreground border rounded-xl shadow-xl space-y-0.5"
      >
        {filteredCars.length === 0 ? (
          <div className="py-3 text-center text-xs text-muted-foreground">
            <Bus className="w-4 h-4 mx-auto mb-1 opacity-40" />
            Nenhum carro encontrado para <strong>"{search}"</strong>
          </div>
        ) : (
          filteredCars.map((c) => {
            const isSelected = c.prefixo === value;
            return (
              <button
                key={c.prefixo}
                type="button"
                onClick={() => handleSelectCar(c.prefixo)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer group",
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs">{c.prefixo}</span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {c.garagem}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}

function LogoConsorcioSvg({ className }: { className?: string }) {
  return (
    <svg 
      id="Camada_1" 
      data-name="Camada 1" 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 300 114.38" 
      className={className}
      style={{ maxHeight: "32px", maxWidth: "130px", width: "auto", height: "32px", objectFit: "contain", display: "block" }}
    >
      <defs>
        <style>{`.cls-1{fill:#fff}.cls-1,.cls-10,.cls-2,.cls-3,.cls-4,.cls-5,.cls-6,.cls-7,.cls-8,.cls-9{fill-rule:evenodd}.cls-2{fill:#d7dc47}.cls-3{fill:#7cb552}.cls-4{fill:#70ac51}.cls-5{fill:#82bb8b}.cls-6{fill:#599b51}.cls-7{fill:#528c81}.cls-8{fill:#37393a}.cls-11,.cls-9{fill:#595b5c}.cls-10{fill:#686969}`}</style>
      </defs>
      <title>Consórcio Guaicurus</title>
      <path className="cls-1" d="M75.48 46.93c0 1.64-.8 3-1.78 3s-1.78-1.33-1.78-3 .79-3 1.78-3 1.78 1.32 1.78 3"/>
      <path className="cls-1" d="M86.15 26.3l-21.24 4.92s-2.15 11 .34 16.65l2.66.41 3.83.37s-.17-4.36 2.32-4.32 1.42 4.32 1.42 4.32l2.51.21L81.08 43l.59-3.61z"/>
      <path className="cls-2" d="M90.76 48.28C214.86 41.63 270.65 64.76 257 75.85c8.92 3.32 15.56 6.58 19.78 9.46 7-3.8 14.64-7.63 20.21-10.07 24.77-10.86-106.14-44.43-206.18-27"/>
      <path className="cls-3" d="M257 75.85a13.46 13.46 0 0 1-3.08 1.81 87 87 0 0 0-11.32 6.25A460.21 460.21 0 0 1 262 94.15a154.89 154.89 0 0 1 14.75-8.84c-4.22-2.88-10.86-6.13-19.78-9.46"/>
      <path className="cls-4" d="M257 75.85c13.7-11.09-42.09-34.21-166.19-27.56-3.13.54-6.24 1.14-9.31 1.79C164.13 51 225.06 63.94 257 75.85"/>
      <path className="cls-5" d="M276.73 85.31A154.89 154.89 0 0 0 262 94.15c-6.75-3.79-13.19-7.18-19.43-10.24-6.85 4.36-13.49 9.37-17.72 12.41-25.08-10.82-43.39-30-122.65-41.76 37 6.51 93.78 22.23 135.18 59.82 0 0 15.12-12.91 40.37-19.24 6.28-1.57 5.72-5.23-1-9.83"/>
      <path className="cls-6" d="M81.46 50.08l-.38.08c79.74 7 115.69 11.32 161.47 33.75a87 87 0 0 1 11.32-6.25 13.24 13.24 0 0 0 3.13-1.81C225.06 63.94 164.13 51 81.46 50.08"/>
      <path className="cls-7" d="M81.08 50.16q4.78-1 9.68-1.87-12.62.71-26.18 1.77C176.38 60.7 196.19 84 224.83 96.32c4.23-3 10.87-8 17.72-12.41-45.78-22.43-81.73-26.79-161.47-33.75"/>
      <path className="cls-1" d="M77.61 48.82l15.6 1.32 3.69.58-1.12-26.53-2.26 1-7 .92c-.15.11-5.3 5.63-5.22 6.11s-3.48 16.47-3.48 16.47z"/>
      <path className="cls-8" d="M73.73 50.55a2.87 2.87 0 0 0 2.65-1.9l1.61.11s-.76 2.07-4.26 1.79"/>
      <path className="cls-8" d="M75.48 50.5a2.9 2.9 0 0 0 2.64-1.68l1.61.09s-.73 1.83-4.25 1.59M73.7 48.85c-.55 0-1-.87-1-2s.4-2 .95-2 1 .86 1.05 2-.4 2-1 2.05m2.3-.51l-.11-.39-.07-.6v-.87l-.19-.94-.32-.79-.16-.4-.54-.64-.81-.41h-.89l-.5.42-.41.63-.18.8-.1 1.21v.87l-.09.33v.41s.44 2.62 2.33 2.55a3 3 0 0 0 2.21-2v-.13z"/>
      <path className="cls-9" d="M5.37 71.09l-.55.2-.53.06a1.73 1.73 0 0 1-1.6-.9 5.93 5.93 0 0 1-.51-2.81 6 6 0 0 1 .51-2.77 1.65 1.65 0 0 1 1.53-.94l.59.06.56.21v1.27L5 65.21l-.36-.09a.92.92 0 0 0-.85.65 5 5 0 0 0-.27 1.93 4.25 4.25 0 0 0 .27 1.77.88.88 0 0 0 .83.59L5 70l.38-.24zM14.8 67.6a5.35 5.35 0 0 0 .26 1.93.88.88 0 0 0 .82.61.87.87 0 0 0 .82-.61 5.35 5.35 0 0 0 .3-1.93 5 5 0 0 0-.26-1.9.86.86 0 0 0-.82-.61.87.87 0 0 0-.82.6 5.27 5.27 0 0 0-.26 1.91m-1.33 0a5.06 5.06 0 0 1 .61-2.76 2 2 0 0 1 1.8-1 2 2 0 0 1 1.79 1 6.55 6.55 0 0 1 0 5.52 2 2 0 0 1-1.79 1 2 2 0 0 1-1.8-1 5.09 5.09 0 0 1-.61-2.76M27 71.21v-7.16h1.3v.72a1.69 1.69 0 0 1 .63-.59 1.75 1.75 0 0 1 .87-.2 1.48 1.48 0 0 1 1.17.44 2 2 0 0 1 .39 1.34v5.45h-1.28V66.4a1.9 1.9 0 0 0-.19-1 .78.78 0 0 0-.66-.25.79.79 0 0 0-.66.26 1.26 1.26 0 0 0-.23.81v5zM40.05 69.7l.56.35.55.13a.92.92 0 0 0 .68-.25.79.79 0 0 0 .26-.63 1.86 1.86 0 0 0-.72-1.15l-.14-.15a5 5 0 0 1-.94-1.11 1.86 1.86 0 0 1-.25-1 2 2 0 0 1 .56-1.47 1.91 1.91 0 0 1 1.39-.5l.58.06.55.22v1.35l-.46-.37-.57-.11-.61.23-.23.59A1.64 1.64 0 0 0 42 67l.2.2a4.4 4.4 0 0 1 .9 1.08 2.25 2.25 0 0 1 .25 1.07 1.91 1.91 0 0 1-.56 1.47 2 2 0 0 1-1.48.53l-.6-.06-.65-.2zM53.18 63.08l1.2-2.52h1.3L54 63.08zM53 67.6a5.35 5.35 0 0 0 .26 1.93.86.86 0 0 0 1.64 0 5.1 5.1 0 0 0 .27-1.93 5 5 0 0 0-.27-1.9.86.86 0 0 0-1.64 0 5.27 5.27 0 0 0-.26 1.9m-1.33 0a5.06 5.06 0 0 1 .61-2.76 2.17 2.17 0 0 1 3.59 0 6.55 6.55 0 0 1 0 5.52 2.17 2.17 0 0 1-3.59 0 5.09 5.09 0 0 1-.61-2.76M65.21 71.21v-7.16h1.27v1a1.86 1.86 0 0 1 1.73-1.18v1.39H68a1.49 1.49 0 0 0-1.12.38 1.72 1.72 0 0 0-.37 1.2v4.32zM79.5 71.09l-.53.2-.54.06a1.72 1.72 0 0 1-1.6-.9 5.93 5.93 0 0 1-.51-2.81 5.83 5.83 0 0 1 .52-2.77 1.63 1.63 0 0 1 1.51-.94l.59.06.56.21v1.27l-.36-.26-.35-.09a.91.91 0 0 0-.85.65 5 5 0 0 0-.29 1.93 4.82 4.82 0 0 0 .27 1.77.9.9 0 0 0 .84.59l.38-.08.36-.24zM88 64.05h1.31v7.16H88zm-.18-2.13l.25-.61.6-.25.58.25.24.61-.24.6-.58.24-.6-.24zM99.41 67.6a5.14 5.14 0 0 0 .26 1.93.86.86 0 0 0 .81.61.88.88 0 0 0 .83-.61 5.35 5.35 0 0 0 .26-1.93 5.21 5.21 0 0 0-.26-1.9.87.87 0 0 0-.83-.61.85.85 0 0 0-.81.6 4.86 4.86 0 0 0-.26 1.91m-1.33 0a5.07 5.07 0 0 1 .6-2.76 2.17 2.17 0 0 1 3.59 0 6.45 6.45 0 0 1 0 5.52 2.17 2.17 0 0 1-3.59 0 5.1 5.1 0 0 1-.6-2.76"/>
      <path className="cls-1" d="M110.37 49.44c0 2.62-1 4.74-2.1 4.74s-2.1-2.12-2.1-4.74.93-4.74 2.1-4.74 2.1 2.12 2.1 4.74M145.93 52.72c0 3.81-1.36 6.88-3.05 6.88s-3-3.07-3-6.88 1.36-6.87 3-6.87 3.05 3.08 3.05 6.87"/>
      <path className="cls-1" d="M93.21 50.14c0 .29 13 1.84 13 1.84s.33-7.85 1.73-7.07 2 .35 2.31 1.78a19.83 19.83 0 0 1 .34 2.43c.1.85.2 1.4.34 2.21s.08 1.24.43 1.43a33.73 33.73 0 0 0 3.48.66l18.66 2.8 4.11.38a7 7 0 0 0 .56-1.62c.2-.58 1.51-4.12 1.61-4.84s2.73-3 2.73-3 4.31-.07 3.73.41.14 1.33.05 2.24.6 2.25.53 3 .82 1.63.6 2.27 2.12 1.88 2 2.08L151 58.2l12.46 1.46 7.35 1.21 9.75.19 10.44-.19 13.34-1.14 8.86-.87.42-1.2.41-2.35V50.4l-.65-13.3-.68-3.64-1.53-6.91a4.59 4.59 0 0 1 .79-.67 2.88 2.88 0 0 0 .88-.71l.2-1.29-.34-1.72-3.26-6.71-1.44-1.67-1.31-.9-1.68-.25-1.77-1.32-5.61-2.12L189.55 7s-5.44-2.35-6.94-3a43.17 43.17 0 0 0-6.79-2.3 37.76 37.76 0 0 0-4.48-.7h-9.18l-10.37 1.13-7.13 1.23s-1.61.6-2.09.81-4 2.14-4 2.14l-38.39 15.8-6.51 3.11S92 39.1 93.21 50.14"/>
      <path className="cls-10" d="M144.47 4.53V3.4c-2.53.74-50.94 21.47-51 21.58l-.19-.19.13.5zM138.5 10c5.3-2.42 20.55-6.08 20.55-6.08-3-.43-18 4.44-18 4.44l-47.74 18-.15-.25.15.56z"/>
      <path className="cls-8" d="M208.73 15.75l3.56 8s.2 1.67-.6 1.9a5.07 5.07 0 0 1-1.05.2 95.73 95.73 0 0 0-5-12.63c.29.13 2.52 1.18 3.12 2.5M145.92 5.53C147.25 5.1 159.46.89 168 2.22a5.62 5.62 0 0 1 4.79 3.86s6.39 20.78 7.48 24.67S191.18 44.83 193 45.92a8.82 8.82 0 0 0 1.87.53c.71 0 14.64 1 16.84-.83 0 0 2.13-9.47.32-15.33 0 0-.35-1.24-1-3.14.7-.36 2.59-1.75 1.89-3.64-.82-2.19-3.59-8.12-3.59-8.12a10.77 10.77 0 0 0-4.23-3.09c-.37-.68-.76-1.33-1.13-1.89 0 0-3.12-6.47-17.76-8.68 0 0-24.35-4.83-41.74 1.66V4.9s.12 1.06 1.44.63"/>
      <path className="cls-8" d="M146 64.7a8.73 8.73 0 0 0 4.27-5.7v-.37l.81.09c-1.4 4-3.6 5.46-5.12 6m-5.4-10.56a10.82 10.82 0 0 0 1.3 4.59 2 2 0 0 0 1.69 1.05c1.5-.11 2.51-2.93 2.26-6.3a10.69 10.69 0 0 0-1.29-4.59 2 2 0 0 0-1.68-1.06c-1.5.1-2.52 2.93-2.28 6.31m-31.79 2.23a4.49 4.49 0 0 0 2.52-2.94H111.62c-.82 2.19-2.14 2.76-2.85 2.89m-1.92-6.3c0 1.92.66 3.45 1.38 3.41s1.28-1.61 1.24-3.52-.65-3.46-1.37-3.43-1.28 1.62-1.25 3.54m106.23-13.69s.06.87.14 2.24c-.06-.74-.11-1.25-.14-1.42 0 0-.15 9.47-2.2 13.57v.12c-2.46.91-14.59.77-17.42.73-1.28-1.74-9.68-12.91-13.69-12.69 0 0 4.67 11.31 7.22 12.6a29.7 29.7 0 0 0 5.26 1.29l1.38-1-.15-.2c12.76.65 16.41-.12 17.4-.49v.25l.56 1.08a15.18 15.18 0 0 0 2.14-1.8c0 3.52-.29 6.51-1 7.27-1.84 2.13-36.95 3.13-42.1 2.22l-20-2.31s-.91.44-1-1.63c0 0-.33-14.53-8.19-13.6 0 0-4.21-.26-4.07 10.23 0 0 .18 3-.26 3L112 52.9s-.55.06-.7-1.28c0 0 0-11.23-4.85-7.9 0 0-1.13.75-1 7.66v.14l-12.24-1.61-.56.18v.44l12.83 1.72c.14.85.85 4.31 3 4.22h.08a4.81 4.81 0 0 0 5.1-2.7h.21c-1.19 2.73-3.33 2.57-3.33 2.57 3.5.32 4.91-1.46 5.36-2.31 7.28.93 21 2.73 21.6 2.87l.09.12v.48a15.07 15.07 0 0 0 2 4.86c1.06 1.65 2.63 3.07 4.88 2.91a5.16 5.16 0 0 0 .68-.22c7 .33 9.45-4.39 10-5.84 5.77.67 14.5 1.67 15.25 1.73 1.11.09 15.28.39 20.22 0s21.61-.93 22.63-2.28 1.44-12.9-.25-22.31"/><path className="cls-8" d="M185.4 55.37s-3.08-.55-4.22-.21a5.93 5.93 0 0 0 4.38 3.51zM92.6 35.83l12.05 1q-5.48.78-11.48 1.84s35-3.3 39.54-3.16c11.21.36 31.16-.51 43.45 11.21 0 0 2.46-.2 2.57-2.13 0 0-.35-1.89-.79-4.45-.32-5.88-.92-16-1.26-18v-.11l-.07-.15a3.12 3.12 0 0 0-1.53-1.24 9.48 9.48 0 0 1-2.14-.89 2.3 2.3 0 0 1-1.44-.86c-.63-.86-2.77-7.76-2.77-7.76-.74-2.61 2.42-3.23 2.42-3.23C169.72-.47 139 12.24 139 12.24L93.31 27.72l-.16.16-.27 5.61 13.27-3.57c-.75 1.61-13.55 5.91-13.55 5.91"/><path className="cls-9" d="M18.48 93.8c0 .67.07 1.32.1 2s0 1.25 0 1.83c0 4.69-.77 8.15-2.28 10.39s-3.88 3.35-7 3.35-5.64-1.27-7.09-3.8S0 100.82 0 95s.73-10.11 2.2-12.63 3.87-3.79 7.21-3.79a9.15 9.15 0 0 1 5.72 1.67 8.78 8.78 0 0 1 3 5.08l-3.83 1.83a6.39 6.39 0 0 0-1.67-3.48 4.42 4.42 0 0 0-3.17-1.14 4 4 0 0 0-4 2.68q-1.15 2.69-1.16 9.69c0 4.63.39 7.84 1.16 9.66a4 4 0 0 0 4 2.71 4.1 4.1 0 0 0 3.75-2.06 12 12 0 0 0 1.25-6.15v-1.51H9.85V93.8zM22.83 102.44V79h4.25v23.79a4.84 4.84 0 0 0 1 3.4 4.14 4.14 0 0 0 3.15 1.09 4.12 4.12 0 0 0 3.15-1.09 4.93 4.93 0 0 0 1-3.4V79h4.27v23.44c0 3.09-.68 5.35-2 6.78s-3.49 2.12-6.41 2.12-5.06-.7-6.4-2.12-2-3.69-2-6.78M52.17 87.25l-2.89 13.84H55zM42.65 111l7.48-32h4l7.48 32h-4.3l-1.53-6.28h-7.29L47 111z"/><path className="cls-11" d="M64.88 78.99h4.31v31.96h-4.31z"/><path className="cls-9" d="M88.2 110.23a9 9 0 0 1-2.17.85 9.62 9.62 0 0 1-2.31.26 8 8 0 0 1-7.34-4c-1.62-2.66-2.43-6.7-2.43-12.08s.86-9.64 2.59-12.46a8.45 8.45 0 0 1 7.67-4.22 9.49 9.49 0 0 1 2.11.22 9.89 9.89 0 0 1 1.88.63v4.1a8.45 8.45 0 0 0-1.76-.68 6.23 6.23 0 0 0-1.59-.23 5.28 5.28 0 0 0-5 3c-1 2-1.58 5.2-1.58 9.58q0 6.12 1.5 9.06a4.89 4.89 0 0 0 4.63 3 5.8 5.8 0 0 0 1.81-.29 10.45 10.45 0 0 0 2-.91zM91.79 102.44V79H96v23.79a4.88 4.88 0 0 0 1 3.4 4.16 4.16 0 0 0 3.16 1.09 4.09 4.09 0 0 0 3.14-1.09 4.88 4.88 0 0 0 1-3.4V79h4.27v23.44q0 4.64-2 6.78c-1.35 1.42-3.48 2.12-6.4 2.12s-5.06-.7-6.41-2.12-2-3.69-2-6.78M118.43 92.9h1.33a4.81 4.81 0 0 0 3.72-1.23c.72-.81 1.08-2.26 1.08-4.33 0-1.72-.34-2.92-1-3.58s-2-1-3.88-1h-1.21zm0 2.45V111h-4.31V79h5.21q5.19 0 7.39 1.93c1.46 1.29 2.2 3.42 2.2 6.42a9 9 0 0 1-1.51 5.53 6.4 6.4 0 0 1-4.52 2.35l7.6 15.74h-4.61l-7.32-15.61zM133.36 102.44V79h4.25v23.79a4.88 4.88 0 0 0 1 3.4 5.11 5.11 0 0 0 6.31 0 4.93 4.93 0 0 0 1-3.4V79h4.27v23.44c0 3.09-.69 5.35-2 6.78s-3.49 2.12-6.4 2.12-5.06-.7-6.4-2.12-2-3.69-2-6.78M154.88 105.35a14.66 14.66 0 0 0 2.83 1.39 7.35 7.35 0 0 0 2.43.45 4.27 4.27 0 0 0 3.12-1.15 4.16 4.16 0 0 0 1.17-3.08q0-2.8-4.45-6.45l-.79-.66a17.21 17.21 0 0 1-4-4.34 9.07 9.07 0 0 1-1.12-4.51 8.38 8.38 0 0 1 2.3-6 7.53 7.53 0 0 1 5.69-2.41 11.81 11.81 0 0 1 2.87.35 11.47 11.47 0 0 1 2.74 1.1v4.29a10.49 10.49 0 0 0-2.45-1.33 7 7 0 0 0-2.36-.42 4.46 4.46 0 0 0-3.25 1.19 4.24 4.24 0 0 0-1.23 3.23q0 2.76 4.7 6.53l.69.53a15.17 15.17 0 0 1 3.87 4.24 9.35 9.35 0 0 1 1.14 4.66 8.2 8.2 0 0 1-2.34 6 8 8 0 0 1-6 2.37 9.85 9.85 0 0 1-2.71-.38 14 14 0 0 1-2.86-1.21z"/><path className="cls-8" d="M91 25.7a100.49 100.49 0 0 0-1.34 11.62V49.6h-.85s-.29-14.83 1.59-23.68zM87.6 26.17a3.27 3.27 0 0 0-.52 1.34c-.11.78-.92 13-1.15 21.72h-.44s-.12-23.9 2.11-23.06"/><path className="cls-8" d="M86.83 26.15l-.53.12-20.58 4.76 21.11-4.55v-.33zM86.49 28.99l-20.71 3.07-.53 3.59 20.56 3.4.68-10.06zM85.63 49.44L75.87 49s.15-5.81-2.44-5.4a1.69 1.69 0 0 0-1.27 1.67v3.56l-4.39-.27-3.19-.81 3.36.4 3.82.22s-.67-4.66 1.3-5.1a2 2 0 0 1 2.47 1.39 8.7 8.7 0 0 1 .74 3.71c.15 2.75 0 .3 0 .3l9.67.3s.1.45-.31.43"/><path className="cls-10" d="M64.91 31.22s-1.79 11.6.34 16.24c0 0-2.75-5.44-.34-16.24"/>
    </svg>
  );
}

// 1. PREVENTIVAS (Bloco 1 do Print 01 e Print 02)
const PREVENTIVAS_CARDS = [
  { id: "PREVENTIVA", label: "PREVENTIVAS", desc: "Preventivas Periódicas" },
  { id: "LUBRIFICACAO", label: "LUBRIFICAÇÃO", desc: "Lubrificação Geral" },
  { id: "TROCA_OLEO", label: "TROCA DE ÓLEO", desc: "Troca de Óleo e Filtros" },
  { id: "REVISAO_GERAL", label: "REVISÃO GERAL", desc: "Revisão Geral Preventiva" },
  { id: "SISEP", label: "SISEP", desc: "Vistoria e Reparo SISEP" },
] as const;

// 2. SETORES DA OFICINA (Bloco 2 do Print 01 e Print 02 - 8 cards)
const SETORES_OFICINA = [
  { id: "MECANICA", label: "MECÂNICA", chips: ["Bomba ARLA", "Mecânica Geral", "Suspensão", "Freio", "Diferencial", "Câmbio"] },
  { id: "ELEVADOR", label: "ELEVADOR", chips: ["Elevador Acessibilidade", "Trava de Segurança", "Plataforma", "Cilindro"] },
  { id: "ELETRICA", label: "ELÉTRICA", chips: ["Módulo", "Chicote ARLA 32", "Meia Luz", "Alternador", "Motor de Partida", "Bateria"] },
  { id: "BORRACHARIA", label: "BORRACHARIA", chips: ["Pneu Furado", "Troca de Roda", "Alinhamento", "Balanceamento"] },
  { id: "FUNILARIA", label: "FUNILARIA / PINTURA", chips: ["Sinistro", "Para-choque", "Retoque Pintura", "Chapeação", "Grade Dianteira"] },
  { id: "TACOGRAFO", label: "TACÓGRAFO", chips: ["Aferição", "Troca de Disco", "Lacre Rompido", "Sensor de Velocidade"] },
  { id: "BILHETAGEM", label: "BILHETAGEM", chips: ["Validador", "Catraca Travada", "Cabo WiFi", "Antena"] },
  { id: "LIMPEZA", label: "LIMPEZA", chips: ["Higienização Pesada", "Lavagem Motor", "Polimento", "Bancos"] },
] as const;

// Setores da Oficina onde o campo Motivo / Defeito NÃO é obrigatório
const SETORES_SEM_MOTIVO_OBRIGATORIO = ["ELEVADOR", "BORRACHARIA", "TACOGRAFO", "LIMPEZA"] as const;

// 3. REFORÇO COM HORÁRIO (Bloco 3 do Print 01 e Print 02 - 12 horários fixos em duas colunas)
const FIXED_REFORCO_SLOTS = [
  // Coluna 1 (Esquerda - 6 horários)
  { id: "ref-1", horario: "07:15 - A", defaultMotivo: "" },
  { id: "ref-2", horario: "07:15 - A", defaultMotivo: "" },
  { id: "ref-3", horario: "07:32 - A", defaultMotivo: "" },
  { id: "ref-4", horario: "07:40 - A", defaultMotivo: "" },
  { id: "ref-5", horario: "07:40 - M", defaultMotivo: "" },
  { id: "ref-6", horario: "07:40 - A", defaultMotivo: "" },
  // Coluna 2 (Direita - 6 horários)
  { id: "ref-7", horario: "07:40 - C", defaultMotivo: "" },
  { id: "ref-8", horario: "07:45 - C", defaultMotivo: "" },
  { id: "ref-9", horario: "07:45 - A", defaultMotivo: "" },
  { id: "ref-10", horario: "07:50 - C", defaultMotivo: "" },
  { id: "ref-11", horario: "07:50 - C", defaultMotivo: "" },
  { id: "ref-12", horario: "07:50 - A", defaultMotivo: "" },
] as const;

// 3.1 SLOTS EXTRAS DA COLUNA DE SERVIÇO (Card 3 do Reforço - 6 linhas para carros extras)
const FIXED_REFORCO_EXTRA_SLOTS = [
  { id: "ref-extra-1" },
  { id: "ref-extra-2" },
  { id: "ref-extra-3" },
  { id: "ref-extra-4" },
  { id: "ref-extra-5" },
  { id: "ref-extra-6" },
] as const;

// 4. BLOQUEADOS POR CONSORCIADA (Bloco 4 do Print 01 e Print 02 - Grid 2x2 com bordas vermelhas)
const CONSORCIADAS_BLOQUEIOS = [
  { id: "VSF", label: "BLOQUEADOS VSF", prefixDigit: "2", subtitle: "Viação São Francisco" },
  { id: "VCG", label: "BLOQUEADOS VCG", prefixDigit: "4", subtitle: "Viação Cidade Morena" },
  { id: "JTU", label: "BLOQUEADOS JTU", prefixDigit: "3", subtitle: "Jaguar Transporte Urbano" },
  { id: "VCM", label: "BLOQUEADOS VCM", prefixDigit: "1", subtitle: "Viação Campo Grande" },
] as const;

const BLOQUEIOS_MOTIVOS_RAPIDOS = [
  "Motor", "Transmissão", "Revisão Geral", "Sinistro", "Pastilhas e Disco de Freio",
  "Falta de Peça Para-brisa", "Posto de Molas", "Módulo", "Suspensão", "Câmbio", "Freio", "Elétrica"
];

// Utilitário para normalizar qualquer string de data para o padrão ISO "YYYY-MM-DD"
function normalizeIsoDate(d?: string): string {
  if (!d) return "";
  const trimmed = String(d).trim();
  const clean = trimmed.split(/[\sT]/)[0];
  if (clean.includes("/")) {
    const parts = clean.split("/");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
      }
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }
  return clean;
}

// Utilitário para comparar identificadores de setores de forma insensível a maiúsculas/minúsculas e acentos
function isSetorMatch(cSetor?: string | null, targetSetorId?: string): boolean {
  if (!cSetor || !targetSetorId) return false;
  const s1 = String(cSetor).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const s2 = String(targetSetorId).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s1 === s2;
}

export function CiManutencaoView({ 
  ciList, 
  setCiList, 
  garagemFiltro,
  dataOperacao: propDataOperacao, 
  setDataOperacao: propSetDataOperacao 
}: CiManutencaoViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canEditC4 = canWriteC4(user, 'VCG');

  // Identificação e Gestão da Data de Operação (Padrão Controle de Frota)
  const getTodayString = () => operationalContext().today;
  const getTomorrowString = () => operationalContext().tomorrow;
  const [writeState, setWriteState] = useState(getMutationState);
  const [ready, setReady] = useState(false);
  useEffect(() => subscribeMutationState(() => setWriteState(getMutationState())), []);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const [internalDataOperacao, setInternalDataOperacao] = useState<string>(() => c4Enabled(garagemFiltro === 'VCM' ? 'VCM' : 'VCG') ? initialCIDate() : getTodayString());
  const dataOperacao = propDataOperacao || internalDataOperacao;
  const setDataOperacao = propSetDataOperacao || setInternalDataOperacao;
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatarDataBr = useCallback((isoDate?: string) => {
    if (!isoDate) return "";
    if (isoDate.includes("/")) return isoDate;
    try {
      const [ano, mes, dia] = isoDate.split("-");
      if (ano && mes && dia) return `${dia}/${mes}/${ano}`;
    } catch {}
    return isoDate;
  }, []);

  const formattedData = useMemo(() => {
    return formatarDataBr(dataOperacao) || dataOperacao;
  }, [dataOperacao, formatarDataBr]);

  // Identificação da Garagem Física do Usuário Logado:
  // - VCM (Garagem 1)
  // - VCG (Garagem 2)
  const hasC4Configuration = c4Configured();
  const userGaragemFixa: "VCM" | "VCG" | undefined = useMemo(() => {
    if (hasC4Configuration) return user?.role === 'ADMIN' ? undefined : user?.garagem === 'VCG' || user?.garagem === 'VCM' ? user.garagem : undefined;
    if (user?.garagem === "VCM" || user?.email?.toLowerCase().includes("vcm")) return "VCM";
    if (user?.garagem === "VCG" || user?.email?.toLowerCase().includes("vcg")) return "VCG";
    return undefined;
  }, [user, hasC4Configuration]);

  // Seletor de Garagem: Se o usuário tiver garagem fixa (VCG ou VCM), trava nela. Se for ADMIN geral, permite alternar ou respeita o filtro vindo da Soltura.
  const [adminGaragemFiltro, setAdminGaragemFiltro] = useState<"TODAS" | "VCG" | "VCM">(() => {
    return userGaragemFixa || (garagemFiltro && garagemFiltro !== "TODAS" ? garagemFiltro : "TODAS");
  });

  useEffect(() => {
    if (userGaragemFixa) {
      setAdminGaragemFiltro(userGaragemFixa);
    } else if (garagemFiltro && garagemFiltro !== "TODAS") {
      setAdminGaragemFiltro(garagemFiltro);
    }
  }, [userGaragemFixa, garagemFiltro]);

  // Frota padrão com base nos 464 carros conhecidos, mapeados para suas garagens físicas (incluindo 2002 na Garagem 1 - VCM)
  const [fleetCars, setFleetCars] = useState<Array<{ prefixo: string; garagem: "VCM" | "VCG"; garagemFonte?: number }>>(() => {
    return INVENTORY_CARS.map(c => ({
      prefixo: c,
      garagem: getGaragemFisicaByCarro(c),
    }));
  });
  const [fleetSource, setFleetSource] = useState<"local" | "real" | "mock" | "unavailable" | "unknown">("local");

  // Busca lista atualizada de veículos do SQL Server via API (tabela Veiculos, coluna garagem)
  useEffect(() => {
    let isMounted = true;
    api.getBusesInventory()
      .then((response) => {
        if (!isMounted || !Array.isArray(response.data)) return;
        const mapped = response.data.map((item) => {
          const prefixo = String(item.prefixo || item.idCarro || "");
          const garagemNome: "VCM" | "VCG" = item.garagemNome || getGaragemFisicaByCarro(prefixo);
          return {
            prefixo,
            garagem: garagemNome,
            garagemFonte: Number(item.garagem),
          };
        }).filter((item: { prefixo: string; garagem: "VCM" | "VCG" }) => item.prefixo.length > 0);

        if (mapped.length > 0) {
          setFleetCars(mapped);
          setFleetSource(response.source);
        } else {
          setFleetSource("local");
        }
      })
      .catch((err: any) => {
        console.warn("[CI Manutenção] Usando frota padrão em cache/offline:", err);
        if (isMounted) setFleetSource("unavailable");
      });

    return () => { isMounted = false; };
  }, []);

  // Escopo de Garagem Ativo:
  // - Se for usuário logado na garagem VCG ou VCM: SEMPRE fixo e restrito à sua respectiva garagem!
  // - Se for ADMIN geral (sem garagem específica): pode alternar entre Todas, Garagem 1 (VCM) e Garagem 2 (VCG)
  const activeGaragemScope: "TODAS" | "VCG" | "VCM" = useMemo(() => {
    if (userGaragemFixa) return userGaragemFixa;
    return adminGaragemFiltro;
  }, [userGaragemFixa, adminGaragemFiltro]);

  // Veículos permitidos na visualização de acordo com a garagem
  const allowedCars = useMemo(() => {
    if (activeGaragemScope === 'VCG' && c4Enabled('VCG')) return garageOne(fleetCars);
    if (activeGaragemScope === "TODAS") return fleetCars;
    return fleetCars.filter(c => c.garagem === activeGaragemScope);
  }, [fleetCars, activeGaragemScope, ciList]);

  // Lista ordenada de carros permitidos para os dropdowns / selects
  const sortedAllowedCars = useMemo(() => {
    return [...allowedCars].sort((a, b) => {
      const numA = parseInt(a.prefixo, 10);
      const numB = parseInt(b.prefixo, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.prefixo.localeCompare(b.prefixo);
    });
  }, [allowedCars]);

  // Auxiliar: Encontrar a data anterior mais recente que possua dados salvos

  // Verifica se a folha está fechada (data <= hoje: ex: hoje 01/10/2026, ontem 30/09/2026...)
  const isFolhaFechada = useMemo(() => {
    const target = normalizeIsoDate(dataOperacao);
    const today = getTodayString();
    return Boolean(target && target <= today);
  }, [dataOperacao]);

  // Verifica se a data selecionada é posterior a amanhã (D+2 em diante)
  const isDataFutura = useMemo(() => {
    const target = normalizeIsoDate(dataOperacao);
    const tomorrow = getTomorrowString();
    return Boolean(target && target > tomorrow);
  }, [dataOperacao]);

  // A folha é editável EXCLUSIVAMENTE para a data de amanhã (planejamento da CI)
  const isDataEditavel = useMemo(() => {
    const target = normalizeIsoDate(dataOperacao);
    const tomorrow = getTomorrowString();
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    return Boolean(ready && !writeState.pending && !writeState.refreshRequired && target && target === tomorrow && (c4Enabled(scope) ? canWriteC4(user, scope) : isAdmin) && canMutate(target, 'ci', c4Enabled(scope)) && (c4Enabled(scope) ? activeGaragemScope !== 'TODAS' && c4Mutable(target, scope) : activeGaragemScope !== 'VCM'));
  }, [dataOperacao, clock, user, isAdmin, activeGaragemScope, ready, writeState]);

  // Bloqueio de edição: impede qualquer alteração se a data for <= hoje (fechada) ou > amanhã (futura demais)
  const checkDataFuturaBloqueio = useCallback((): boolean => {
    const target = normalizeIsoDate(dataOperacao);
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    if (!ready || getMutationState().pending || getMutationState().refreshRequired || !(c4Enabled(scope) ? canWriteC4(user, scope) : isAdmin) || !canMutate(target, 'ci', c4Enabled(scope)) || (c4Enabled(scope) ? activeGaragemScope === 'TODAS' || !c4Mutable(target, scope) : activeGaragemScope === 'VCM')) { toast.error('CI somente leitura: contexto, folha em preparacao e janela operacional obrigatorios.'); return true; }
    const today = getTodayString();
    const tomorrow = getTomorrowString();

    if (target && target <= today) {
      toast.error("Folha Fechada para Edição!", {
        description: `A CI desta data (${formatarDataBr(target)}) já foi encerrada e está bloqueada para alterações. Conforme regra operacional, apenas a folha de amanhã (${formatarDataBr(tomorrow)}) pode receber alterações.`,
        duration: 5000,
      });
      return true;
    }

    if (target && target > tomorrow) {
      toast.error("Data Bloqueada para Edição Antecipada!", {
        description: `O planejamento da CI é permitido exclusivamente para a folha de amanhã (${formatarDataBr(tomorrow)}). A folha de ${formatarDataBr(dataOperacao)} ainda não está liberada.`,
        duration: 5000,
      });
      return true;
    }

    return false;
  }, [dataOperacao, formatarDataBr, user, isAdmin, activeGaragemScope, ready]);

  // Consulta da fotografia exata: ausencia de registros nao autoriza heranca.
  const ciListNaData = useMemo(() => ciList.filter(c => normalizeIsoDate(c.data) === normalizeIsoDate(dataOperacao)), [ciList, dataOperacao]);
  const [extraDraftOrders, setExtraDraftOrders] = useState<number[]>([]);
  const extraSlots = useMemo(() => {
    const keys = new Set([...FIXED_REFORCO_EXTRA_SLOTS.map(s => Number(s.id.split('-').slice(-1)[0])), ...extraDraftOrders, ...ciListNaData.filter(i => i.tipoPosicao === 'EXTRA').map(i => i.ordemPosicao || 0)]);
    return [...keys].filter(n => n > 0).sort((a, b) => a - b).map(n => ({ id: `ref-extra-${n}` }));
  }, [ciListNaData, extraDraftOrders]);
  useEffect(() => { setExtraDraftOrders([]); }, [dataOperacao, activeGaragemScope]);
  const commitCI = async (next: BloqueioCarro[], removeBlocked: string[] = []): Promise<boolean> => {
    if (checkDataFuturaBloqueio()) return false;
    const vcm = (i: BloqueioCarro) => normalizeIsoDate(i.data) === normalizeIsoDate(dataOperacao) && getGaragemFisicaByCarro(i.prefixo) === 'VCM';
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    if (!c4Enabled(scope) && JSON.stringify(next.filter(vcm)) !== JSON.stringify(ciList.filter(vcm))) { toast.error('MVP permite alteracoes somente na VCG.'); return false; }
    try { setCiList(await saveCISnapshot(next, normalizeIsoDate(dataOperacao), ciList, removeBlocked, 'save', scope)); return true; }
    catch (error) { if (error instanceof SavedRefreshRequired) toast.warning(error.message); else toast.error(error instanceof Error ? error.message : 'Gravacao nao confirmada. Recarregue.'); return false; }
  };

  const handlePrepareTomorrow = async () => {
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    const ctx = c4OperationalContext(scope);
    if (!ready || getMutationState().pending || getMutationState().refreshRequired || !(c4Enabled(scope) ? canWriteC4(user, scope) : isAdmin) || !ctx.open || (activeGaragemScope === 'VCM' && !c4Enabled(scope)) || (c4Enabled(scope) && activeGaragemScope === 'TODAS')) return;
    try {
      // Apenas valida a preparacao existente; nunca copia D, inclusive destino vazio.
      const saved = await saveCISnapshot(ciList, ctx.tomorrow, ciList, [], 'prepare', scope);
      setCiList(saved); setDataOperacao(ctx.tomorrow);
      toast.success('Preparacao existente consultada. Nenhum item copiado ou reconciliado.');
    } catch (error) { if (error instanceof SavedRefreshRequired) toast.warning(error.message); else toast.error(error instanceof Error ? error.message : 'Preparacao indisponivel.'); }
  };

  // Modal de Relatório Oficial da CI Manutenção (CGU.REG.MT0005)
  const [modalRelatorioOpen, setModalRelatorioOpen] = useState(false);
  const relatorioFolhaRef = useRef<HTMLDivElement>(null);

  // Auxiliar para formatação da data do bloqueio na folha oficial (ex: 2026-09-25 -> 25/set)
  const formatDataBloqueio = (d?: string) => {
    if (!d) return "";
    if (d.includes("/")) return d;
    try {
      const [y, m, day] = d.split("-");
      if (y && m && day) {
        const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
        const mesNome = meses[parseInt(m, 10) - 1] || m;
        return `${day}/${mesNome}`;
      }
    } catch {
      // fallback
    }
    return d;
  };

  // Helper para normalizar o ID de um item ao consolidar folha (preservando os identificadores dos slots de reforço)
  const freezeCloneId = (id: string | undefined, targetDate: string, c: BloqueioCarro): string => {
    if (!id) {
      return `ci-${targetDate}-${c.categoriaPlanilha || "item"}-${c.setorOficina || c.tipoPreventiva || "geral"}-${c.prefixo}`;
    }
    if (id.startsWith("clone-")) {
      const matchRef = id.match(/ci-reforco-(ref(?:-extra)?-\d+)/);
      if (matchRef) {
        return `ci-reforco-${matchRef[1]}-${targetDate}`;
      }
      return `ci-${targetDate}-${c.categoriaPlanilha || "item"}-${c.setorOficina || c.tipoPreventiva || "geral"}-${c.prefixo}`;
    }
    return id;
  };

  // Separação dos dados para preenchimento estrito da folha oficial CGU.REG.MT0005 (filtrados na data selecionada)
  const relatorioData = useMemo(() => {
    const sortByCarro = (a: BloqueioCarro, b: BloqueioCarro) =>
      (a.prefixo || "").localeCompare(b.prefixo || "", undefined, { numeric: true });

    const active = ciListNaData.filter(c => c.status !== "LIBERADO");
    const preventivas = active.filter(c => c.categoriaPlanilha === "PREVENTIVA").sort(sortByCarro);
    const oficina = active.filter(c => c.categoriaPlanilha === "OFICINA").sort(sortByCarro);
    const reforco = active.filter(c => c.categoriaPlanilha === "REFORCO").sort(sortByCarro);
    const bloqueados = active.filter(c => c.categoriaPlanilha === "BLOQUEADO" || !c.categoriaPlanilha).sort(sortByCarro);

    const bloqVSF = bloqueados.filter(c => c.consorciada === "VSF" || (!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && !c.consorciada && c.prefixo.startsWith("2"))).sort(sortByCarro);
    const bloqVCG = bloqueados.filter(c => c.consorciada === "VCG" || (!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && !c.consorciada && c.prefixo.startsWith("4"))).sort(sortByCarro);
    const bloqJTU = bloqueados.filter(c => c.consorciada === "JTU" || (!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && !c.consorciada && c.prefixo.startsWith("3"))).sort(sortByCarro);
    const bloqVCM = bloqueados.filter(c => c.consorciada === "VCM" || (!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && !c.consorciada && c.prefixo.startsWith("1"))).sort(sortByCarro);

    // Linhas dinâmicas para nunca truncar veículos na visualização e na impressão
    const numLinhasBloqSuperiores = Math.max(11, bloqVSF.length, bloqVCG.length);
    const numLinhasBloqInferiores = Math.max(8, bloqJTU.length, bloqVCM.length);

    const prevList = preventivas.filter(c => c.tipoPreventiva === "PREVENTIVA");
    const lubList = preventivas.filter(c => c.tipoPreventiva === "LUBRIFICACAO");
    const oleoList = preventivas.filter(c => c.tipoPreventiva === "TROCA_OLEO");
    const geralList = preventivas.filter(c => c.tipoPreventiva === "REVISAO_GERAL");
    const sisepList = preventivas.filter(c => c.tipoPreventiva === "SISEP");
    const numLinhasPreventivas = Math.max(
      4,
      prevList.length,
      Math.ceil(lubList.length / 2),
      oleoList.length,
      geralList.length,
      sisepList.length
    );

    const mecCount = oficina.filter(c => c.setorOficina === "MECANICA").length;
    const elevCount = oficina.filter(c => c.setorOficina === "ELEVADOR").length;
    const eletCount = oficina.filter(c => c.setorOficina === "ELETRICA").length;
    const borrCount = oficina.filter(c => c.setorOficina === "BORRACHARIA").length;
    const funCount = oficina.filter(c => c.setorOficina === "FUNILARIA").length;
    const tacCount = oficina.filter(c => c.setorOficina === "TACOGRAFO").length;
    const bilhCount = oficina.filter(c => c.setorOficina === "BILHETAGEM").length;
    const limpCount = oficina.filter(c => c.setorOficina === "LIMPEZA").length;
    const numLinhasOficina = Math.max(
      9,
      mecCount,
      elevCount,
      eletCount,
      borrCount,
      funCount,
      tacCount,
      bilhCount,
      limpCount
    );

    return {
      preventivas,
      oficina,
      reforco,
      bloqVSF,
      bloqVCG,
      bloqJTU,
      bloqVCM,
      numLinhasBloqSuperiores,
      numLinhasBloqInferiores,
      numLinhasPreventivas,
      numLinhasOficina,
    };
  }, [ciListNaData]);

  // Data da Informação no padrão oficial: DIA_DA_SEMANA DD/MM/AAAA baseado na data selecionada
  const dataInformacaoFormatada = useMemo(() => {
    try {
      const [y, m, d] = dataOperacao.split("-").map(Number);
      if (y && m && d) {
        const dateObj = new Date(y, m - 1, d, 12, 0, 0);
        const diasSemana = [
          "DOMINGO",
          "SEGUNDA-FEIRA",
          "TERÇA-FEIRA",
          "QUARTA-FEIRA",
          "QUINTA-FEIRA",
          "SEXTA-FEIRA",
          "SÁBADO",
        ];
        const diaSemana = diasSemana[dateObj.getDay()];
        const dia = String(d).padStart(2, "0");
        const mes = String(m).padStart(2, "0");
        const ano = y;
        return `${diaSemana} ${dia}/${mes}/${ano}`;
      }
    } catch {}
    return dataOperacao;
  }, [dataOperacao]);

  // Auxiliar para nome de arquivo no padrão oficial: CI-aa-mm-yyyy (ex: CI-25-09-2026)
  const formatCiFilename = (dateIso: string) => {
    try {
      const [y, m, d] = dateIso.split("-");
      if (y && m && d) {
        return `CI-${d}-${m}-${y}`;
      }
    } catch {}
    return `CI-${dateIso}`;
  };

  // Função para Impressão direta da folha A4 em HTML REAL VETORIAL (100% idêntico à visualização da tela)
  const handlePrintRelatorio = () => {
    if (!relatorioFolhaRef.current) return;
    try {
      toast.info("Abrindo impressão de alta fidelidade...");
      const element = relatorioFolhaRef.current;
      const htmlContent = element.outerHTML;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.top = "-10000px";
      iframe.style.left = "-10000px";
      iframe.style.width = "210mm";
      iframe.style.minHeight = "297mm";
      iframe.style.border = "0";
      iframe.setAttribute("title", "Impressão CI");
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        // Coleta todas as folhas de estilo ativas da página para o iframe
        const styleSheets = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
          .map(el => el.outerHTML)
          .join("\n");

        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <title>${formatCiFilename(dataOperacao)}</title>
            ${styleSheets}
            <style>
              @page {
                size: A4 portrait;
                margin: 0mm;
              }
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm !important;
                min-height: 297mm !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              [data-folha-ci="true"] {
                box-shadow: none !important;
                border: none !important;
                margin: 0 auto !important;
                width: 210mm !important;
                min-height: 297mm !important;
                padding: 5mm 8mm !important;
                box-sizing: border-box !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
            <script>
              window.focus();
              setTimeout(() => {
                window.print();
              }, 300);
            </script>
          </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 15000);
      }
    } catch (err) {
      console.error("Erro na impressão do relatório CI:", err);
      toast.error("Erro ao preparar impressão.");
    }
  };

  // Estado do Modal de Inclusão/Edição Rápida de Veículos na CI (Print 03)
  const [quickAddModal, setQuickAddModal] = useState<{
    isOpen: boolean;
    category: "PREVENTIVA" | "OFICINA" | "BLOQUEADO";
    subType: string;
    title: string;
    chips: readonly string[] | string[];
    isEditing?: boolean;
    existingId?: string;
  }>({
    isOpen: false,
    category: "PREVENTIVA",
    subType: "PREVENTIVA",
    title: "",
    chips: [],
    isEditing: false,
    existingId: undefined
  });

  const [quickAddCarro, setQuickAddCarro] = useState<string>("");
  const [quickAddMotivo, setQuickAddMotivo] = useState<string>("");
  const [quickAddDataBloqueio, setQuickAddDataBloqueio] = useState(operationalContext().today);
  const [isOutroMotivo, setIsOutroMotivo] = useState<boolean>(false);

  // Estado local para armazenar escolhas de Prefixo, Motivo e Obs dos slots de reforço antes de confirmar no botão de salvar
  const [reforcoDrafts, setReforcoDrafts] = useState<Record<string, { prefixo?: string; motivo?: string; obs?: string }>>(() => {
    try {
      const saved = localStorage.getItem(`reforco_drafts_${dataOperacao}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`reforco_drafts_${dataOperacao}`);
      if (c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')) { setReforcoDrafts({}); return; }
      if (saved) {
        setReforcoDrafts(JSON.parse(saved));
      } else {
        setReforcoDrafts({});
      }
    } catch {
      setReforcoDrafts({});
    }
  }, [dataOperacao, ciList]);

  // Titulo da data exata; copia apenas no comando explicito de preparacao.
  const [reforcoServicoTipo, setReforcoServicoTipo] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`reforco_servico_tipo_${dataOperacao}`);
      if (saved) return saved;
    } catch {}
    return "INSPEÇÃO";
  });

  useEffect(() => {
    try {
      const targetDate = normalizeIsoDate(dataOperacao);
      const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
      if (c4Enabled(scope)) { setReforcoServicoTipo(c4Folha(targetDate, scope)?.tituloColunaAdicional || ''); return; }
      const tomorrowIso = getTomorrowString();
      if (targetDate && targetDate > tomorrowIso) {
        setReforcoServicoTipo("INSPEÇÃO");
        return;
      }
      const savedTipo = localStorage.getItem(`reforco_servico_tipo_${dataOperacao}`);
      if (savedTipo) {
        setReforcoServicoTipo(savedTipo);
      } else {
        setReforcoServicoTipo("INSPEÇÃO");
      }
    } catch {
      setReforcoServicoTipo("INSPEÇÃO");
    }
  }, [dataOperacao, ciList]);

  const handleReforcoServicoTipoChange = async (novoTipo: string) => {
    if (checkDataFuturaBloqueio()) return;
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    if (c4Enabled(scope)) {
      try { setCiList(await saveCISnapshot(ciList, normalizeIsoDate(dataOperacao), ciList, [], 'save', scope, novoTipo)); setReforcoServicoTipo(novoTipo); }
      catch (error) { toast.error(error instanceof Error ? error.message : 'Titulo nao salvo.'); }
      return;
    }
    setReforcoServicoTipo(novoTipo);
    try {
      localStorage.setItem(`reforco_servico_tipo_${dataOperacao}`, novoTipo);
    } catch {}
  };

  // Estado do Diálogo de Conflito de Veículo já Cadastrado na CI
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    carro: string;
    existingLocations: string[];
    targetLocation: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    carro: "",
    existingLocations: [],
    targetLocation: "",
    onConfirm: () => {},
  });

  // Localiza onde um carro já está registrado na CI na data consultada
  const findExistingCarLocations = useCallback((prefixo: string, excludeId?: string, excludeSlotId?: string): string[] => {
    const clean = (prefixo || "").replace(/\D/g, "");
    if (!clean) return [];

    const locations: string[] = [];
    ciListNaData.forEach(item => {
      if (excludeId && item.id === excludeId) return;
      if (excludeSlotId && (item.id === `ci-reforco-${excludeSlotId}-${dataOperacao}` || (item as any).reforcoSlotId === excludeSlotId)) return;
      const itemPref = (item.prefixo || "").replace(/\D/g, "");
      if (itemPref !== clean) return;
      if (item.status === "LIBERADO") return;

      let locNome = "";
      const isBloqueado = item.categoriaPlanilha === "BLOQUEADO" || (!item.categoriaPlanilha && !item.setorOficina && !item.tipoPreventiva && !item.horarioReforco);
      if (isBloqueado) {
        const cons = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? item.consorciada : item.consorciada || getConsorciadaByCarro(clean);
        locNome = `Bloqueados ${cons}`;
      } else if (item.categoriaPlanilha === "OFICINA" || item.setorOficina) {
        const setorObj = SETORES_OFICINA.find(s => s.id === item.setorOficina);
        locNome = `Oficina ${setorObj?.label || item.setorOficina || "Geral"}`;
      } else if (item.categoriaPlanilha === "PREVENTIVA" || item.tipoPreventiva) {
        const prevObj = PREVENTIVAS_CARDS.find(p => p.id === item.tipoPreventiva);
        locNome = `Preventiva (${prevObj?.label || item.tipoPreventiva || "Geral"})`;
      } else if (item.categoriaPlanilha === "REFORCO" || item.horarioReforco) {
        locNome = `Reforço (${item.horarioReforco})`;
      } else {
        locNome = `CI Manutenção (${item.categoriaPlanilha || "Geral"})`;
      }

      const mot = item.motivo ? ` • Motivo: ${item.motivo}` : "";
      locations.push(`${locNome}${mot}`);
    });

    return locations;
  }, [ciListNaData, dataOperacao]);

  // Estados do Seletor Moderno de Veículos no Modal de Inclusão (Estilo Controle de Frota)
  const [quickAddSelectorOpen, setQuickAddSelectorOpen] = useState(false);
  const [quickAddFilterCompany, setQuickAddFilterCompany] = useState<string>("TODAS");
  const quickAddCarSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (quickAddCarSelectorRef.current && !quickAddCarSelectorRef.current.contains(event.target as Node)) {
        setQuickAddSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCarStatusInCI = (prefixo: string) => {
    const found = ciListNaData.find(c => c.prefixo === prefixo && c.status !== "LIBERADO");
    if (!found) return null;
    if (found.categoriaPlanilha === "BLOQUEADO" || !found.categoriaPlanilha) return "BLOQUEADO";
    if (found.categoriaPlanilha === "OFICINA") return "OFICINA";
    if (found.categoriaPlanilha === "PREVENTIVA") return "PREVENTIVA";
    return "BLOQUEADO";
  };

  const quickAddFilteredCars = useMemo(() => {
    return sortedAllowedCars.filter(car => {
      if (quickAddFilterCompany !== "TODAS") {
        const cons = getConsorciadaByCarro(car.prefixo);
        if (quickAddFilterCompany !== cons) return false;
      }
      if (quickAddCarro.trim()) {
        const q = quickAddCarro.trim().toLowerCase();
        if (!car.prefixo.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [sortedAllowedCars, quickAddFilterCompany, quickAddCarro]);

  // Sincronizar dados atualizados do banco oficial SQL Server
  const handleRefreshData = async () => {
    if (getMutationState().pending) return;
    setReady(false);
    try {
      const [records] = await Promise.all([fetchCIBloqueiosFromApi({ garagem: activeGaragemScope === 'TODAS' ? undefined : activeGaragemScope }), fetchManutencaoDataFromApi(operationalContext().today, activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')]);
      setCiList(records); setReady(true); confirmRefresh();
      toast.success('Dados oficiais atualizados.');
    } catch (error) { requireRefresh(); toast.error(error instanceof Error ? error.message : 'Consulta indisponivel.'); }
  };

  useEffect(() => {
    let active = true;
    setReady(false);
    Promise.all([fetchCIBloqueiosFromApi({ garagem: activeGaragemScope === 'TODAS' ? undefined : activeGaragemScope }), fetchManutencaoDataFromApi(operationalContext().today, activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')])
      .then(([records]) => { if (active) { if (activeGaragemScope === 'TODAS' && c4Enabled('VCG')) setAdminGaragemFiltro('VCG'); setCiList(records); setReady(true); confirmRefresh(); } })
      .catch(error => { if (active && !getMutationState().pending) { requireRefresh(); toast.error(error instanceof Error ? error.message : 'Consulta indisponivel.'); } });
    return () => { active = false; };
  }, [activeGaragemScope, setCiList]);

  // Funções de Suporte para Lançamento Rápido via botão '+' dos Cards
  const openQuickAddModal = (
    category: "PREVENTIVA" | "OFICINA" | "BLOQUEADO",
    subType: string,
    title: string,
    chips: readonly string[] | string[] = []
  ) => {
    if (checkDataFuturaBloqueio()) return;
    setQuickAddModal({
      isOpen: true,
      category,
      subType,
      title,
      chips: [...chips],
      isEditing: false,
      existingId: undefined
    });
    setQuickAddCarro("");
    setQuickAddFilterCompany(!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && category === "BLOQUEADO" && ["VSF", "VCG", "JTU", "VCM"].includes(subType) ? subType : "TODAS");
    setQuickAddDataBloqueio(operationalContext().today);
    setQuickAddSelectorOpen(false);
    setIsOutroMotivo(false);

    if (c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')) {
      setQuickAddMotivo('');
    } else if (category === "PREVENTIVA") {
      const cardInfo = PREVENTIVAS_CARDS.find(p => p.id === subType);
      setQuickAddMotivo(cardInfo ? cardInfo.label : subType);
    } else if (category === "OFICINA") {
      const isOpcional = SETORES_SEM_MOTIVO_OBRIGATORIO.includes(subType.toUpperCase() as any);
      setQuickAddMotivo(isOpcional ? "" : (chips[0] || `Setor ${subType}`));
    } else if (category === "BLOQUEADO") {
      setQuickAddMotivo(chips[0] || "Motor");
    }
  };

  const handleConfirmQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkDataFuturaBloqueio()) return;
    if (!quickAddCarro) {
      toast.error("Por favor, selecione um carro.");
      return;
    }

    const { category, subType, isEditing, existingId } = quickAddModal;
    const cleanCar = quickAddCarro.trim();
    const cleanData = normalizeIsoDate(dataOperacao) || getTodayString();
    const cardInfo = PREVENTIVAS_CARDS.find(p => p.id === subType);
    const isSetorSemDefeito = category === "PREVENTIVA" || (
      category === "OFICINA" && SETORES_SEM_MOTIVO_OBRIGATORIO.includes(subType.toUpperCase() as any)
    );

    const isC4 = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG');
    if (!isSetorSemDefeito && !isC4) {
      if (isOutroMotivo && !quickAddMotivo.trim()) {
        toast.error("Por favor, digite o motivo / defeito.");
        return;
      }
      if (!quickAddMotivo.trim()) {
        toast.error("Por favor, selecione um motivo / defeito.");
        return;
      }
    }

    const motivoFinal = category === "PREVENTIVA"
      ? (cardInfo ? cardInfo.label : subType)
      : isSetorSemDefeito
        ? ""
        : (quickAddMotivo.trim() || `Setor ${subType}`);
    const carroGaragemFisica = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? (activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') : fleetCars.find(c => c.prefixo === cleanCar)?.garagem || getGaragemFisicaByCarro(cleanCar);
    const autoConsorciada = isC4 ? null : getConsorciadaByCarro(cleanCar);

    let mappedTipo: BloqueioCarro["tipo"] = "EM_MANUTENCAO";
    if (category === "PREVENTIVA") mappedTipo = "REFORCO_REVISAO";
    else if (motivoFinal.toLowerCase().includes("motor")) mappedTipo = "BLOQUEADO_MOTOR";
    else if (motivoFinal.toLowerCase().includes("freio")) mappedTipo = "BLOQUEADO_FREIO";
    else if (motivoFinal.toLowerCase().includes("mola") || motivoFinal.toLowerCase().includes("suspens")) mappedTipo = "BLOQUEADO_MOLA";
    else if (motivoFinal.toLowerCase().includes("câmbio") || motivoFinal.toLowerCase().includes("cambio") || motivoFinal.toLowerCase().includes("transmiss")) mappedTipo = "BLOQUEADO_CAMBIO";
    else if (motivoFinal.toLowerCase().includes("elétrica") || motivoFinal.toLowerCase().includes("eletrica") || motivoFinal.toLowerCase().includes("módulo") || motivoFinal.toLowerCase().includes("modulo")) mappedTipo = "BLOQUEADO_MODULO";
    else if (motivoFinal.toLowerCase().includes("sinistro")) mappedTipo = "BLOQUEADO_SINISTRO";

    // Função para executar a gravação física do registro na CI
    const executeSaveQuickCarro = async () => {
      if (category === 'BLOQUEADO' && !isEditing && ciListNaData.some(c => c.categoriaPlanilha === 'BLOQUEADO' && c.prefixo === cleanCar)) {
        toast.error('Este prefixo ja possui BLOQUEADO nesta CI. Edite o item existente.'); return;
      }
      try {
        localStorage.removeItem(`ci_data_zerada_${cleanData}`);
        localStorage.removeItem(`ci_folha_salva_${cleanData}`);
      } catch {}

      // Se estiver editando um veículo existente
      if (isEditing && existingId) {
        let found = false;
        const updatedList = ciList.map(item => {
          if (item.id === existingId || (existingId.startsWith("clone-") && item.prefixo === cleanCar)) {
            found = true;
            return {
              ...item,
              id: existingId.startsWith("clone-") ? `ci-${cleanData}-${Date.now()}-${cleanCar}` : item.id,
              data: cleanData,
              motivo: isC4 ? c4EditedText(quickAddMotivo, item.motivo) : motivoFinal,
              ...(category === 'BLOQUEADO' && c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? { dataBloqueio: quickAddDataBloqueio } : {}),
              tipo: mappedTipo,
              os: item.os,
              categoriaPlanilha: category,
              setorOficina: category === "OFICINA" ? (subType as any) : undefined,
              tipoPreventiva: category === "PREVENTIVA" ? (subType as any) : undefined,
              consorciada: category === "BLOQUEADO" ? (subType as any) : isC4 ? item.consorciada ?? null : (item.consorciada || autoConsorciada),
            };
          }
          return item;
        });

        if (found) {
          if (!(await commitCI(updatedList))) return;

          toast.success(`Carro ${cleanCar} atualizado com sucesso!`);
          setQuickAddModal(prev => ({ ...prev, isOpen: false }));
          return;
        }
      }

      // Novo registro na CI da folha desta data
      const recordId = `ci-${cleanData}-${Date.now()}-${cleanCar}-${Math.floor(Math.random() * 1000)}`;
      const newCI: BloqueioCarro = {
        id: recordId,
        prefixo: cleanCar,
        garagem: carroGaragemFisica,
        consorciada: category === "BLOQUEADO" ? (subType as any) : autoConsorciada,
        categoriaPlanilha: category,
        setorOficina: category === "OFICINA" ? (subType as any) : undefined,
        tipoPreventiva: category === "PREVENTIVA" ? (subType as any) : undefined,
        tipo: mappedTipo,
        motivo: isC4 ? c4EditedText(quickAddMotivo) : motivoFinal,
        data: cleanData,
        dataBloqueio: category === 'BLOQUEADO' ? quickAddDataBloqueio : undefined,
        hora: new Date().toLocaleTimeString("pt-BR", { timeZone: 'America/Campo_Grande', hour: "2-digit", minute: "2-digit" }),
        gravidade: "ALTA",
        responsavel: category === "OFICINA" ? `Oficina ${subType}` : (category === "PREVENTIVA" ? "Oficina Preventiva" : "Oficina Central"),
        os: undefined,
        status: "BLOQUEADO",
        ...(isC4 ? { ...c4KnownFields(), consorciada: category === 'BLOQUEADO' ? subType as BloqueioCarro['consorciada'] : null } : {})
      };

      // Garante que os demais carros herdados sejam congelados na folha desta data se for nova
      // Mantém o carro em outros setores da CI (coexistência confirmada pelo usuário no popup)
      const outrosCarrosDestaData = ciListNaData
        .filter(c => {
          // Se estava editando aquele registro específico, substitui apenas ele
          if (isEditing && existingId) {
            return c.id !== existingId && !(existingId.startsWith("clone-") && c.prefixo === cleanCar);
          }
          // Se estiver adicionando no mesmo setor/card exato, substitui o anterior daquele mesmo setor
          const mesmaCategoria = (c.categoriaPlanilha || "").toUpperCase() === category.toUpperCase();
          const mesmoSubTipo = category === "OFICINA" 
            ? isSetorMatch(c.setorOficina, subType)
            : category === "PREVENTIVA"
              ? isSetorMatch(c.tipoPreventiva, subType)
              : c.consorciada === subType;
          if (c.prefixo === cleanCar && mesmaCategoria && mesmoSubTipo) {
            return false;
          }
          // Mantém se for em setor ou card diferente (ex: Elevador e Mecânica ao mesmo tempo)
          return true;
        })
        .map(c => ({
          ...c,
          id: freezeCloneId(c.id, cleanData, c),
          data: cleanData,
        }));

      const outrosDias = ciList.filter(c => normalizeIsoDate(c.data) !== cleanData);
      const updatedList = [newCI, ...outrosCarrosDestaData, ...outrosDias];

      if (!(await commitCI(updatedList))) return;

      toast.success(`Carro ${cleanCar} inserido com sucesso em ${quickAddModal.title}!`);
      setQuickAddModal(prev => ({ ...prev, isOpen: false }));
    };

    // Se estiver adicionando (não editando o mesmo registro), verifica se já consta em outro local da CI na data
    if (!isEditing) {
      const existingLocations = findExistingCarLocations(cleanCar);
      if (existingLocations.length > 0) {
        setConflictModal({
          isOpen: true,
          carro: cleanCar,
          existingLocations,
          targetLocation: quickAddModal.title || `Setor ${subType}`,
          onConfirm: async () => {
            setConflictModal(prev => ({ ...prev, isOpen: false }));
            await executeSaveQuickCarro();
          }
        });
        return;
      }
    }

    await executeSaveQuickCarro();
  };

  const handleQuickRemove = async (carro: string, itemId?: string) => {
    if (checkDataFuturaBloqueio()) return;
    const targetDate = normalizeIsoDate(dataOperacao) || getTodayString();
    if (!confirm(`Deseja remover o Carro ${carro} da folha do dia ${formatarDataBr(targetDate)}?\n\n(Atenção: A folha do dia anterior e de outros dias permanecerão intactas).`)) return;

    try {
      localStorage.removeItem(`ci_folha_salva_${targetDate}`);
    } catch {}



    const outrosCarrosDestaData = ciListNaData
      .filter(c => {
        if (itemId) {
          return c.id !== itemId;
        }
        return !(c.prefixo === carro && c.categoriaPlanilha === 'BLOQUEADO');
      })
      .map(c => ({
        ...c,
        id: freezeCloneId(c.id, targetDate, c),
        data: targetDate,
      }));

    if (outrosCarrosDestaData.length === 0) {
      try { localStorage.setItem(`ci_data_zerada_${targetDate}`, "true"); } catch {}
    } else {
      try { localStorage.removeItem(`ci_data_zerada_${targetDate}`); } catch {}
    }

    const outrosDias = ciList.filter(c => normalizeIsoDate(c.data) !== targetDate);
    const updatedList = [...outrosCarrosDestaData, ...outrosDias];

    if (!(await commitCI(updatedList, ciListNaData.filter(c => c.categoriaPlanilha === 'BLOQUEADO' && c.status !== 'LIBERADO' && (itemId ? c.id === itemId : c.prefixo === carro)).map(c => c.prefixo)))) return;
    toast.info(`Carro ${carro} removido da folha de ${formatarDataBr(targetDate)}.`);
  };

  // Limpar todos os veículos de um card/bloco específico na folha da data atual
  const handleLimparCard = async (
    categoria: "PREVENTIVA" | "OFICINA" | "REFORCO" | "BLOQUEADO",
    nomeBloco: string
  ) => {
    if (checkDataFuturaBloqueio()) return;
    const targetDate = normalizeIsoDate(dataOperacao) || getTodayString();
    if (!confirm(`Deseja limpar todos os veículos de "${nomeBloco}" da folha do dia ${formatarDataBr(targetDate)}?\n\n(Atenção: A folha do dia anterior e de outros dias permanecerão intactas).`)) {
      return;
    }

    try {
      localStorage.removeItem(`ci_folha_salva_${targetDate}`);
    } catch {}

    if (categoria === "REFORCO") {
      const nextDrafts: Record<string, { prefixo: string; motivo: string; obs: string }> = {};
      FIXED_REFORCO_SLOTS.forEach(s => {
        nextDrafts[s.id] = { prefixo: "", motivo: "", obs: "" };
      });
      setReforcoDrafts(nextDrafts);
      try {
        localStorage.setItem(`reforco_drafts_${targetDate}`, JSON.stringify(nextDrafts));
      } catch {}

      // Congela os demais itens da data (Preventiva, Oficina, Bloqueado) caso ainda fossem clones
      const outrosItensDestaData = ciListNaData
        .filter(c => c.categoriaPlanilha !== "REFORCO" && !Boolean(c.horarioReforco))
        .map(c => ({
          ...c,
          id: freezeCloneId(c.id, targetDate, c),
          data: targetDate,
        }));

      if (outrosItensDestaData.length === 0) {
        try { localStorage.setItem(`ci_data_zerada_${targetDate}`, "true"); } catch {}
      } else {
        try { localStorage.removeItem(`ci_data_zerada_${targetDate}`); } catch {}
      }

      const outrosDias = ciList.filter(c => normalizeIsoDate(c.data) !== targetDate);
      const updatedList = [...outrosItensDestaData, ...outrosDias];
      if (!(await commitCI(updatedList))) return;
      toast.info(`Reforço com Horário da folha de ${formatarDataBr(targetDate)} foi limpo.`);
      return;
    }

    // Para PREVENTIVA, OFICINA ou BLOQUEADO
    const itensParaRemover = ciListNaData.filter(c => {
      const cat = (c.categoriaPlanilha || "").toUpperCase();
      if (categoria === "PREVENTIVA") return cat === "PREVENTIVA" || Boolean(c.tipoPreventiva);
      if (categoria === "OFICINA") return cat === "OFICINA" || Boolean(c.setorOficina);
      if (categoria === "BLOQUEADO") return cat === "BLOQUEADO" || (!c.categoriaPlanilha && !c.setorOficina && !c.tipoPreventiva && !c.horarioReforco);
      return false;
    });

    const itensRestantes = ciListNaData
      .filter(c => !itensParaRemover.some(r => r.id === c.id))
      .map(c => ({
        ...c,
        id: freezeCloneId(c.id, targetDate, c),
        data: targetDate,
      }));

    if (itensRestantes.length === 0) {
      try { localStorage.setItem(`ci_data_zerada_${targetDate}`, "true"); } catch {}
    } else {
      try { localStorage.removeItem(`ci_data_zerada_${targetDate}`); } catch {}
    }

    const outrosDias = ciList.filter(c => normalizeIsoDate(c.data) !== targetDate);
    const updatedList = [...itensRestantes, ...outrosDias];

    if (!(await commitCI(updatedList, itensParaRemover.filter(c => c.categoriaPlanilha === 'BLOQUEADO' && c.status !== 'LIBERADO').map(c => c.prefixo)))) return;
    toast.info(`${nomeBloco} da folha de ${formatarDataBr(targetDate)} limpo com sucesso.`);
  };

  // Liberar / Dar Baixa no Carro diretamente a partir da lista
  const handleReleaseCarro = async (carro: string, _itemId?: string) => {
    if (checkDataFuturaBloqueio()) return;
    const targetDateIso = normalizeIsoDate(dataOperacao) || getTodayString();
    if (!confirm(`Deseja dar BAIXA e LIBERAR o Carro ${carro} para soltura na data ${formatarDataBr(targetDateIso)}?\n\n(O veículo sairá dos bloqueados a partir desta data, mantendo o histórico dos dias anteriores intacto).`)) return;

    if (!ciListNaData.some(item => item.prefixo === carro && item.categoriaPlanilha === 'BLOQUEADO')) { toast.info('Não há BLOQUEADO desse veículo nesta CI.'); return; }
    const updatedList = ciList.filter(item => !(normalizeIsoDate(item.data) === targetDateIso && item.prefixo === carro && item.categoriaPlanilha === 'BLOQUEADO'));

    if (!(await commitCI(updatedList, [carro]))) return;

    toast.success(`Carro ${carro} liberado da CI com sucesso na data ${formatarDataBr(targetDateIso)}!`);
  };

  // Funções para Gerenciamento dos Slots Fixos de Reforço com Horário
  const getReforcoSlotData = (slotId: string, _horario?: string, defaultMotivo: string = "", _index?: number) => {
    const slotStorageId = `ci-reforco-${slotId}-${dataOperacao}`;
    const legacySlotStorageId = `ci-reforco-${slotId}`;

    // Identifica se é um dos 6 slots extras da coluna lateral de serviço (ex: INSPEÇÃO)
    const isExtra = slotId.startsWith("ref-extra-") || slotId.startsWith("slot_extra_");

    // 1. PRIORIDADE ABSOLUTA: Busca PRIMEIRO um registro que pertença especificamente a este slot único
    let item = ciListNaData.find(c => {
      if (c.status === "LIBERADO" || c.categoriaPlanilha !== "REFORCO") return false;
      // Pelo ID exato do slot na data atual
      if (c.id === slotStorageId || c.id === legacySlotStorageId) return true;
      // Pelo reforcoSlotId explícito
      if ((c as any).reforcoSlotId === slotId) return true;
      // Se for item clonado ou ID contendo o slotId (ex: ci-reforco-ref-4-... ou clone-...-ref-4-...)
      if (c.id && (c.id.includes(`-${slotId}-`) || c.id.endsWith(`-${slotId}`) || c.id.includes(`_${slotId}_`))) return true;
      return false;
    });

    // 2. FALLBACK SECUNDÁRIO: Se NÃO achou nenhum registro para este slot e NÃO for coluna extra
    if (!item && !isExtra && _horario && !c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')) {
      // Localiza registros que tenham o mesmo horário e NÃO pertençam a nenhum outro slot
      const candidatos = ciListNaData.filter(c => {
        if (c.status === "LIBERADO" || c.categoriaPlanilha !== "REFORCO") return false;
        if (c.horarioReforco !== _horario) return false;
        const cid = c.id;
        if (!cid) return true;
        const belongsToAnySlot = 
          FIXED_REFORCO_SLOTS.some(s => cid.includes(`-${s.id}-`) || cid.endsWith(`-${s.id}`)) ||
                  extraSlots.some(s => cid.includes(`-${s.id}-`) || cid.endsWith(`-${s.id}`));
        return !belongsToAnySlot;
      });

      // Mapeia 1-para-1 caso haja múltiplos slots no mesmo horário (ex: dois slots às 07:40 - A)
      const slotsComMesmoHorario = FIXED_REFORCO_SLOTS.filter(s => s.horario === _horario);
      const slotIndexNoHorario = slotsComMesmoHorario.findIndex(s => s.id === slotId);
      if (slotIndexNoHorario >= 0 && slotIndexNoHorario < candidatos.length) {
        item = candidatos[slotIndexNoHorario];
      }
    }

    const draft = !c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') || isDataEditavel ? reforcoDrafts[slotId] : undefined;

    // O prefixo vem do draft (se editado) ou do item salvo
    const prefixo = draft?.prefixo !== undefined ? draft.prefixo : (item ? item.prefixo : "");

    // O motivo vem do draft (se editado) ou do item salvo, ou defaultMotivo
    const motivo = draft?.motivo !== undefined 
      ? draft.motivo 
      : c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? item?.motivo ?? '' : (item?.motivo != null && item.motivo !== "" ? item.motivo : defaultMotivo);

    // A obs vem do draft (se editado) ou do item salvo
    const obs = draft?.obs !== undefined 
      ? draft.obs 
      : (item?.os !== undefined ? item.os : "");

    const isSaved = Boolean(item && item.prefixo && (c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') || item.motivo));
    const isDirty = draft !== undefined && (
      (draft.prefixo !== undefined && draft.prefixo !== (item?.prefixo || "")) ||
      (draft.motivo !== undefined && draft.motivo !== (item?.motivo || "")) ||
      (draft.obs !== undefined && draft.obs !== (item?.os || ""))
    );

    return {
      prefixo: prefixo || "",
      motivo: motivo || "",
      obs: obs || "",
      isSaved,
      isDirty,
      hasCar: Boolean(prefixo),
      savedItem: item
    };
  };

  const handleReforcoSlotDraftChange = (slotId: string, patch: { prefixo?: string; motivo?: string; obs?: string }) => {
    if (checkDataFuturaBloqueio()) return;
    setReforcoDrafts(prev => {
      const current = prev[slotId] || {};
      const nextSlot = { ...current, ...patch };
      const next = { ...prev, [slotId]: nextSlot };
      try {
        localStorage.setItem(`reforco_drafts_${dataOperacao}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleSaveReforcoSlot = async (slotId: string, horario: string) => {
    if (checkDataFuturaBloqueio()) return;
    const slotData = getReforcoSlotData(slotId, horario);
    const cleanPrefixo = (slotData.prefixo || "").trim();
    const cleanMotivo = (slotData.motivo || "").trim();
    const cleanObs = (slotData.obs || "").trim();
    const slotStorageId = `ci-reforco-${slotId}-${dataOperacao}`;
    const legacySlotStorageId = `ci-reforco-${slotId}`;

    // Se o usuário limpou o carro e clicou no botão para desvincular um horário que já estava salvo
    if (!cleanPrefixo || cleanPrefixo === "—") {
      if (slotData.isSaved) {

        const updatedList = ciList.filter(c => 
          c.id !== slotStorageId && 
          c.id !== legacySlotStorageId && 
          (c as any).reforcoSlotId !== slotId &&
          !(c.id && (c.id.includes(`-${slotId}-`) || c.id.endsWith(`-${slotId}`)))
        );
        if (!(await commitCI(updatedList))) return;
        setReforcoDrafts(prev => {
          const next = { ...prev };
          delete next[slotId];
          try {
            localStorage.setItem(`reforco_drafts_${dataOperacao}`, JSON.stringify(next));
          } catch {}
          return next;
        });
        toast.info(`Carro desvinculado do horário ${horario}.`);
        return;
      }
      toast.error(`Por favor, selecione um carro para o horário ${horario}.`);
      return;
    }

    // Validação solicitada pelo usuário: só salva se adicionar motivo e prefixo (obs opcional)
    if (!cleanMotivo && !c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')) {
      toast.error(`Por favor, selecione um motivo para o horário ${horario}.`);
      return;
    }

    const carroGaragemFisica = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? (activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') : fleetCars.find(c => c.prefixo === cleanPrefixo)?.garagem || getGaragemFisicaByCarro(cleanPrefixo);
    const autoConsorciada = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem?.consorciada ?? null : ciListNaData.find(i => i.prefixo === cleanPrefixo)?.consorciada || getConsorciadaByCarro(cleanPrefixo);

    const newReforcoItem: BloqueioCarro & { reforcoSlotId?: string } = {
      ...(c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem : {}),
      id: c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem?.id || slotStorageId : slotStorageId,
      prefixo: cleanPrefixo,
      garagem: carroGaragemFisica,
      consorciada: autoConsorciada,
      categoriaPlanilha: "REFORCO",
      horarioReforco: c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && slotData.savedItem ? slotData.savedItem.horarioReforco ?? null : slotData.savedItem?.horarioReforco ?? horario,
      reforcoSlotId: slotId,
      tipo: "REFORCO_REVISAO",
      motivo: cleanMotivo,
      data: normalizeIsoDate(dataOperacao) || getTodayString(),
      hora: new Date().toLocaleTimeString("pt-BR", { timeZone: 'America/Campo_Grande', hour: "2-digit", minute: "2-digit" }),
      gravidade: "ALTA",
      responsavel: "Pista / Reforço",
      os: cleanObs || undefined,
      status: "BLOQUEADO",
      ...(c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? { ...c4KnownFields(slotData.savedItem), motivo: c4EditedText(slotData.motivo, slotData.savedItem?.motivo), os: c4EditedText(slotData.obs, slotData.savedItem?.os) } : {})
    };

    // Executa a gravação do slot sem remover o carro de outros setores (coexistência)
    const executeSaveReforco = async () => {
      // Remove apenas registro anterior deste mesmo slot, sem apagar o carro de outros locais da CI
      const cleanList = ciList.filter(c => 
        c.id !== slotStorageId && 
        c.id !== legacySlotStorageId && 
        (c as any).reforcoSlotId !== slotId &&
        !(c.id && (c.id.includes(`-${slotId}-`) || c.id.endsWith(`-${slotId}`)))
      );
      const updatedList = [newReforcoItem, ...cleanList];

      if (!(await commitCI(updatedList))) return;

      // Limpa o draft deste slot, pois agora o item está salvo oficialmente na CI
      setReforcoDrafts(prev => {
        const next = { ...prev };
        delete next[slotId];
        try {
          localStorage.setItem(`reforco_drafts_${dataOperacao}`, JSON.stringify(next));
        } catch {}
        return next;
      });

      toast.success(`Horário ${horario} salvo com sucesso! Carro: ${cleanPrefixo}`);
    };

    // Checa se o veículo já está em outro local da CI na data consultada
    const existing = findExistingCarLocations(cleanPrefixo, undefined, slotId);
    if (existing.length > 0) {
      setConflictModal({
        isOpen: true,
        carro: cleanPrefixo,
        existingLocations: existing,
        targetLocation: `Reforço com Horário (${horario})`,
        onConfirm: async () => {
          setConflictModal(prev => ({ ...prev, isOpen: false }));
          await executeSaveReforco();
        }
      });
      return;
    }

    await executeSaveReforco();
  };

  // Salva ou remove um veículo do slot extra de serviço (Card 3)
  const handleSaveReforcoExtraSlot = async (slotId: string) => {
    if (checkDataFuturaBloqueio()) return;
    const slotData = getReforcoSlotData(slotId, reforcoServicoTipo);
    const cleanPrefixo = (slotData.prefixo || "").trim();
    const slotStorageId = `ci-reforco-${slotId}-${dataOperacao}`;
    const legacySlotStorageId = `ci-reforco-${slotId}`;

    // Se o usuário limpou o carro e clicou no botão para desvincular um veículo que já estava salvo
    if (!cleanPrefixo || cleanPrefixo === "—") {
      if (slotData.isSaved) {

        const updatedList = ciList.filter(c => 
          c.id !== slotStorageId && 
          c.id !== legacySlotStorageId && 
          (c as any).reforcoSlotId !== slotId &&
          !(c.id && (c.id.includes(`-${slotId}-`) || c.id.endsWith(`-${slotId}`)))
        );
        if (!(await commitCI(updatedList))) return;
        setReforcoDrafts(prev => {
          const next = { ...prev };
          delete next[slotId];
          try {
            localStorage.setItem(`reforco_drafts_${dataOperacao}`, JSON.stringify(next));
          } catch {}
          return next;
        });
        toast.info(`Carro desvinculado de ${reforcoServicoTipo}.`);
        return;
      }
      toast.error(`Por favor, selecione um carro para a linha de ${reforcoServicoTipo}.`);
      return;
    }

    const carroGaragemFisica = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? (activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') : fleetCars.find(c => c.prefixo === cleanPrefixo)?.garagem || getGaragemFisicaByCarro(cleanPrefixo);
    const autoConsorciada = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem?.consorciada ?? null : ciListNaData.find(i => i.prefixo === cleanPrefixo)?.consorciada || getConsorciadaByCarro(cleanPrefixo);

    const newReforcoItem: BloqueioCarro & { reforcoSlotId?: string } = {
      ...(c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem : {}),
      id: c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem?.id || slotStorageId : slotStorageId,
      prefixo: cleanPrefixo,
      garagem: carroGaragemFisica,
      consorciada: autoConsorciada,
      categoriaPlanilha: "REFORCO",
      horarioReforco: c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.savedItem?.horarioReforco : reforcoServicoTipo,
      reforcoSlotId: slotId,
      tipo: "REFORCO_REVISAO",
      motivo: reforcoServicoTipo,
      data: normalizeIsoDate(dataOperacao) || getTodayString(),
      hora: new Date().toLocaleTimeString("pt-BR", { timeZone: 'America/Campo_Grande', hour: "2-digit", minute: "2-digit" }),
      gravidade: "ALTA",
      responsavel: "Pista / Reforço",
      os: c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? slotData.obs : reforcoServicoTipo,
      status: "BLOQUEADO",
      ...(c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? { ...c4KnownFields(slotData.savedItem), motivo: slotData.savedItem?.motivo ?? null, os: c4EditedText(slotData.obs, slotData.savedItem?.os) } : {})
    };

    const executeSaveExtra = async () => {
      const cleanList = ciList.filter(c => 
        c.id !== slotStorageId && 
        c.id !== legacySlotStorageId && 
        (c as any).reforcoSlotId !== slotId &&
        !(c.id && (c.id.includes(`-${slotId}-`) || c.id.endsWith(`-${slotId}`)))
      );
      const updatedList = [newReforcoItem, ...cleanList];

      if (!(await commitCI(updatedList))) return;

      setReforcoDrafts(prev => {
        const next = { ...prev };
        delete next[slotId];
        try {
          localStorage.setItem(`reforco_drafts_${dataOperacao}`, JSON.stringify(next));
        } catch {}
        return next;
      });

      toast.success(`Carro ${cleanPrefixo} salvo com sucesso em ${reforcoServicoTipo}!`);
    };

    const existing = findExistingCarLocations(cleanPrefixo, undefined, slotId);
    if (existing.length > 0) {
      setConflictModal({
        isOpen: true,
        carro: cleanPrefixo,
        existingLocations: existing,
        targetLocation: `Reforço (${reforcoServicoTipo})`,
        onConfirm: async () => {
          setConflictModal(prev => ({ ...prev, isOpen: false }));
          await executeSaveExtra();
        }
      });
      return;
    }

    await executeSaveExtra();
  };

  // Salva todos os veículos preenchidos da coluna de serviço extra (Card 3)
  const handleSaveAllReforcoExtraSlots = async () => {
    if (checkDataFuturaBloqueio()) return;
    let next = ciList;
    const changed: string[] = [];
    const scope = activeGaragemScope === 'VCM' ? 'VCM' : 'VCG';
    for (const slot of extraSlots) {
      const draft = getReforcoSlotData(slot.id, reforcoServicoTipo);
      const prefixo = draft.prefixo.trim();
      if (!prefixo || prefixo === '—' || (draft.isSaved && !draft.isDirty)) continue;
      if (!c4Enabled(scope) && getGaragemFisicaByCarro(prefixo) !== 'VCG') { toast.error('MVP permite alteracoes somente na VCG.'); return; }
      const id = 'ci-reforco-' + slot.id + '-' + dataOperacao;
      next = next.filter(c => !(normalizeIsoDate(c.data) === normalizeIsoDate(dataOperacao) && (c.id === id || c.id === draft.savedItem?.id)));
      next = [...next, { ...(c4Enabled(scope) ? draft.savedItem : {}), id: c4Enabled(scope) ? draft.savedItem?.id || id : id, prefixo, garagem: scope, consorciada: c4Enabled(scope) ? draft.savedItem?.consorciada ?? null : ciListNaData.find(i => i.prefixo === prefixo)?.consorciada || getConsorciadaByCarro(prefixo), categoriaPlanilha: 'REFORCO',
        horarioReforco: c4Enabled(scope) ? draft.savedItem?.horarioReforco : reforcoServicoTipo, tipo: 'REFORCO_REVISAO', motivo: reforcoServicoTipo,
        data: normalizeIsoDate(dataOperacao), responsavel: 'Pista / Reforço', os: draft.obs, status: 'BLOQUEADO',
        ...(c4Enabled(scope) ? { ...c4KnownFields(draft.savedItem), motivo: draft.savedItem?.motivo ?? null, os: c4EditedText(draft.obs, draft.savedItem?.os) } : {}) }];
      changed.push(slot.id);
    }
    if (!changed.length) { toast.info('Nenhuma alteração pendente nesta coluna.'); return; }
    if (!confirm('Salvar todas as alterações da coluna? Os outros setores serão preservados.')) return;
    if (!(await commitCI(next))) return;
    setReforcoDrafts(prev => {
      const remaining = { ...prev }; changed.forEach(id => delete remaining[id]);
      try { localStorage.setItem('reforco_drafts_' + dataOperacao, JSON.stringify(remaining)); } catch {}
      return remaining;
    });
    toast.success('Coluna salva com sucesso.');
  };

  // Mapa rápido de carros com registro de CI ativo na data selecionada
  // Mapa rápido de carros com registro de CI ativo na data selecionada
  const activeCiMap = useMemo(() => {
    const map = new Map<string, BloqueioCarro>();
    ciListNaData.forEach(item => {
      if (item.status !== "LIBERADO") {
        map.set(item.prefixo, item);
      }
    });
    return map;
  }, [ciListNaData]);

  // Estatísticas Rápidas baseadas na frota e nos itens da CI na data selecionada
  const stats = useMemo(() => {
    const totalFrota = allowedCars.length || 1;

    // Filtra os itens ativos na data respeitando o escopo de garagem selecionado
    const activeItems = ciListNaData.filter(c => {
      if (c.status === "LIBERADO") return false;
      if (activeGaragemScope !== "TODAS") {
        const g = c.garagem || getGaragemFisicaByCarro(c.prefixo);
        if (g !== activeGaragemScope) return false;
      }
      return true;
    });

    const preventivasCount = activeItems.filter(c => 
      c.categoriaPlanilha === "PREVENTIVA" || Boolean(c.tipoPreventiva)
    ).length;

    const oficinasCount = activeItems.filter(c => 
      c.categoriaPlanilha === "OFICINA" || Boolean(c.setorOficina)
    ).length;

    const reforcosCount = activeItems.filter(c => 
      c.categoriaPlanilha === "REFORCO" || Boolean(c.horarioReforco)
    ).length;

    const bloqueadosCount = activeItems.filter(c => 
      c.categoriaPlanilha === "BLOQUEADO" || (!c.categoriaPlanilha && !c.setorOficina && !c.tipoPreventiva && !c.horarioReforco)
    ).length;

    // Veículos físicos distintos retidos na CI da garagem (para cálculo de aptos da frota)
    const distinctCarrosNaCI = new Set(activeItems.map(c => c.prefixo));
    const totalNaCI = distinctCarrosNaCI.size;

    // Em Execução: Oficinas + Preventivas
    const emExecucao = oficinasCount + preventivasCount;
    // Aptos para pista: frota total menos retidos na CI
    const aptos = Math.max(0, totalFrota - totalNaCI);

    const pctBloqueados = Math.round((totalNaCI / totalFrota) * 100);
    const pctEmExecucao = Math.round((emExecucao / totalFrota) * 100);
    const pctLiberados = Math.round((aptos / totalFrota) * 100);

    return { 
      totalFrota: allowedCars.length, 
      totalNaCI, 
      bloqueados: bloqueadosCount, 
      bloqueadosCount,
      preventivasCount, 
      oficinasCount, 
      reforcosCount, 
      emExecucao,
      aptos,
      pctBloqueados,
      pctEmExecucao,
      pctLiberados
    };
  }, [allowedCars, ciListNaData, activeGaragemScope]);

  // Ao clicar em um carro nos cards: abrir modal rápido de edição (Print 03)
  const handleCarClick = (carro: string, itemId?: number | string) => {
    const existingCI = itemId
      ? ciListNaData.find(c => c.id === itemId && c.status !== "LIBERADO")
      : (activeCiMap.get(carro) || ciListNaData.find(c => c.prefixo === carro && c.status !== "LIBERADO"));
    
    if (!existingCI) {
      openQuickAddModal("OFICINA", "MECANICA", "Adicionar à Oficina", SETORES_OFICINA[0]?.chips || []);
      setQuickAddCarro(carro);
      return;
    }

    const cat = existingCI.categoriaPlanilha || (existingCI.tipoPreventiva ? "PREVENTIVA" : existingCI.setorOficina ? "OFICINA" : "BLOQUEADO");
    let subType = "";
    let title = "";
    let chips: readonly string[] | string[] = [];

    if (cat === "PREVENTIVA") {
      subType = existingCI.tipoPreventiva || "REVISAO_GERAL";
      title = `Editar Preventiva • Carro ${carro}`;
      chips = [];
    } else if (cat === "OFICINA") {
      subType = existingCI.setorOficina || "MECANICA";
      const setorInfo = SETORES_OFICINA.find(s => s.id === subType);
      title = `Editar Setor ${setorInfo?.label || subType} • Carro ${carro}`;
      chips = setorInfo?.chips || [];
    } else {
      subType = c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? existingCI.consorciada ?? '' : existingCI.consorciada || getConsorciadaByCarro(carro);
      title = `Editar Bloqueado ${subType} • Carro ${carro}`;
      chips = [...BLOQUEIOS_MOTIVOS_RAPIDOS];
    }

    setQuickAddModal({
      isOpen: true,
      category: cat as any,
      subType,
      title,
      chips,
      isEditing: true,
      existingId: existingCI.id,
    });
    setQuickAddCarro(carro);
    const motivoAtual = existingCI.motivo || "";
    const isChipExistente = chips.some(c => c.toLowerCase() === motivoAtual.toLowerCase());
    setIsOutroMotivo(Boolean(motivoAtual && !isChipExistente));
    setQuickAddMotivo(motivoAtual);
    setQuickAddDataBloqueio(existingCI.dataBloqueio || operationalContext().today);
    setQuickAddFilterCompany(existingCI.consorciada || "TODAS");
    setQuickAddSelectorOpen(false);
  };

  // Liberar Carro da CI diretamente a partir do Quick Modal
  const handleReleaseQuickCarro = async () => {
    if (checkDataFuturaBloqueio()) return;
    if (!quickAddCarro) return;

    const targetDateIso = normalizeIsoDate(dataOperacao) || getTodayString();

    if (!ciListNaData.some(item => item.prefixo === quickAddCarro && item.categoriaPlanilha === 'BLOQUEADO')) { toast.info('Não há BLOQUEADO desse veículo nesta CI.'); return; }
    const updatedList = ciList.filter(item => !(normalizeIsoDate(item.data) === targetDateIso && item.prefixo === quickAddCarro && item.categoriaPlanilha === 'BLOQUEADO'));

    if (!(await commitCI(updatedList, [quickAddCarro]))) return;

    toast.success(`Carro ${quickAddCarro} liberado da CI com sucesso na data ${formatarDataBr(targetDateIso)}. Estado de oficina preservado.`);
    setQuickAddModal(prev => ({ ...prev, isOpen: false }));
  };

  // Excluir CI do Carro diretamente a partir do Quick Modal
  const handleDeleteQuickCarro = async () => {
    if (checkDataFuturaBloqueio()) return;
    if (!quickAddCarro) return;
    const targetDate = normalizeIsoDate(dataOperacao) || getTodayString();
    if (!confirm(`Deseja remover o Carro ${quickAddCarro} da folha do dia ${formatarDataBr(targetDate)}?\n\n(Atenção: A folha do dia anterior e de outros dias permanecerão intactas).`)) return;

    try {
      localStorage.removeItem(`ci_folha_salva_${targetDate}`);
    } catch {}



    const outrosCarrosDestaData = ciListNaData
      .filter(c => {
        if (quickAddModal.existingId) {
          return c.id !== quickAddModal.existingId;
        }
        return !(c.prefixo === quickAddCarro && c.categoriaPlanilha === 'BLOQUEADO');
      })
      .map(c => ({
        ...c,
        id: freezeCloneId(c.id, targetDate, c),
        data: targetDate,
      }));

    if (outrosCarrosDestaData.length === 0) {
      try { localStorage.setItem(`ci_data_zerada_${targetDate}`, "true"); } catch {}
    } else {
      try { localStorage.removeItem(`ci_data_zerada_${targetDate}`); } catch {}
    }

    const outrosDias = ciList.filter(c => normalizeIsoDate(c.data) !== targetDate);
    const updatedList = [...outrosCarrosDestaData, ...outrosDias];

    if (!(await commitCI(updatedList, ciListNaData.filter(c => c.categoriaPlanilha === 'BLOQUEADO' && c.status !== 'LIBERADO' && (quickAddModal.existingId ? c.id === quickAddModal.existingId : c.prefixo === quickAddCarro)).map(c => c.prefixo)))) return;
    toast.info(`Carro ${quickAddCarro} removido da folha de ${formatarDataBr(targetDate)}.`);
    setQuickAddModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {(fleetSource === "local" || fleetSource === "mock" || fleetSource === "unavailable" || fleetSource === "unknown") && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {fleetSource === "mock"
              ? "A lista de veículos inclui dados simulados do SQL Server legado; confirme a frota antes de utilizá-la operacionalmente."
              : fleetSource === "unavailable"
                ? "A integração com o SQL Server legado está indisponível. A tela está usando a lista local padrão, que pode não refletir a frota atual."
                : fleetSource === "unknown"
                  ? "A origem da lista de veículos não foi informada pelo servidor. Confirme os dados antes de utilizá-los operacionalmente."
                  : "A tela está usando a lista local padrão de veículos, que pode não refletir a frota atual."}
          </p>
        </div>
      )}
      
      {/* ==========================================================
          1. HEADER PRINCIPAL (MESMO PADRÃO DO CONTROLE DE FROTA)
          ========================================================== */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Controle de CI & Bloqueios da Frota
          </h1>
        </div>

        {/* Botões em formato de Pílula (Pill Buttons) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Garagem Exclusivo para Administrador Geral (sem garagem física vinculada) */}
          {isAdmin && !userGaragemFixa && (
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-full border text-xs mr-1">
              <span className="text-[10px] font-bold text-muted-foreground px-2 uppercase font-mono">Filtro:</span>
              {(["TODAS", "VCG", "VCM"] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setAdminGaragemFiltro(g)}
                  className={cn(
                    "px-2.5 py-1 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer",
                    adminGaragemFiltro === g
                      ? "bg-background text-foreground shadow-xs border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {g === "TODAS" ? "Todas" : g === "VCM" ? "Garagem 1 (VCM)" : "Garagem 2 (VCG)"}
                </button>
              ))}
            </div>
          )}

          {/* Seletor de Data Completa em Pílula (Idêntico ao do Controle de Frota) */}
          <div 
            onClick={() => {
              try {
                dateInputRef.current?.showPicker();
              } catch {
                dateInputRef.current?.focus();
              }
            }}
            className="relative inline-flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-2xs hover:bg-gray-100 dark:hover:bg-slate-800/80 transition-colors group shrink-0 cursor-pointer h-9"
            title="Clique para escolher uma data no calendário"
          >
            <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0 group-hover:text-emerald-600 transition-colors pointer-events-none" />
            <span className="text-xs font-mono font-bold text-gray-900 dark:text-white pointer-events-none select-none">
              {formattedData}
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={dataOperacao}
              onChange={(e) => {
                if (e.target.value) setDataOperacao(e.target.value);
              }}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch {}
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              title="Clique para escolher uma data no calendário"
              aria-label="Escolher data no calendário"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDataOperacao(getTodayString());
              }}
              className="relative z-20 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline px-1 border-l border-gray-200 dark:border-slate-700 pl-2 cursor-pointer"
              title="Voltar para a data de hoje"
            >
              Hoje
            </button>
          </div>

          <Button
            onClick={() => setModalRelatorioOpen(true)}
            variant="outline"
            size="sm"
            className="rounded-full px-5 py-2 h-9 border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0E1420] text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 shadow-xs font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-gray-500" />
            Visualizar Relatório
          </Button>

          <Button onClick={handlePrepareTomorrow} disabled={!ready || writeState.pending || writeState.refreshRequired || !(c4Enabled('VCG') ? canEditC4 : isAdmin) || !c4OperationalContext(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG').open || activeGaragemScope === 'VCM'} variant="outline" size="sm">Verificar preparação de amanhã</Button>
          <Button
            onClick={handleRefreshData}
            variant="ghost"
            size="sm"
            className="rounded-full px-3 py-2 h-9 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            title="Sincronizar com banco de dados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {writeState.pending && <p role="status">Salvando. Aguarde antes de outra operacao.</p>}
      {writeState.refreshRequired && <p role="alert">Atualize os dados oficiais antes de continuar.</p>}
      {!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && <p className="text-sm">Copia automatica indisponivel no legado: CI vazia nao comprova primeira preparacao. Inclusoes e retiradas devem ser explicitas.</p>}
      {c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && <p role="status" className="text-sm">Folha: {c4Folha(normalizeIsoDate(dataOperacao), activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')?.status === 'FINALIZADA' ? 'Finalizada' : c4Folha(normalizeIsoDate(dataOperacao), activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')?.status === 'EM_PREPARACAO' ? 'Em preparação' : 'Não preparada'}</p>}
      {!isDataEditavel && <p role="status" className="rounded-2xl border border-slate-300 bg-slate-100 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">Somente leitura. Alterações requerem ADMIN ou manutencao VCG autorizada, contexto explícito e folha em preparação, entre 03:00 e {c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') ? '20:00' : '18:30'} em America/Campo_Grande.</p>}
      {/* PRANCHETA DIGITAL (LAYOUT PRINT 01 & PRINT 02) */}
      {/* ========================================================= */}
      <div className="space-y-6">
        
        {/* BANNER INFORMATIVO PARA FOLHA FECHADA (DATAS <= HOJE) */}
        {isFolhaFechada && (
          <div className="bg-slate-100 dark:bg-slate-800/60 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 shrink-0 text-slate-600 dark:text-slate-400 mt-0.5" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Folha Fechada • {formattedData}
                  </h4>
                  <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Somente Leitura
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  A CI desta data já foi encerrada. Conforme regra operacional, alterações de veículos só são permitidas na folha de amanhã (<strong>{formatarDataBr(getTomorrowString())}</strong>).
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setDataOperacao(getTomorrowString())}
              className="shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Ir para Folha de Amanhã
            </Button>
          </div>
        )}

        {/* BANNER INFORMATIVO PARA DATAS BLOQUEADAS (A PARTIR DE DEPOIS DE AMANHÃ) */}
        {isDataFutura && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-800 dark:text-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  Edição Antecipada Bloqueada ({formattedData})
                </h4>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/90 leading-relaxed">
                  O planejamento antecipado da CI é permitido exclusivamente para a folha de amanhã (<strong>{formatarDataBr(getTomorrowString())}</strong>). Folhas a partir de depois de amanhã ainda não estão liberadas.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setDataOperacao(getTomorrowString())}
              className="shrink-0 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Ir para Folha de Amanhã
            </Button>
          </div>
        )}

        {/* ========================================================= */}
        {/* BLOCO 1: PREVENTIVAS (5 Cards em formato de prancheta) */}
        {/* ========================================================= */}
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-foreground">
                1. Preventivas
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {stats.preventivasCount} lançamentos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isDataEditavel}
                onClick={() => handleLimparCard("PREVENTIVA", "1. Preventivas")}
                className={cn(
                  "h-7 px-2.5 text-[11px] text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-full gap-1 cursor-pointer",
                  !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title="Limpar todos os veículos de Preventivas desta folha"
              >
                <Eraser className="w-3.5 h-3.5 text-rose-500" />
                <span>Limpar Preventivas</span>
              </Button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                {isDataEditavel ? (
                  <>Clique em <strong className="text-emerald-600 dark:text-emerald-400">+</strong> em cada card para adicionar</>
                ) : (
                  <span className="text-slate-500 font-semibold">Modo Somente Leitura</span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PREVENTIVAS_CARDS.map(card => {
              const items = ciListNaData.filter(c => 
                c.status !== "LIBERADO" && 
                (c.categoriaPlanilha === "PREVENTIVA" || (!c.categoriaPlanilha && Boolean(c.tipoPreventiva))) && 
                isSetorMatch(c.tipoPreventiva, card.id)
              ).sort((a, b) => (a.prefixo || "").localeCompare(b.prefixo || "", undefined, { numeric: true }));
              return (
                <div key={card.id} className="bg-muted/20 border border-border/80 rounded-xl p-3 flex flex-col justify-between min-h-[140px] hover:border-emerald-500/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="font-bold text-xs tracking-tight text-foreground">{card.label}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!isDataEditavel}
                        onClick={() => openQuickAddModal("PREVENTIVA", card.id, card.label)}
                        className={cn(
                          "h-6 w-6 p-0 rounded-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 cursor-pointer",
                          !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                        )}
                        title={isDataEditavel ? `Adicionar veículo em ${card.label}` : "Folha fechada para edição"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {items.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground/60 italic py-2 block">Nenhum veículo</span>
                      ) : (
                        items.map(item => (
                          <div
                            key={item.id || item.prefixo}
                            className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold shadow-2xs hover:bg-emerald-500/25 transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => handleCarClick(item.prefixo, item.id)}
                              className="hover:underline cursor-pointer"
                              title="Clique para ver detalhes"
                            >
                              {item.prefixo}
                            </button>
                            {isDataEditavel && (
                              <button
                                type="button"
                                onClick={() => handleQuickRemove(item.prefixo, item.id)}
                                className="opacity-60 hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 rounded cursor-pointer"
                                title="Remover veículo"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                    <span>Lançados:</span>
                    <strong className="text-foreground">{items.length} {items.length === 1 ? "carro" : "carros"}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCO 2: SETORES DA OFICINA (8 Cards do Print 01 e Print 02) */}
        {/* ========================================================= */}
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-foreground">
                2. Setores da Oficina
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {stats.oficinasCount} veículos em oficina
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isDataEditavel}
                onClick={() => handleLimparCard("OFICINA", "2. Setores da Oficina")}
                className={cn(
                  "h-7 px-2.5 text-[11px] text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-full gap-1 cursor-pointer",
                  !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title="Limpar todos os veículos de Oficina desta folha"
              >
                <Eraser className="w-3 h-3 text-rose-500" />
                <span>Limpar Oficina</span>
              </Button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                {isDataEditavel ? (
                  "Cada card lista o prefixo e o motivo/defeito registrado"
                ) : (
                  <span className="text-slate-500 font-semibold">Modo Somente Leitura</span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {SETORES_OFICINA.map(setor => {
              const items = ciListNaData.filter(c => 
                c.status !== "LIBERADO" && 
                (c.categoriaPlanilha === "OFICINA" || (!c.categoriaPlanilha && Boolean(c.setorOficina))) && 
                isSetorMatch(c.setorOficina, setor.id)
              ).sort((a, b) => (a.prefixo || "").localeCompare(b.prefixo || "", undefined, { numeric: true }));
              return (
                <div key={setor.id} className="bg-muted/20 border border-border/80 rounded-xl p-2.5 flex flex-col justify-between min-h-[170px] hover:border-emerald-500/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="font-bold text-[11px] uppercase tracking-tight text-foreground truncate max-w-[80%]" title={setor.label}>
                        {setor.label}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!isDataEditavel}
                        onClick={() => openQuickAddModal("OFICINA", setor.id, `Setor ${setor.label}`, setor.chips)}
                        className={cn(
                          "h-5 w-5 p-0 rounded-full border-emerald-500/40 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:text-emerald-400 cursor-pointer",
                          !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                        )}
                        title={isDataEditavel ? `Adicionar veículo em ${setor.label}` : "Folha fechada para edição"}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="pt-2 space-y-1">
                      {items.length === 0 ? (
                        <span className="text-[10px] text-muted-foreground/60 italic block py-2 text-center">—</span>
                      ) : (
                        items.map(item => (
                          <div
                            key={item.id || item.prefixo}
                            className="px-2 py-1 rounded-lg bg-background border border-border/70 text-xs shadow-2xs hover:border-emerald-500/40 transition-all flex items-center justify-between gap-1 group min-w-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleCarClick(item.prefixo, item.id)}
                              className="font-mono font-bold text-xs text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer truncate text-left flex-1 min-w-0"
                              title={`${item.prefixo}${item.motivo ? ` - ${item.motivo}` : ""}`}
                            >
                              <span>{item.prefixo}</span>
                              {item.motivo && (
                                <span className="font-sans font-medium text-[11px] text-muted-foreground ml-0.5">
                                  -{item.motivo}
                                </span>
                              )}
                            </button>
                            {isDataEditavel && (
                              <button
                                type="button"
                                onClick={() => handleQuickRemove(item.prefixo, item.id)}
                                className="text-muted-foreground hover:text-rose-500 p-0.5 transition-colors cursor-pointer shrink-0"
                                title="Remover"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[9px] text-muted-foreground font-mono text-center">
                    {items.length} {items.length === 1 ? "veículo" : "veículos"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCO 3: REFORÇO COM HORÁRIO (2 Tabelas com Horários Fixos) */}
        {/* ========================================================= */}
        <div className="bg-card border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-foreground">
                  3. Reforço com Horário
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Horários fixos oficiais da prancheta. Selecione o prefixo e informe motivo/observação em cada linha.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isDataEditavel}
                onClick={() => handleLimparCard("REFORCO", "3. Reforço com Horário")}
                className={cn(
                  "h-7 px-2.5 text-[11px] text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-full gap-1 cursor-pointer",
                  !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title="Limpar todos os horários e veículos do Reforço desta folha"
              >
                <Eraser className="w-3 h-3 text-rose-500" />
                <span>Limpar Reforço</span>
              </Button>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                12 Horários Fixos
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Tabela Coluna 1 (Slots 0 a 5) */}
            <div className="lg:col-span-5 border rounded-xl overflow-hidden bg-background">
              <div className="bg-muted/50 px-2.5 py-2 border-b text-[11px] font-bold grid grid-cols-12 gap-1.5 sm:gap-2 text-muted-foreground uppercase font-mono items-center">
                <span className="col-span-2">Horário</span>
                <span className="col-span-3">Motivo</span>
                <span className="col-span-3">Prefixo</span>
                <span className="col-span-3">Obs</span>
                <span className="col-span-1 text-center">Salvar</span>
              </div>
              <div className="divide-y divide-border/60">
                {FIXED_REFORCO_SLOTS.slice(0, 6).map((slot, idx) => {
                  const slotData = getReforcoSlotData(slot.id, slot.horario, slot.defaultMotivo, idx);
                  return (
                    <div key={slot.id} className="p-2 grid grid-cols-12 gap-1.5 sm:gap-2 items-center text-xs hover:bg-muted/20 transition-colors">
                      {/* Horário Fixo */}
                      <div className="col-span-2 font-mono font-bold text-xs flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap text-[11px]">
                          {slotData.savedItem?.horarioReforco || slot.horario}
                        </span>
                      </div>

                      {/* Motivo */}
                      <div className="col-span-3">
                        <select
                          value={slotData.motivo}
                          disabled={!isDataEditavel}
                          onChange={(e) => handleReforcoSlotDraftChange(slot.id, { motivo: e.target.value })}
                          className={cn(
                            "w-full h-8 px-1.5 sm:px-2 rounded-md border bg-background text-[11px] font-medium focus:outline-hidden",
                            !isDataEditavel && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <option value="">—</option>
                          <option value="LUBRIFICAÇÃO">LUBRIFICAÇÃO</option>
                          <option value="TROCA DE ÓLEO">TROCA DE ÓLEO</option>
                          <option value="INSPEÇÃO">INSPEÇÃO</option>
                          <option value="REVISÃO">REVISÃO</option>
                          <option value="PREVENTIVA">PREVENTIVA</option>
                          {slotData.motivo && !["LUBRIFICAÇÃO", "TROCA DE ÓLEO", "INSPEÇÃO", "REVISÃO", "PREVENTIVA"].includes(slotData.motivo) && (
                            <option value={slotData.motivo}>{slotData.motivo}</option>
                          )}
                        </select>
                      </div>

                      {/* Prefixo (Select com Busca de Carros da Garagem) */}
                      <div className="col-span-3">
                        <CarSearchSelect
                          value={slotData.prefixo}
                          disabled={!isDataEditavel}
                          onChange={(novoPrefixo) => handleReforcoSlotDraftChange(slot.id, { prefixo: novoPrefixo })}
                          allowedCars={sortedAllowedCars}
                          placeholder="Carro"
                        />
                      </div>

                      {/* Obs (Opcional) */}
                      <div className="col-span-3">
                        <Input
                          value={slotData.obs}
                          disabled={!isDataEditavel}
                          placeholder="Ex: POSTO .M"
                          onChange={(e) => handleReforcoSlotDraftChange(slot.id, { obs: e.target.value })}
                          className={cn("h-8 text-[11px] bg-background", !isDataEditavel && "opacity-50 cursor-not-allowed")}
                        />
                      </div>

                      {/* Botão Redondo com Ícone de Certo */}
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isDataEditavel}
                          onClick={() => handleSaveReforcoSlot(slot.id, slot.horario)}
                          className={cn(
                            "h-7 w-7 p-0 rounded-full cursor-pointer transition-all duration-150 shrink-0",
                            slotData.isSaved && !slotData.isDirty
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                              : (slotData.prefixo && slotData.motivo)
                              ? "border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white bg-emerald-500/10 shadow-2xs"
                              : "border-border/80 text-muted-foreground/50 hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/10",
                            !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                          title={
                            !isDataEditavel
                              ? "Folha fechada para edição"
                              : slotData.isSaved && !slotData.isDirty
                              ? "Salvo na CI. Clique para atualizar se alterar algo."
                              : "Salvar horário na CI (Requer Motivo e Prefixo)"
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabela Coluna 2 (Slots 6 a 11) */}
            <div className="lg:col-span-5 border rounded-xl overflow-hidden bg-background">
              <div className="bg-muted/50 px-2.5 py-2 border-b text-[11px] font-bold grid grid-cols-12 gap-1.5 sm:gap-2 text-muted-foreground uppercase font-mono items-center">
                <span className="col-span-2">Horário</span>
                <span className="col-span-3">Motivo</span>
                <span className="col-span-3">Prefixo</span>
                <span className="col-span-3">Obs</span>
                <span className="col-span-1 text-center">Salvar</span>
              </div>
              <div className="divide-y divide-border/60">
                {FIXED_REFORCO_SLOTS.slice(6, 12).map((slot, idx) => {
                  const slotData = getReforcoSlotData(slot.id, slot.horario, slot.defaultMotivo, idx + 6);
                  return (
                    <div key={slot.id} className="p-2 grid grid-cols-12 gap-1.5 sm:gap-2 items-center text-xs hover:bg-muted/20 transition-colors">
                      {/* Horário Fixo */}
                      <div className="col-span-2 font-mono font-bold text-xs flex items-center">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap text-[11px]">
                          {slotData.savedItem?.horarioReforco || slot.horario}
                        </span>
                      </div>

                      {/* Motivo */}
                      <div className="col-span-3">
                        <select
                          value={slotData.motivo}
                          disabled={!isDataEditavel}
                          onChange={(e) => handleReforcoSlotDraftChange(slot.id, { motivo: e.target.value })}
                          className={cn(
                            "w-full h-8 px-1.5 sm:px-2 rounded-md border bg-background text-[11px] font-medium focus:outline-hidden",
                            !isDataEditavel && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <option value="">—</option>
                          <option value="LUBRIFICAÇÃO">LUBRIFICAÇÃO</option>
                          <option value="TROCA DE ÓLEO">TROCA DE ÓLEO</option>
                          <option value="INSPEÇÃO">INSPEÇÃO</option>
                          <option value="REVISÃO">REVISÃO</option>
                          <option value="PREVENTIVA">PREVENTIVA</option>
                          {slotData.motivo && !["LUBRIFICAÇÃO", "TROCA DE ÓLEO", "INSPEÇÃO", "REVISÃO", "PREVENTIVA"].includes(slotData.motivo) && (
                            <option value={slotData.motivo}>{slotData.motivo}</option>
                          )}
                        </select>
                      </div>

                      {/* Prefixo (Select com Busca de Carros da Garagem) */}
                      <div className="col-span-3">
                        <CarSearchSelect
                          value={slotData.prefixo}
                          disabled={!isDataEditavel}
                          onChange={(novoPrefixo) => handleReforcoSlotDraftChange(slot.id, { prefixo: novoPrefixo })}
                          allowedCars={sortedAllowedCars}
                          placeholder="Carro"
                        />
                      </div>

                      {/* Obs (Opcional - Idêntico à Coluna 1) */}
                      <div className="col-span-3">
                        <Input
                          value={slotData.obs}
                          disabled={!isDataEditavel}
                          placeholder="Ex: POSTO .M"
                          onChange={(e) => handleReforcoSlotDraftChange(slot.id, { obs: e.target.value })}
                          className={cn("h-8 text-[11px] bg-background", !isDataEditavel && "opacity-50 cursor-not-allowed")}
                        />
                      </div>

                      {/* Botão Redondo com Ícone de Certo */}
                      <div className="col-span-1 flex items-center justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isDataEditavel}
                          onClick={() => handleSaveReforcoSlot(slot.id, slot.horario)}
                          className={cn(
                            "h-7 w-7 p-0 rounded-full cursor-pointer transition-all duration-150 shrink-0",
                            slotData.isSaved && !slotData.isDirty
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                              : (slotData.prefixo && slotData.motivo)
                              ? "border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white bg-emerald-500/10 shadow-2xs"
                              : "border-border/80 text-muted-foreground/50 hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/10",
                            !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                          title={
                            !isDataEditavel
                              ? "Folha fechada para edição"
                              : slotData.isSaved && !slotData.isDirty
                              ? "Salvo na CI. Clique para atualizar se alterar algo."
                              : "Salvar horário na CI (Requer Motivo e Prefixo)"
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabela Coluna 3: Card Especial de Serviço (Título com Select + SALVAR no topo e 6 linhas com CarSearchSelect) */}
            <div className="lg:col-span-2 border rounded-xl overflow-hidden bg-background">
              <div className="bg-muted/50 px-2.5 py-2 border-b text-[11px] font-bold flex items-center justify-between text-muted-foreground uppercase font-mono">
                <div className="flex-1 mr-2">
                  <select
                    value={reforcoServicoTipo}
                    disabled={!isDataEditavel}
                    onChange={(e) => handleReforcoServicoTipoChange(e.target.value)}
                    className={cn(
                      "w-full h-7 px-1.5 rounded-md border border-border bg-background text-[11px] font-bold text-foreground uppercase focus:outline-hidden cursor-pointer",
                      !isDataEditavel && "opacity-50 cursor-not-allowed"
                    )}
                    title="Selecione o serviço para esta coluna"
                  >
                    {reforcoServicoTipo === '' && <option value="" disabled>TÍTULO NÃO DEFINIDO</option>}
                    <option value="INSPEÇÃO">INSPEÇÃO</option>
                    <option value="LUBRIFICAÇÃO">LUBRIFICAÇÃO</option>
                    <option value="EM MANUTENÇÃO">EM MANUTENÇÃO</option>
                    <option value="TROCA DE ÓLEO">TROCA DE ÓLEO</option>
                    <option value="REVISÃO">REVISÃO</option>
                    <option value="PREVENTIVA">PREVENTIVA</option>
                  </select>
                </div>
                {c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && <button type="button" disabled={!isDataEditavel} className="text-[10px] font-bold mr-2" onClick={() => setExtraDraftOrders(previous => [...previous, Math.max(...extraSlots.map(s => Number(s.id.split('-').slice(-1)[0]))) + 1])}>+ POSIÇÃO</button>}
                <button
                  type="button"
                  disabled={!isDataEditavel}
                  onClick={handleSaveAllReforcoExtraSlots}
                  className={cn(
                    "text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 uppercase tracking-wider shrink-0 cursor-pointer",
                    !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                  )}
                  title={isDataEditavel ? "Salvar todos os veículos desta coluna" : "Folha fechada para edição"}
                >
                  SALVAR
                </button>
              </div>
              <div className="divide-y divide-border/60">
                {extraSlots.map((slot) => {
                  const extraData = getReforcoSlotData(slot.id, reforcoServicoTipo);
                  return (
                    <div key={slot.id} className="p-2 flex items-center gap-2 text-xs hover:bg-muted/20 transition-colors">
                      {/* Prefixo (Select com Busca de Carros da Garagem) */}
                      <div className="flex-1">
                        <CarSearchSelect
                          value={extraData.prefixo}
                          disabled={!isDataEditavel}
                          onChange={(novoCarro) => handleReforcoSlotDraftChange(slot.id, { prefixo: novoCarro })}
                          allowedCars={sortedAllowedCars}
                          placeholder="Carro"
                        />
                      </div>

                      {/* Botão Redondo com Ícone de Certo */}
                      <div className="shrink-0 flex items-center justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isDataEditavel}
                          onClick={() => handleSaveReforcoExtraSlot(slot.id)}
                          className={cn(
                            "h-7 w-7 p-0 rounded-full cursor-pointer transition-all duration-150 shrink-0",
                            extraData.isSaved && !extraData.isDirty
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs"
                              : extraData.prefixo
                              ? "border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white bg-emerald-500/10 shadow-2xs"
                              : "border-border/80 text-muted-foreground/50 hover:border-emerald-500/50 hover:text-emerald-600 hover:bg-emerald-500/10",
                            !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                          )}
                          title={
                            !isDataEditavel
                              ? "Folha fechada para edição"
                              : extraData.isSaved && !extraData.isDirty
                              ? `Salvo em ${reforcoServicoTipo}. Clique para atualizar.`
                              : `Salvar veículo em ${reforcoServicoTipo}`
                          }
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================= */}
        {/* BLOCO 4: BLOQUEADOS POR CONSORCIADA (Grid 2x2 com bordas vermelhas do Print 01) */}
        {/* ========================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase text-foreground">
                4. Bloqueados por Consorciada
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                {stats.bloqueadosCount} veículos bloqueados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isDataEditavel}
                onClick={() => handleLimparCard("BLOQUEADO", "4. Bloqueados por Consorciada")}
                className={cn(
                  "h-7 px-2.5 text-[11px] text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-full gap-1 cursor-pointer",
                  !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                )}
                title="Limpar todos os veículos Bloqueados desta folha"
              >
                <Eraser className="w-3 h-3 text-rose-500" />
                <span>Limpar Bloqueados</span>
              </Button>
              <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                {isDataEditavel ? (
                  <>VSF, VCG, JTU e VCM • Clique em <strong>Lançar Bloqueio</strong> para registrar</>
                ) : (
                  <span className="text-slate-500 font-semibold">Modo Somente Leitura</span>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CONSORCIADAS_BLOQUEIOS.filter(cons => {
              if (activeGaragemScope === "VCM") return cons.id === "VCM";
              if (activeGaragemScope === "VCG") return c4Enabled('VCG') || cons.id !== "VCM";
              return true;
            }).map(cons => {
              const items = ciListNaData.filter(c => 
                c.status !== "LIBERADO" && 
                (c.categoriaPlanilha === "BLOQUEADO" || (!c.categoriaPlanilha && !c.setorOficina && !c.tipoPreventiva && !c.horarioReforco)) && 
                (c.consorciada === cons.id || (!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && !c.consorciada && (c.prefixo || "").trim().startsWith(cons.prefixDigit))) &&
                (activeGaragemScope === "TODAS" || (c.garagem || getGaragemFisicaByCarro(c.prefixo)) === activeGaragemScope)
              ).sort((a, b) => (a.prefixo || "").localeCompare(b.prefixo || "", undefined, { numeric: true }));

              return (
                <div 
                  key={cons.id} 
                  className="border-2 border-rose-400/80 dark:border-rose-800/80 bg-rose-50/25 dark:bg-rose-950/15 rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-rose-300/60 dark:border-rose-900/60">
                      <div>
                        <h3 className="font-bold text-sm text-rose-800 dark:text-rose-300 tracking-tight uppercase">
                          {cons.label}
                        </h3>
                        <p className="text-[10px] text-muted-foreground">{cons.subtitle}</p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={!isDataEditavel}
                        onClick={() => openQuickAddModal("BLOQUEADO", cons.id, cons.label, BLOQUEIOS_MOTIVOS_RAPIDOS)}
                        className={cn(
                          "h-7 text-xs gap-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer",
                          !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                        )}
                        title={isDataEditavel ? `Lançar bloqueio em ${cons.label}` : "Folha fechada para edição"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Lançar Bloqueio
                      </Button>
                    </div>

                    <div className="pt-2">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-rose-300/40 dark:border-rose-900/40 text-[10px] uppercase font-bold text-muted-foreground">
                            <th className="py-1 px-1.5 w-20">Prefixo</th>
                            <th className="py-1 px-1.5">Motivo</th>
                            <th className="py-1 px-1.5 w-24">Data Bloq.</th>
                            <th className="py-1 px-1.5 w-12 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-200/50 dark:divide-rose-900/40 font-mono text-xs">
                          {items.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-5 text-center text-[11px] text-muted-foreground/60 italic font-sans">
                                Nenhum veículo bloqueado nesta consorciada
                              </td>
                            </tr>
                          ) : (
                            items.map(item => (
                              <tr key={item.id || item.prefixo} className="hover:bg-rose-500/5 transition-colors">
                                <td className="py-1.5 px-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCarClick(item.prefixo, item.id)}
                                    className="font-bold font-mono text-foreground hover:text-rose-600 hover:underline cursor-pointer"
                                    title="Ver detalhes do veículo"
                                  >
                                    {item.prefixo}
                                  </button>
                                </td>
                                <td className="py-1.5 px-1.5 font-sans text-[11px] text-foreground font-medium">
                                  {item.motivo}
                                </td>
                                <td className="py-1.5 px-1.5 text-[10px] text-muted-foreground font-mono">
                                  {formatarDataBr(item.data || dataOperacao)}
                                </td>
                                <td className="py-1.5 px-1.5 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex items-center justify-center p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-rose-500/15 transition-colors cursor-pointer"
                                        title="Opções do veículo"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 z-50">
                                      <DropdownMenuItem
                                        onClick={() => handleCarClick(item.prefixo, item.id)}
                                        className="cursor-pointer gap-2 text-xs"
                                      >
                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span>{isDataEditavel ? "Editar" : "Ver Detalhes"}</span>
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        disabled={!isDataEditavel}
                                        onClick={() => handleReleaseCarro(item.prefixo, item.id)}
                                        className={cn(
                                          "cursor-pointer gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/40",
                                          !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                                        )}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Liberar (Baixa)</span>
                                      </DropdownMenuItem>

                                      {(isAdmin || (c4Enabled('VCG') && canEditC4)) && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            disabled={!isDataEditavel}
                                            onClick={() => handleQuickRemove(item.prefixo, item.id)}
                                            className={cn(
                                              "cursor-pointer gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40",
                                              !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                                            )}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Apagar</span>
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-rose-300/40 dark:border-rose-900/40 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                    <span>Total na consorciada:</span>
                    <strong className="text-rose-700 dark:text-rose-300">{items.length} {items.length === 1 ? "veículo" : "veículos"}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL OFICIAL: VISUALIZAR RELATÓRIO CI MANUTENÇÃO */}
      {/* Segue estritamente o layout do formulário CGU.REG.MT0005 */}
      {/* ========================================================= */}
      <Dialog open={modalRelatorioOpen} onOpenChange={setModalRelatorioOpen}>
        <DialogContent className="max-w-5xl w-[98vw] max-h-[96vh] flex flex-col p-0 rounded-3xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 print:hidden shadow-2xl">
          
          {/* Header com Ações: Título, Data, Imprimir e Baixar PDF */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-[#0E1420] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                CI - Solicitação de veículos
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Código: <span className="font-mono font-bold text-gray-900 dark:text-white">CGU.REG.MT0005</span> • Relatório Oficial da Manutenção
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={handlePrintRelatorio}
                size="sm"
                className="rounded-full px-4 py-1.5 h-8 text-xs font-bold bg-[#164E3A] hover:bg-[#113C2D] text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Imprimir folha de relatório formatada ou Salvar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Área de Visualização com Scroll (Fundo Cinza e Folha A4 Branca com Proporção Real) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 flex justify-center">
            
            {/* Folha A4 Física Realista */}
            <div 
              ref={relatorioFolhaRef}
              data-folha-ci="true"
              className="bg-white text-black font-sans shadow-2xl flex flex-col justify-between"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "5mm 8mm",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
            >
              <div className="space-y-1">
                
                {/* 1. CABEÇALHO OFICIAL COM LOGO E METADADOS */}
                <div className="border border-black">
                  <div className="flex items-center justify-between px-3 py-1 border-b border-black">
                    <div className="w-[160px] flex items-center">
                      <LogoConsorcioSvg className="h-7 max-w-[125px] object-contain logo-consorcio-print" />
                    </div>
                    <div className="flex-1 text-center pr-10">
                      <h1 className="text-base font-black tracking-wide uppercase text-black">
                        CI - Solicitação de veículos
                      </h1>
                    </div>
                  </div>

                  {/* Metadados: Data da Criação, Revisão Nº, Data da Revisão, Data da Informação, Número */}
                  <table data-tabela-metadados="true" className="w-full border-collapse text-center text-[8.5px] leading-tight">
                    <tbody>
                      <tr className="bg-[#f2f2f2] font-bold uppercase text-black divide-x divide-black border-b border-black">
                        <td className="py-0.5 w-[20%]">Data da Criação</td>
                        <td className="py-0.5 w-[15%]">REVISÃO Nº</td>
                        <td className="py-0.5 w-[20%]">DATA DA REVISÃO</td>
                        <td className="py-0.5 w-[25%]">DATA DA INFORMAÇÃO</td>
                        <td className="py-0.5 w-[20%]">Número</td>
                      </tr>
                      <tr className="font-bold divide-x divide-black text-[9px]">
                        <td className="py-0.5 font-mono">10/10/2024</td>
                        <td className="py-0.5 font-mono">1</td>
                        <td className="py-0.5 font-mono">09/10/2025</td>
                        <td className="py-0.5 font-mono font-bold text-[8px] uppercase">{dataInformacaoFormatada}</td>
                        <td className="py-0.5 font-mono">CGU.REG.MT0005</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. TABELA: PREVENTIVAS */}
                <table className="w-full border-collapse border border-black text-[9px] leading-tight">
                  <thead>
                    <tr>
                      <th colSpan={5} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[10px] uppercase tracking-wide text-black">
                        Preventivas
                      </th>
                    </tr>
                    <tr className="bg-[#f2f2f2] text-center font-bold text-[8.5px] uppercase text-black">
                      <th className="border border-black py-0.5 w-[20%]">Preventiva</th>
                      <th className="border border-black py-0.5 w-[20%]">Lubrificação</th>
                      <th className="border border-black py-0.5 w-[20%]">Troca de óleo</th>
                      <th className="border border-black py-0.5 w-[20%]">REVISÃO GERAL</th>
                      <th className="border border-black py-0.5 w-[20%]">SISEP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: relatorioData.numLinhasPreventivas }).map((_, rIdx) => {
                      const prevList = relatorioData.preventivas.filter(c => c.tipoPreventiva === "PREVENTIVA");
                      const lubList = relatorioData.preventivas.filter(c => c.tipoPreventiva === "LUBRIFICACAO");
                      const oleoList = relatorioData.preventivas.filter(c => c.tipoPreventiva === "TROCA_OLEO");
                      const geralList = relatorioData.preventivas.filter(c => c.tipoPreventiva === "REVISAO_GERAL");
                      const sisepList = relatorioData.preventivas.filter(c => c.tipoPreventiva === "SISEP");

                      const lubItem1 = lubList[rIdx * 2];
                      const lubItem2 = lubList[rIdx * 2 + 1];

                      return (
                        <tr key={rIdx} className="text-center font-mono font-bold text-[9px] h-[18px]">
                          <td className="border border-black py-0.5 px-1 leading-normal align-middle">{prevList[rIdx]?.prefixo || "\u00A0"}</td>
                          <td className="border border-black py-0.5 px-1 leading-normal align-middle">
                            <div className="flex justify-around items-center">
                              <span>{lubItem1?.prefixo || "\u00A0"}</span>
                              <span>{lubItem2?.prefixo || "\u00A0"}</span>
                            </div>
                          </td>
                          <td className="border border-black py-0.5 px-1 leading-normal align-middle">{oleoList[rIdx]?.prefixo || "\u00A0"}</td>
                          <td className="border border-black py-0.5 px-1 leading-normal align-middle">{geralList[rIdx]?.prefixo || "\u00A0"}</td>
                          <td className="border border-black py-0.5 px-1 leading-normal align-middle">{sisepList[rIdx]?.prefixo || "\u00A0"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 3. TABELA: SETORES DA OFICINA (8 SETORES COM SUBCOLUNAS) */}
                <table className="w-full border-collapse border border-black text-[8.5px] leading-tight">
                  <thead>
                    <tr className="bg-[#e6e6e6] text-center font-bold text-[9px] uppercase text-black">
                      <th colSpan={2} className="border border-black py-0.5">Mecânica</th>
                      <th className="border border-black py-0.5">Elevador</th>
                      <th colSpan={2} className="border border-black py-0.5">Elétrica</th>
                      <th className="border border-black py-0.5">Borracharia</th>
                      <th colSpan={2} className="border border-black py-0.5">Funilaria / Pintura</th>
                      <th className="border border-black py-0.5">Tacógrafo</th>
                      <th colSpan={2} className="border border-black py-0.5">Bilhetagem</th>
                      <th className="border border-black py-0.5">Limpeza</th>
                    </tr>
                    <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                      <th className="border border-black py-0.5 w-[5%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[11%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[6%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[5%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[11%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[6%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[5%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[11%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[6%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[5%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[11%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[6%]">PREFIXO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: relatorioData.numLinhasOficina }).map((_, rIdx) => {
                      const mec = relatorioData.oficina.filter(c => c.setorOficina === "MECANICA")[rIdx];
                      const elev = relatorioData.oficina.filter(c => c.setorOficina === "ELEVADOR")[rIdx];
                      const elet = relatorioData.oficina.filter(c => c.setorOficina === "ELETRICA")[rIdx];
                      const borr = relatorioData.oficina.filter(c => c.setorOficina === "BORRACHARIA")[rIdx];
                      const fun = relatorioData.oficina.filter(c => c.setorOficina === "FUNILARIA")[rIdx];
                      const tac = relatorioData.oficina.filter(c => c.setorOficina === "TACOGRAFO")[rIdx];
                      const bilh = relatorioData.oficina.filter(c => c.setorOficina === "BILHETAGEM")[rIdx];
                      const limp = relatorioData.oficina.filter(c => c.setorOficina === "LIMPEZA")[rIdx];

                      return (
                        <tr key={rIdx} className="text-[8px] h-[17px]">
                          {/* Mecânica */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{mec?.prefixo || "\u00A0"}</td>
                          <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7px] truncate max-w-[80px] leading-normal align-middle">{mec?.motivo || "\u00A0"}</td>

                          {/* Elevador */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{elev?.prefixo || "\u00A0"}</td>

                          {/* Elétrica */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{elet?.prefixo || "\u00A0"}</td>
                          <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7px] truncate max-w-[80px] leading-normal align-middle">{elet?.motivo || "\u00A0"}</td>

                          {/* Borracharia */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{borr?.prefixo || "\u00A0"}</td>

                          {/* Funilaria / Pintura */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{fun?.prefixo || "\u00A0"}</td>
                          <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7px] truncate max-w-[80px] leading-normal align-middle">{fun?.motivo || "\u00A0"}</td>

                          {/* Tacógrafo */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{tac?.prefixo || "\u00A0"}</td>

                          {/* Bilhetagem */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{bilh?.prefixo || "\u00A0"}</td>
                          <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7px] truncate max-w-[80px] leading-normal align-middle">{bilh?.motivo || "\u00A0"}</td>

                          {/* Limpeza */}
                          <td className="border border-black text-center font-mono font-bold py-0.5 px-0.5 leading-normal align-middle">{limp?.prefixo || "\u00A0"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* 4. TABELA: REFORÇO COM HORÁRIO */}
                <table className="w-full border-collapse border border-black text-[8.5px] leading-tight">
                  <thead>
                    <tr>
                      <th colSpan={9} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[9.5px] uppercase tracking-wide text-black">
                        Reforço com horário
                      </th>
                    </tr>
                    <tr className="bg-[#f2f2f2] text-center font-bold text-[8px] uppercase text-black">
                      {/* Lado Esquerdo */}
                      <th className="border border-black py-0.5 w-[10%]">HORÁRIO</th>
                      <th className="border border-black py-0.5 w-[15%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[10%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[10%]">OBS</th>
                      {/* Lado Direito */}
                      <th className="border border-black py-0.5 w-[10%]">HORÁRIO</th>
                      <th className="border border-black py-0.5 w-[15%]">MOTIVO</th>
                      <th className="border border-black py-0.5 w-[10%]">PREFIXO</th>
                      <th className="border border-black py-0.5 w-[10%]">OBS</th>
                      {/* Coluna Extra de Serviço */}
                      <th className="border border-black py-0.5 w-[10%]">{reforcoServicoTipo.toUpperCase()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(6, extraSlots.length) }).map((_, rIdx) => {
                      const slotEsq = FIXED_REFORCO_SLOTS[rIdx];
                      const slotDir = FIXED_REFORCO_SLOTS[rIdx + 6];
                      const slotExtra = extraSlots[rIdx];
                      const dataEsq = getReforcoSlotData(slotEsq?.id || '', slotEsq?.horario || '', "", rIdx);
                      const dataDir = getReforcoSlotData(slotDir?.id || '', slotDir?.horario || '', "", rIdx + 6);
                      const dataExtra = getReforcoSlotData(slotExtra.id, reforcoServicoTipo);

                      return (
                        <tr key={rIdx} className="text-[8px] text-center h-[17.5px]">
                          {/* Lado Esquerdo */}
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataEsq.savedItem?.horarioReforco || slotEsq?.horario}</td>
                          <td className="border border-black uppercase font-semibold text-[7.5px] py-0.5 leading-normal align-middle">{dataEsq.motivo || "\u00A0"}</td>
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataEsq.prefixo || "\u00A0"}</td>
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataEsq.obs || "\u00A0"}</td>

                          {/* Lado Direito */}
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataDir.savedItem?.horarioReforco || slotDir?.horario}</td>
                          <td className="border border-black uppercase font-semibold text-[7.5px] py-0.5 leading-normal align-middle">{dataDir.motivo || "\u00A0"}</td>
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataDir.prefixo || "\u00A0"}</td>
                          <td className="border border-black font-mono font-bold text-[7.5px] py-0.5 leading-normal align-middle">{dataDir.obs || "\u00A0"}</td>

                          {/* Coluna Especial Extra */}
                          <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">{dataExtra.prefixo || "\u00A0"}</td>
                        </tr>
                      );
                    })}

                    {/* Linha Extra: 8 Repetições de PREFIXO / MOTIVO + 1 célula vazia */}
                    <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                      <th className="border border-black py-0.5">PREFIXO</th>
                      <th className="border border-black py-0.5">MOTIVO</th>
                      <th className="border border-black py-0.5">PREFIXO</th>
                      <th className="border border-black py-0.5">MOTIVO</th>
                      <th className="border border-black py-0.5">PREFIXO</th>
                      <th className="border border-black py-0.5">MOTIVO</th>
                      <th className="border border-black py-0.5">PREFIXO</th>
                      <th className="border border-black py-0.5">MOTIVO</th>
                      <th className="border border-black py-0.5">&nbsp;</th>
                    </tr>
                    <tr className="text-[8px] text-center h-[17.5px]">
                      <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black py-0.5 leading-normal align-middle">&nbsp;</td>
                      <td className="border border-black font-mono font-bold py-0.5 leading-normal align-middle">&nbsp;</td>
                    </tr>
                  </tbody>
                </table>

                {/* 5. TABELA: BLOQUEADOS POR CONSORCIADA (GRID 2x2: VSF, VCG, JTU, VCM) */}
                <div className="space-y-1">
                  
                  {/* Linha Superior: BLOQUEADOS VSF e BLOQUEADOS VCG (11 linhas cada) */}
                  <div style={{ display: "flex", gap: "4px", width: "100%" }}>
                    {/* VSF */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <table className="w-full border-collapse border border-black text-[8px] leading-tight">
                        <thead>
                          <tr>
                            <th colSpan={3} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[8.5px] uppercase tracking-wide text-black">
                              BLOQUEADOS VSF
                            </th>
                          </tr>
                          <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                            <th className="border border-black py-0.5 w-[20%]">PREFIXO</th>
                            <th className="border border-black py-0.5 w-[55%]">MOTIVO</th>
                            <th className="border border-black py-0.5 w-[25%]">DATA BLOQUEIO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: relatorioData.numLinhasBloqSuperiores }).map((_, idx) => {
                            const item = relatorioData.bloqVSF[idx];
                            return (
                              <tr key={idx} className="text-[7.5px] h-[16.5px]">
                                <td className="border border-black text-center font-mono font-bold py-0.5 px-1 leading-normal align-middle">{item?.prefixo || "\u00A0"}</td>
                                <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7.5px] truncate max-w-[130px] leading-normal align-middle">{item?.motivo || "\u00A0"}</td>
                                <td className="border border-black text-center font-mono py-0.5 px-1 text-[7.5px] leading-normal align-middle">{formatDataBloqueio(item?.dataBloqueio || item?.data) || "\u00A0"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* VCG */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <table className="w-full border-collapse border border-black text-[8px] leading-tight">
                        <thead>
                          <tr>
                            <th colSpan={3} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[8.5px] uppercase tracking-wide text-black">
                              BLOQUEADOS VCG
                            </th>
                          </tr>
                          <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                            <th className="border border-black py-0.5 w-[20%]">PREFIXO</th>
                            <th className="border border-black py-0.5 w-[55%]">MOTIVO</th>
                            <th className="border border-black py-0.5 w-[25%]">DATA BLOQUEIO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: relatorioData.numLinhasBloqSuperiores }).map((_, idx) => {
                            const item = relatorioData.bloqVCG[idx];
                            return (
                              <tr key={idx} className="text-[7.5px] h-[16.5px]">
                                <td className="border border-black text-center font-mono font-bold py-0.5 px-1 leading-normal align-middle">{item?.prefixo || "\u00A0"}</td>
                                <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7.5px] truncate max-w-[130px] leading-normal align-middle">{item?.motivo || "\u00A0"}</td>
                                <td className="border border-black text-center font-mono py-0.5 px-1 text-[7.5px] leading-normal align-middle">{formatDataBloqueio(item?.dataBloqueio || item?.data) || "\u00A0"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Linha Inferior: BLOQUEADOS JTU e BLOQUEADOS VCM (8 linhas cada) */}
                  <div style={{ display: "flex", gap: "4px", width: "100%" }}>
                    {/* JTU */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <table className="w-full border-collapse border border-black text-[8px] leading-tight">
                        <thead>
                          <tr>
                            <th colSpan={3} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[8.5px] uppercase tracking-wide text-black">
                              BLOQUEADOS JTU
                            </th>
                          </tr>
                          <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                            <th className="border border-black py-0.5 w-[20%]">PREFIXO</th>
                            <th className="border border-black py-0.5 w-[55%]">MOTIVO</th>
                            <th className="border border-black py-0.5 w-[25%]">DATA BLOQUEIO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: relatorioData.numLinhasBloqInferiores }).map((_, idx) => {
                            const item = relatorioData.bloqJTU[idx];
                            return (
                              <tr key={idx} className="text-[7.5px] h-[16.5px]">
                                <td className="border border-black text-center font-mono font-bold py-0.5 px-1 leading-normal align-middle">{item?.prefixo || "\u00A0"}</td>
                                <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7.5px] truncate max-w-[130px] leading-normal align-middle">{item?.motivo || "\u00A0"}</td>
                                <td className="border border-black text-center font-mono py-0.5 px-1 text-[7.5px] leading-normal align-middle">{formatDataBloqueio(item?.dataBloqueio || item?.data) || "\u00A0"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* VCM */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <table className="w-full border-collapse border border-black text-[8px] leading-tight">
                        <thead>
                          <tr>
                            <th colSpan={3} className="bg-[#e6e6e6] border border-black py-0.5 text-center font-bold text-[8.5px] uppercase tracking-wide text-black">
                              BLOQUEADOS VCM
                            </th>
                          </tr>
                          <tr className="bg-[#f2f2f2] text-center font-bold text-[7.5px] uppercase text-black">
                            <th className="border border-black py-0.5 w-[20%]">PREFIXO</th>
                            <th className="border border-black py-0.5 w-[55%]">MOTIVO</th>
                            <th className="border border-black py-0.5 w-[25%]">DATA BLOQUEIO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: relatorioData.numLinhasBloqInferiores }).map((_, idx) => {
                            const item = relatorioData.bloqVCM[idx];
                            return (
                              <tr key={idx} className="text-[7.5px] h-[16.5px]">
                                <td className="border border-black text-center font-mono font-bold py-0.5 px-1 leading-normal align-middle">{item?.prefixo || "\u00A0"}</td>
                                <td className="border border-black text-left py-0.5 px-1 uppercase font-semibold text-[7.5px] truncate max-w-[130px] leading-normal align-middle">{item?.motivo || "\u00A0"}</td>
                                <td className="border border-black text-center font-mono py-0.5 px-1 text-[7.5px] leading-normal align-middle">{formatDataBloqueio(item?.dataBloqueio || item?.data) || "\u00A0"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* 6. ASSINATURA NO RODAPÉ */}
                <div className="pt-1.5 flex items-center justify-start text-[9.5px] font-bold">
                  <span>Manutenção: _____________________________________</span>
                </div>

              </div>
            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* ========================================================= */}



      {/* MODAL RÁPIDO DO BOTÃO '+' DOS CARDS (PRINT 01 E 02) */}
      {/* ========================================================= */}
      <Dialog 
        open={quickAddModal.isOpen} 
        onOpenChange={(open) => setQuickAddModal(prev => ({ ...prev, isOpen: open }))}
      >
        <DialogContent className="max-w-md sm:max-w-lg print:hidden">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              {quickAddModal.isEditing ? (
                <Wrench className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Plus className="w-5 h-5 text-primary" />
              )}
              <span>{quickAddModal.title || (quickAddModal.isEditing ? `Editar Carro ${quickAddCarro}` : "Adicionar Veículo na CI")}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {quickAddModal.isEditing
                ? "Atualize os dados da solicitação ou dê baixa/libere o veículo da CI."
                : "Selecione o veículo da garagem ativa e informe os detalhes da solicitação."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmQuickAdd} className="space-y-3.5 pt-1">
            {quickAddModal.category === 'BLOQUEADO' && c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && <label className="block text-xs font-semibold">Data original do bloqueio<Input type="date" value={quickAddDataBloqueio} max={operationalContext().today} onChange={e => setQuickAddDataBloqueio(e.target.value)} disabled={!isDataEditavel} required /></label>}
            {/* Banner de Modo Somente Leitura se a folha estiver fechada */}
            {!isDataEditavel && (
              <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-xs">
                <Lock className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />
                <span>
                  <strong>Folha Fechada • {formattedData}:</strong> Esta CI já foi encerrada. O registro está em modo somente leitura e não permite alterações.
                </span>
              </div>
            )}

            {/* Campo de Seleção / Busca Moderna de Veículos (Padrão Controle de Frota) */}
            <div className="relative" ref={quickAddCarSelectorRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-gray-500" />
                  Prefixo do Carro <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400">
                  {quickAddModal.isEditing ? (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {isDataEditavel ? "Em Edição" : "Visualização"}
                    </span>
                  ) : (
                    `${sortedAllowedCars.length} veículos da Garagem ${activeGaragemScope === "TODAS" ? "VCG/VCM" : activeGaragemScope}`
                  )}
                </span>
              </div>

              {/* Input customizado com Botão Dropdown */}
              <div className="relative">
                <Input
                  value={quickAddCarro}
                  disabled={quickAddModal.isEditing || !isDataEditavel}
                  onChange={(e) => {
                    if (quickAddModal.isEditing || !isDataEditavel) return;
                    setQuickAddCarro(e.target.value.replace(/\D/g, ""));
                    setQuickAddSelectorOpen(true);
                  }}
                  onClick={() => {
                    if (!quickAddModal.isEditing && isDataEditavel) {
                      setQuickAddSelectorOpen(prev => !prev);
                    }
                  }}
                  placeholder="Carro..."
                  className={cn(
                    "font-mono font-bold text-sm rounded-xl pl-9 pr-20 h-11 border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500/20",
                    (quickAddModal.isEditing || !isDataEditavel) ? "opacity-90 bg-muted/50 cursor-not-allowed" : "cursor-pointer"
                  )}
                  maxLength={5}
                  required
                />
                <Bus className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                {!quickAddModal.isEditing && isDataEditavel && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {quickAddCarro && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickAddCarro("");
                          setQuickAddSelectorOpen(false);
                        }}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Limpar campo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickAddSelectorOpen(prev => !prev);
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Abrir lista de veículos"
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", quickAddSelectorOpen && "rotate-180 text-emerald-600")} />
                    </button>
                  </div>
                )}
              </div>

              {/* Painel Suspenso (Dropdown Moderno com Rolagem de Scroll Nativa) */}
              {quickAddSelectorOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#0E1420] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                  {/* Cabeçalho do Dropdown com Filtro Rápido de Empresa */}
                  <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 pl-1">
                      Filtrar por Empresa:
                    </span>
                    <div className="flex items-center gap-1">
                      {(activeGaragemScope === "VCG" && !c4Enabled('VCG') ? ["TODAS", "VCG", "JTU", "VSF"] : activeGaragemScope === "VCM" ? ["TODAS", "VCM"] : ["TODAS", "VCG", "JTU", "VSF", "VCM"]).map(emp => (
                        <button
                          key={emp}
                          type="button"
                          onClick={() => setQuickAddFilterCompany(emp)}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer",
                            quickAddFilterCompany === emp
                              ? "bg-gray-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                              : "text-gray-500 hover:bg-gray-200/60 dark:hover:bg-slate-800"
                          )}
                        >
                          {emp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Carros com Rolagem Suave por Scroll do Mouse */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60">
                    {quickAddFilteredCars.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
                        Nenhum veículo encontrado para a busca "{quickAddCarro}"
                      </div>
                    ) : (
                      quickAddFilteredCars.map(car => {
                        const cons = getConsorciadaByCarro(car.prefixo);
                        const statusCI = getCarStatusInCI(car.prefixo);
                        const isSelected = quickAddCarro === car.prefixo;

                        return (
                          <button
                            key={car.prefixo}
                            type="button"
                            onClick={() => {
                              setQuickAddCarro(car.prefixo);
                              setQuickAddSelectorOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors cursor-pointer group",
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/40"
                                : "hover:bg-gray-50 dark:hover:bg-slate-800/60"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                {car.prefixo}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                                cons === "VCG" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                                cons === "JTU" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                                cons === "VSF" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" :
                                "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                              )}>
                                {cons}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                Garagem {car.garagem}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {statusCI === "BLOQUEADO" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                  Já Bloqueado
                                </span>
                              )}
                              {statusCI === "OFICINA" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                  Em Oficina
                                </span>
                              )}
                              {statusCI === "PREVENTIVA" && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                  Preventiva
                                </span>
                              )}
                              {isSelected && (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Rodapé do Dropdown com quantidade */}
                  <div className="p-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/20 text-center text-[10px] text-gray-400">
                    Mostrando {quickAddFilteredCars.length} de {sortedAllowedCars.length} veículos cadastrados
                  </div>
                </div>
              )}
            </div>

            {/* Chips Rápidos e Campo de Motivo / Defeito (Completamente ocultados para Preventivas e para Elevador, Borracharia, Tacógrafo e Limpeza) */}
            {(() => {
              const isSetorSemDefeito = quickAddModal.category === "PREVENTIVA" || (
                quickAddModal.category === "OFICINA" && 
                SETORES_SEM_MOTIVO_OBRIGATORIO.includes(quickAddModal.subType.toUpperCase() as any)
              );

              if (isSetorSemDefeito) return null;

              return (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground">
                      Motivos sugeridos (clique para aplicar):
                    </Label>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                      {quickAddModal.chips && quickAddModal.chips.map(chip => {
                        const isSelected = !isOutroMotivo && quickAddMotivo === chip;
                        return (
                          <button
                            key={chip}
                            type="button"
                            disabled={!isDataEditavel}
                            onClick={() => {
                              setIsOutroMotivo(false);
                              setQuickAddMotivo(chip);
                            }}
                            className={cn(
                              "text-xs px-3 py-1 rounded-full border transition-all cursor-pointer font-medium",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs scale-[1.02]"
                                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80",
                              !isDataEditavel && "opacity-60 cursor-not-allowed pointer-events-none"
                            )}
                          >
                            {chip}
                          </button>
                        );
                      })}

                      {/* Badge 'Outro' */}
                      <button
                        type="button"
                        disabled={!isDataEditavel}
                        onClick={() => {
                          setIsOutroMotivo(true);
                          if (quickAddModal.chips?.includes(quickAddMotivo)) {
                            setQuickAddMotivo("");
                          }
                        }}
                        className={cn(
                          "text-xs px-3 py-1 rounded-full border transition-all cursor-pointer font-medium flex items-center gap-1",
                          isOutroMotivo
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs scale-[1.02]"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80",
                          !isDataEditavel && "opacity-60 cursor-not-allowed pointer-events-none"
                        )}
                      >
                        <Plus className="w-3 h-3" />
                        Outro
                      </button>
                    </div>
                  </div>

                  {/* Campo de Texto do Defeito: SÓ APARECE se o badge 'Outro' estiver selecionado */}
                  {isOutroMotivo && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150 pt-1">
                      <Label className="text-xs font-bold">
                        Motivo / Defeito {!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG') && <span className="text-rose-500">*</span>}
                      </Label>
                      <Input
                        value={quickAddMotivo}
                        disabled={!isDataEditavel}
                        onChange={(e) => setQuickAddMotivo(e.target.value)}
                        placeholder="Digite o motivo ou defeito do veículo..."
                        className="text-xs h-9"
                        autoFocus
                        required={!c4Enabled(activeGaragemScope === 'VCM' ? 'VCM' : 'VCG')}
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter className="pt-3 border-t flex flex-row items-center justify-between sm:justify-between gap-2">
              {quickAddModal.isEditing ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!isDataEditavel}
                    onClick={handleDeleteQuickCarro}
                    className={cn(
                      "h-8 text-xs gap-1 cursor-pointer",
                      !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                    title={isDataEditavel ? "Excluir da CI" : "Folha fechada para edição"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excluir</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!isDataEditavel}
                    onClick={handleReleaseQuickCarro}
                    className={cn(
                      "h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer",
                      !isDataEditavel && "opacity-40 cursor-not-allowed pointer-events-none"
                    )}
                    title={isDataEditavel ? "Dar baixa e liberar para soltura" : "Folha fechada para edição"}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Liberar (Baixa)</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuickAddModal(prev => ({ ...prev, isOpen: false }))}
                  className="text-xs"
                >
                  {isDataEditavel ? "Cancelar" : "Fechar"}
                </Button>
              )}

              <div className="flex items-center gap-2">
                {quickAddModal.isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickAddModal(prev => ({ ...prev, isOpen: false }))}
                    className="text-xs"
                  >
                    {isDataEditavel ? "Cancelar" : "Fechar"}
                  </Button>
                )}
                {isDataEditavel ? (
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-primary text-primary-foreground text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {quickAddModal.isEditing ? "Salvar Alterações" : "Adicionar à CI"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-xs opacity-50 cursor-not-allowed gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Somente Leitura</span>
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Conflito / Duplicidade de Carro na CI */}
      <Dialog
        open={conflictModal.isOpen}
        onOpenChange={(open) => {
          if (!open) setConflictModal(prev => ({ ...prev, isOpen: false }));
        }}
      >
        <DialogContent className="max-w-md p-5 bg-card border rounded-2xl shadow-xl">
          <DialogHeader className="space-y-2 pb-2 border-b">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Veículo já cadastrado na CI
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Aviso de duplicidade de veículo na mesma data de operação.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <p className="text-foreground">
              O veículo <span className="font-mono font-bold text-sm bg-muted px-2 py-0.5 rounded border">{conflictModal.carro}</span> já consta cadastrado na CI em:
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
              {conflictModal.existingLocations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{loc}</span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Deseja adicionar este carro também em <strong className="text-foreground">{conflictModal.targetLocation}</strong> e <span className="font-semibold text-emerald-600 dark:text-emerald-400">manter o registro nos locais anteriores</span>?
            </p>
          </div>

          <DialogFooter className="pt-3 border-t flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConflictModal(prev => ({ ...prev, isOpen: false }))}
              className="text-xs cursor-pointer"
            >
              Cancelar (Não adicionar)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={conflictModal.onConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              Confirmar e Manter em Ambos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
