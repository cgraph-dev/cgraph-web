/**
 * @heroicons/react/20/solid — lightweight mock for vitest.
 *
 * Kept explicit so icon imports cannot resolve to a thenable proxy.
 *
 */
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

const icon = (name: string) => {
  const Icon = (props: IconProps) =>
    React.createElement('svg', { 'data-testid': `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

export const PlaceholderIcon = icon('PlaceholderIcon');
