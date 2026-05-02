/** @module type-picker tests */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TypePicker } from './type-picker';

describe('TypePicker', () => {
  it('defaults to Cloud on web', () => {
    const { getByLabelText } = render(<TypePicker onChange={vi.fn()} />);
    expect(getByLabelText('Cloud Chat')).toBeChecked();
  });

  it('calls onChange when user picks Secret', async () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(<TypePicker onChange={onChange} />);
    await userEvent.click(getByLabelText('Secret Chat'));
    expect(onChange).toHaveBeenCalledWith('secret');
  });

  it('respects defaultValue when provided', () => {
    const { getByLabelText } = render(<TypePicker onChange={vi.fn()} defaultValue="secret" />);
    expect(getByLabelText('Secret Chat')).toBeChecked();
  });
});
