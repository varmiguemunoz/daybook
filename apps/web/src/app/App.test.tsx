import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Brand } from '../shared/ui/Brand';

describe('Brand', () => {
  it('renders the product name for assistive tech', () => {
    expect(renderToStaticMarkup(<Brand />)).toContain('Gr8r');
  });
});
