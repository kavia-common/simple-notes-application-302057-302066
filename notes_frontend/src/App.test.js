import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app brand', async () => {
  render(<App />);
  const brand = await screen.findByText(/simple notes/i);
  expect(brand).toBeInTheDocument();
});

test('loads notes from localStorage by default (seed note)', async () => {
  render(<App />);
  // Seed note title should appear in the list in local mode.
  const seed = await screen.findByText(/welcome to simple notes/i);
  expect(seed).toBeInTheDocument();
});
