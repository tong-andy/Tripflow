import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExpenseForm, PurchaseForm } from './ArchiveForms';
import type { Trip } from '../../types/trip';

const trip: Trip = {
  id: 'trip-1', name: '测试旅行', destination: '东京', departureLocation: '上海',
  startDate: '2026-09-01', endDate: '2026-09-02', timezone: 'Asia/Tokyo', travelNote: null,
  days: [], preparationItems: [], itineraryItems: [], destinations: [],
  budgetAmount: null, budgetCurrency: null, createdAt: '', updatedAt: '',
};

describe('archive amount inputs', () => {
  it('starts empty and submits a newly typed expense amount', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ExpenseForm trip={trip} busy={false} onCancel={() => undefined} onSubmit={onSubmit} />);

    const amount = screen.getByLabelText('消费金额');
    expect(amount).toHaveValue(null);
    await user.type(screen.getByLabelText('消费名称'), '晚餐');
    await user.type(amount, '128.5');
    await user.click(screen.getByRole('button', { name: '添加' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 128.5 }));
  });

  it('allows an edited purchase amount to be cleared and replaced', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PurchaseForm trip={trip} item={{ id: 'purchase-1', tripId: trip.id, date: trip.startDate, title: '礼物', amount: 0, currency: 'CNY', location: '', recipient: '', notes: '', organized: false, purchased: false, includeInExpenses: false, createdAt: '', updatedAt: '' }} busy={false} onCancel={() => undefined} onSubmit={onSubmit} />);

    const amount = screen.getByLabelText('金额');
    await user.clear(amount);
    expect(amount).toHaveValue(null);
    await user.type(amount, '56');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 56 }));
  });
});
