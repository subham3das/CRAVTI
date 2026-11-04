import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { Button } from './Button';

const COUNT_OPTIONS = [10, 20, 30, 50];
const FLOOR_OPTIONS = ['Ground Floor', 'First Floor', 'Second Floor', 'Rooftop', 'Basement'];

export default function BulkTableModal({ isOpen, onClose, onConfirm, loading, existingCount }) {
  const [count, setCount] = useState(10);
  const [floor, setFloor] = useState('Ground Floor');
  const [capacity, setCapacity] = useState(4);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
          <h3 className="font-semibold text-[#0F172A]">Bulk Generate Tables</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <FiX size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Count */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-2">Number of Tables</label>
            <div className="grid grid-cols-4 gap-2">
              {COUNT_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    count === n
                      ? 'bg-[#16A34A] text-white border-[#16A34A]'
                      : 'border-[#E2E8F0] text-slate-600 hover:border-[#16A34A]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Floor</label>
            <select
              value={floor}
              onChange={e => setFloor(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
            >
              {FLOOR_OPTIONS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-[#0F172A] mb-1">Default Capacity</label>
            <input
              type="number"
              min={1}
              max={20}
              value={capacity}
              onChange={e => setCapacity(parseInt(e.target.value) || 4)}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30"
            />
          </div>

          {/* Preview text */}
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500">
            Will create <strong className="text-[#0F172A]">Table 1</strong> through{' '}
            <strong className="text-[#0F172A]">Table {count}</strong>
            {existingCount > 0 && `, skipping ${existingCount} already existing`}.
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            className="flex-1"
            isLoading={loading}
            onClick={() => onConfirm({ count, floor, capacity })}
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
