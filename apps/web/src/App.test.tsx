import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Itsuki Studio storefront', () => {
  it('renders the brand, hero and two products', () => {
    render(<App/>);
    expect(screen.getByRole('heading', { name: /light up your moments/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /wave lamp/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /geometric lamp/i })).toBeInTheDocument();
  });

  it('adds a product to the bag', async () => {
    const user = userEvent.setup();
    render(<App/>);
    await user.click(screen.getAllByRole('button', { name: /add .* to bag/i })[0]);
    expect(screen.getByRole('status')).toHaveTextContent(/1 piece in your bag/i);
  });

  it('shows a confirmation after newsletter submission', async () => {
    const user = userEvent.setup();
    render(<App/>);
    await user.type(screen.getByLabelText(/email address/i), 'hello@example.com');
    await user.click(screen.getByRole('button', { name: /subscribe/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/thank you/i);
  });
});
