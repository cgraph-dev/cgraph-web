/**
 * Storybook stories for the Toast notification component.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { ToastContainer, toast } from './toast';

const meta: Meta<typeof ToastContainer> = {
  title: 'UI/Toast',
  component: ToastContainer,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative min-h-[300px] bg-[var(--token-bg-primary)] p-8">
        <Story />
        <ToastContainer />
      </div>
    ),
  ],
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  render: () => (
    <Button
      variant="success"
      onClick={() => toast.success('Success', 'Your changes have been saved.')}
    >
      Show Success Toast
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button
      variant="danger"
      onClick={() => toast.error('Error', 'Failed to send message. Please try again.')}
    >
      Show Error Toast
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="secondary"
      onClick={() => toast.warning('Warning', 'Your session expires in 5 minutes.')}
    >
      Show Warning Toast
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.info('Info', 'A new version is available.')}
    >
      Show Info Toast
    </Button>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="success"
        size="sm"
        onClick={() => toast.success('Saved', 'Settings updated.')}
      >
        Success
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => toast.error('Error', 'Connection failed.')}
      >
        Error
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => toast.warning('Warning', 'Low storage.')}
      >
        Warning
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast.info('Tip', 'Press Ctrl+K for quick search.')}
      >
        Info
      </Button>
    </div>
  ),
};
