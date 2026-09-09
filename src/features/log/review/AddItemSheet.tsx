import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { NumberField } from '@/components/ui/NumberField';
import type { FoodItem } from '@/lib/db/types';
import { newId } from '@/lib/id';
import { useEnergyUnit } from '@/components/ui/KcalKj';
import { energyToKcal } from '@/lib/nutrition/units';

export function AddItemSheet({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (item: FoodItem) => void;
}) {
  const unit = useEnergyUnit();
  const [name, setName] = useState('');
  const [grams, setGrams] = useState<number | ''>('');
  const [energy, setEnergy] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [fibre, setFibre] = useState<number | ''>('');

  function submit() {
    if (!name.trim() || typeof energy !== 'number') return;
    onAdd({
      id: newId(),
      name: name.trim(),
      grams: typeof grams === 'number' && grams > 0 ? grams : 100,
      scale: 1,
      per: {
        kcal: energyToKcal(energy, unit),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fibre: Number(fibre) || 0,
      },
      confidence: 'high',
      ref: { kind: 'manual' },
      userEdited: true,
    });
    setName('');
    setGrams('');
    setEnergy('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFibre('');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add an item by hand">
      <div className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="manual-name">
            Name
          </label>
          <input
            id="manual-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tim Tam"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Grams" value={grams} onChange={setGrams} unit="g" min={1} />
          <NumberField label="Energy" value={energy} onChange={setEnergy} unit={unit} min={0} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          <NumberField label="Protein" value={protein} onChange={setProtein} unit="g" min={0} />
          <NumberField label="Carbs" value={carbs} onChange={setCarbs} unit="g" min={0} />
          <NumberField label="Fat" value={fat} onChange={setFat} unit="g" min={0} />
          <NumberField label="Fibre" value={fibre} onChange={setFibre} unit="g" min={0} />
        </div>
        <button
          className="btn-primary"
          onClick={submit}
          disabled={!name.trim() || typeof energy !== 'number'}
        >
          Add item
        </button>
      </div>
    </Sheet>
  );
}
