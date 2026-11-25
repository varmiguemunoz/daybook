import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Brand } from '../modules/core/components/Brand';

describe('Brand', () => {
  it('renders the product name for assistive tech', () => {
    expect(renderToStaticMarkup(<Brand />)).toContain('Daybook');
  });
});
