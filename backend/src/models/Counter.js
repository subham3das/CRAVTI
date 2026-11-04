import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model('Counter', counterSchema);

export const getNextOrderNumber = async (year = 2027) => {
  const counterId = `order_${year}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(6, '0');
  return `CRV-${year}-${padded}`;
};

export const getNextReceiptNumber = async (prefix = 'CRV', year = 2027) => {
  const safePrefix = (prefix || 'CRV').toUpperCase().trim().slice(0, 5);
  const counterId = `receipt_${safePrefix}_${year}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.seq).padStart(6, '0');
  return `${safePrefix}-RCP-${year}-${padded}`;
};


