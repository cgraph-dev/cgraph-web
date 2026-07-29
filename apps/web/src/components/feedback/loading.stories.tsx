import type { Meta, StoryObj } from '@storybook/react';
import Card from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import { LoadingOverlay } from './loading';

const meta = {
  title: 'Feedback/LoadingOverlay',
  component: LoadingOverlay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Saving changes',
  },
  render: (args) => (
    <Card className="relative h-60 w-80" padding="lg">
      <div className="space-y-3" aria-hidden="true">
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="66%" />
      </div>
      <LoadingOverlay {...args} />
    </Card>
  ),
};
