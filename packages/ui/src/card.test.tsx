import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card title="Test Card" href="/test">
        Card Content
      </Card>,
    );

    expect(screen.getByText('Test Card')).toBeDefined();
    expect(screen.getByText('Card Content')).toBeDefined();
  });
});
