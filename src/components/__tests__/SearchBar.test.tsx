import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../collection/SearchBar';

describe('SearchBar', () => {
  it('renders with placeholder text', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by artist, album, or label...');
    expect(input).toBeInTheDocument();
  });

  it('displays the current value', () => {
    const onChange = vi.fn();
    render(<SearchBar value="Beatles" onChange={onChange} />);

    const input = screen.getByDisplayValue('Beatles');
    expect(input).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by artist, album, or label...');
    fireEvent.change(input, { target: { value: 'Pink Floyd' } });

    expect(onChange).toHaveBeenCalledWith('Pink Floyd');
  });

  it('calls onChange on each keystroke', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by artist, album, or label...');

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('renders search icon', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    // The search icon is an SVG within the component
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('updates display when value prop changes', () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchBar value="initial" onChange={onChange} />);

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<SearchBar value="updated" onChange={onChange} />);

    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('initial')).not.toBeInTheDocument();
  });

  it('handles empty string value', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by artist, album, or label...') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('handles special characters in search', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Search by artist, album, or label...');
    fireEvent.change(input, { target: { value: 'AC/DC & The Who' } });

    expect(onChange).toHaveBeenCalledWith('AC/DC & The Who');
  });
});
